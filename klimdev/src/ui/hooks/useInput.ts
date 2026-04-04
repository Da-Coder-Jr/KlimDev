// useInput — manages the text input buffer for the chat input bar.
// Handles character insertion, backspace, and clear.

import { useState, useCallback } from "react";

export function useInputBuffer() {
  const [value, setValue] = useState("");
  const [cursorOffset, setCursorOffset] = useState(0);

  const appendChar = useCallback((char: string) => {
    setValue((prev) => prev + char);
    setCursorOffset((prev) => prev + char.length);
  }, []);

  const deleteChar = useCallback(() => {
    setValue((prev) => prev.slice(0, -1));
    setCursorOffset((prev) => Math.max(0, prev - 1));
  }, []);

  const clear = useCallback(() => {
    setValue("");
    setCursorOffset(0);
  }, []);

  const consume = useCallback((): string => {
    const current = value;
    setValue("");
    setCursorOffset(0);
    return current;
  }, [value]);

  return {
    value,
    cursorOffset,
    appendChar,
    deleteChar,
    clear,
    consume,
  };
}
