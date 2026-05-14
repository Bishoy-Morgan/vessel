import { getDesktop } from "./utils";

const wait = async (seconds: number) => {
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

export const resolution = { x: 1024, y: 768 };

const DISPLAY_ENV = { DISPLAY: ":99" };

const keyMap: Record<string, string> = {
  Return: "Return",
  enter: "Return",
  tab: "Tab",
  space: "space",
  backspace: "BackSpace",
  delete: "Delete",
  escape: "Escape",
  up: "Up",
  down: "Down",
  left: "Left",
  right: "Right",
  home: "Home",
  end: "End",
  pageup: "Prior",
  pagedown: "Next",
  f1: "F1",
  f2: "F2",
  f3: "F3",
  f4: "F4",
  f5: "F5",
  f6: "F6",
  f7: "F7",
  f8: "F8",
  f9: "F9",
  f10: "F10",
  f11: "F11",
  f12: "F12",
  shift: "Shift_L",
  control: "Control_L",
  ctrl: "Control_L",
  alt: "Alt_L",
  super: "Super_L",
  meta: "Super_L",
};

function mapKey(key: string): string {
  if (key.includes("+")) {
    return key
      .split("+")
      .map((part) => keyMap[part.toLowerCase()] || part)
      .join("+");
  }
  return keyMap[key.toLowerCase()] || keyMap[key] || key;
}

// ---------------------------------------------------------------------------
// computerExecute — raw execute function called directly by route.ts
// Returns { type: "image", data: base64 } for screenshots
// Returns { type: "text", text: string } for all other actions
// ---------------------------------------------------------------------------
export const computerExecute = (sandboxId: string) =>
  async ({
    action,
    coordinate,
    text,
    duration,
    scroll_amount,
    scroll_direction,
    start_coordinate,
  }: {
    action: string;
    coordinate?: number[];
    text?: string;
    duration?: number;
    scroll_amount?: number;
    scroll_direction?: string;
    start_coordinate?: number[];
  }): Promise<
    { type: "image"; data: string } | { type: "text"; text: string }
  > => {
    const sandbox = await getDesktop(sandboxId);

    switch (action) {
      case "screenshot": {
        await sandbox.runCommand({
          cmd: "import",
          args: ["-window", "root", "/tmp/screenshot.png"],
          env: DISPLAY_ENV,
        });
        const buffer = await sandbox.readFileToBuffer({
          path: "/tmp/screenshot.png",
        });
        if (!buffer) throw new Error("Failed to read screenshot");
        return { type: "image", data: buffer.toString("base64") };
      }
      case "wait": {
        if (!duration) throw new Error("Duration required for wait action");
        const actualDuration = Math.min(duration, 2);
        await wait(actualDuration);
        return { type: "text", text: `Waited for ${actualDuration} seconds` };
      }
      case "left_click": {
        if (!coordinate) throw new Error("Coordinate required for left_click");
        const [x, y] = coordinate;
        await sandbox.runCommand({
          cmd: "xdotool",
          args: ["mousemove", "--sync", String(x), String(y), "click", "1"],
          env: DISPLAY_ENV,
        });
        return { type: "text", text: `Left clicked at ${x}, ${y}` };
      }
      case "double_click": {
        if (!coordinate) throw new Error("Coordinate required for double_click");
        const [x, y] = coordinate;
        await sandbox.runCommand({
          cmd: "xdotool",
          args: [
            "mousemove", "--sync", String(x), String(y),
            "click", "--repeat", "2", "1",
          ],
          env: DISPLAY_ENV,
        });
        return { type: "text", text: `Double clicked at ${x}, ${y}` };
      }
      case "right_click": {
        if (!coordinate) throw new Error("Coordinate required for right_click");
        const [x, y] = coordinate;
        await sandbox.runCommand({
          cmd: "xdotool",
          args: ["mousemove", "--sync", String(x), String(y), "click", "3"],
          env: DISPLAY_ENV,
        });
        return { type: "text", text: `Right clicked at ${x}, ${y}` };
      }
      case "mouse_move": {
        if (!coordinate) throw new Error("Coordinate required for mouse_move");
        const [x, y] = coordinate;
        await sandbox.runCommand({
          cmd: "xdotool",
          args: ["mousemove", "--sync", String(x), String(y)],
          env: DISPLAY_ENV,
        });
        return { type: "text", text: `Moved mouse to ${x}, ${y}` };
      }
      case "type": {
        if (!text) throw new Error("Text required for type action");
        await sandbox.runCommand({
          cmd: "xdotool",
          args: ["type", "--clearmodifiers", text],
          env: DISPLAY_ENV,
        });
        return { type: "text", text: `Typed: ${text}` };
      }
      case "key": {
        if (!text) throw new Error("Key required for key action");
        const mappedKey = mapKey(text);
        await sandbox.runCommand({
          cmd: "xdotool",
          args: ["key", mappedKey],
          env: DISPLAY_ENV,
        });
        return { type: "text", text: `Pressed key: ${text}` };
      }
      case "scroll": {
        if (!scroll_direction)
          throw new Error("scroll_direction required for scroll");
        if (!scroll_amount)
          throw new Error("scroll_amount required for scroll");
        const button = scroll_direction === "up" ? "4" : "5";
        await sandbox.runCommand({
          cmd: "xdotool",
          args: ["click", "--repeat", String(scroll_amount), button],
          env: DISPLAY_ENV,
        });
        return {
          type: "text",
          text: `Scrolled ${scroll_direction} by ${scroll_amount}`,
        };
      }
      case "left_click_drag": {
        if (!start_coordinate || !coordinate)
          throw new Error("Coordinates required for drag");
        const [startX, startY] = start_coordinate;
        const [endX, endY] = coordinate;
        await sandbox.runCommand({
          cmd: "xdotool",
          args: [
            "mousemove", String(startX), String(startY),
            "mousedown", "1",
            "mousemove", "--sync", String(endX), String(endY),
            "mouseup", "1",
          ],
          env: DISPLAY_ENV,
        });
        return {
          type: "text",
          text: `Dragged from ${startX},${startY} to ${endX},${endY}`,
        };
      }
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  };

// ---------------------------------------------------------------------------
// bashExecute — raw execute function called directly by route.ts
// ---------------------------------------------------------------------------
export const bashExecute = (sandboxId: string) =>
  async ({ command }: { command: string }): Promise<string> => {
    const sandbox = await getDesktop(sandboxId);
    try {
      const result = await sandbox.runCommand({
        cmd: "bash",
        args: ["-c", command],
        env: DISPLAY_ENV,
      });
      const stdout = await result.stdout();
      return stdout || "(Command executed successfully with no output)";
    } catch (error) {
      return error instanceof Error
        ? `Error executing command: ${error.message}`
        : `Error executing command: ${String(error)}`;
    }
  };