import { killDesktop } from "@/lib/sandbox/utils";

// Called with navigator.sendBeacon when a tab closes or a desktop is replaced.
// The signed token proves the caller created this sandbox, so nobody else can stop it.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sandboxId = body?.sandboxId;
  const token = body?.token;

  if (typeof sandboxId !== "string" || typeof token !== "string") {
    return new Response("Missing sandboxId or token", { status: 400 });
  }

  const ok = await killDesktop(sandboxId, token);
  return new Response(ok ? "Stopped" : "Not allowed or already stopped", {
    status: ok ? 200 : 403,
  });
}