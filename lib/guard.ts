import { createHmac, timingSafeEqual } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const TOKEN_TTL_MS = 10 * 60 * 1000;

function secret() {
    const s = process.env.DEMO_SECRET;
    if (!s) throw new Error("DEMO_SECRET is not set");
    return s;
}

// A token proves this sandbox was created by this server, recently.
export function signSandbox(sandboxId: string) {
    const payload = Buffer.from(
        JSON.stringify({ id: sandboxId, exp: Date.now() + TOKEN_TTL_MS }),
    ).toString("base64url");
    const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
    return `${payload}.${sig}`;
}

export function verifySandbox(token: string | undefined, sandboxId: string | undefined) {
    if (!token || !sandboxId) return false;
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return false;
    const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
    try {
        const { id, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
        return id === sandboxId && typeof exp === "number" && exp > Date.now();
    } catch {
        return false;
    }
}

const redis = process.env.UPSTASH_REDIS_REST_URL ? Redis.fromEnv() : null;

const num = (v: string | undefined, d: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : d;
};

const limiters = redis
    ? {
            sandbox: new Ratelimit({
                redis,
                limiter: Ratelimit.slidingWindow(num(process.env.LIMIT_SANDBOX_PER_HOUR, 3), "1 h"),
                prefix: "vessel:sandbox",
            }),
            runs: new Ratelimit({
                redis,
                limiter: Ratelimit.slidingWindow(num(process.env.LIMIT_RUNS_PER_DAY, 10), "1 d"),
                prefix: "vessel:runs",
            }),
            global: new Ratelimit({
                redis,
                limiter: Ratelimit.slidingWindow(num(process.env.LIMIT_GLOBAL_PER_DAY, 150), "1 d"),
                prefix: "vessel:global",
            }),
        }
    : null;

export function ipFrom(h: Headers) {
    return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

type Gate = { ok: true } | { ok: false; error: string };

export async function checkLimit(kind: "sandbox" | "runs", ip: string): Promise<Gate> {
    if (!limiters) {
        // Without Redis, allow in development and refuse in production.
        return process.env.NODE_ENV === "production"
            ? { ok: false, error: "The demo is temporarily unavailable." }
            : { ok: true };
    }
    try {
        const personal = await limiters[kind].limit(ip);
        if (!personal.success) {
            return {
                ok: false,
                error:
                kind === "sandbox"
                    ? "Too many desktops started. Try again in an hour."
                    : "Daily demo limit reached. Come back tomorrow, or run it yourself from the repo.",
            };
        }
        if (kind === "runs") {
            const g = await limiters.global.limit("all");
            if (!g.success) {
                return { ok: false, error: "The demo has reached its daily capacity. Please try again tomorrow." };
            }
        }
        return { ok: true };
    } catch {
        return { ok: false, error: "The demo is temporarily unavailable." };
    }
}