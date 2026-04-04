// useKeyboard — centralised keyboard handler for the whole app.
// Maps key combos to actions and dispatches them to the appropriate panel.

import { useInput } from "ink";
import { SidebarSection } from "../components/Sidebar.js";

export type ActivePanel = "sidebar" | "chat";

interface KeyboardHandlers {
  // Sidebar navigation
  sidebarUp: () => void;
  sidebarDown: () => void;
  sidebarActivate: () => void;

  // Chat input
  inputChar: (char: string) => void;
  inputBackspace: () => void;
  inputSubmit: () => void;
  inputClear: () => void;

  // Panel switching
  switchPanel: () => void;
  switchSidebarSection: (section: SidebarSection) => void;

  // Session management
  newSession: () => void;
}

export function useKeyboard(
  activePanel: ActivePanel,
  handlers: KeyboardHandlers
) {
  useInput((input, key) => {
    // Global: quit
    if (key.ctrl && input === "c") {
      process.exit(0);
    }

    // Global: switch active panel with Tab
    if (key.tab) {
      handlers.switchPanel();
      return;
    }

    // Global: new session
    if (key.ctrl && input === "n") {
      handlers.newSession();
      return;
    }

    // Global: focus model panel
    if (key.ctrl && input === "m") {
      handlers.switchSidebarSection("models");
      return;
    }

    if (activePanel === "sidebar") {
      if (key.upArrow) {
        handlers.sidebarUp();
        return;
      }
      if (key.downArrow) {
        handlers.sidebarDown();
        return;
      }
      if (key.return) {
        handlers.sidebarActivate();
        return;
      }
    }

    if (activePanel === "chat") {
      if (key.return) {
        handlers.inputSubmit();
        return;
      }

      if (key.escape) {
        handlers.inputClear();
        return;
      }

      if (key.backspace || key.delete) {
        handlers.inputBackspace();
        return;
      }

      // Printable character
      if (input && !key.ctrl && !key.meta) {
        handlers.inputChar(input);
        return;
      }
    }
  });
}
