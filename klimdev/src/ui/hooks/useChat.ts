// useChat — manages the chat session state and streaming logic.
// Returns the current messages, streaming state, and a sendMessage function.

import { useState, useCallback, useRef } from "react";
import { ChatMessage, TokenUsage } from "../../api/types.js";
import { SessionState, makeInitialState, runStreamingChat } from "../../core/session.js";
import { makeSessionId } from "../../core/history.js";
import { computeTPS } from "../../utils/time.js";

export function useChat(initialModelId: string) {
  const sessionId = useRef(makeSessionId());

  const [state, setState] = useState<SessionState>(() =>
    makeInitialState(sessionId.current)
  );

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    if (state.status === "streaming") return;

    const userMessage: ChatMessage = { role: "user", content: text.trim() };

    // Optimistically add the user message and mark as streaming
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      status: "streaming",
      streamingContent: "",
      lastError: null,
    }));

    await runStreamingChat(
      { ...state, messages: [...state.messages, userMessage] },
      text.trim(),
      {
        onToken: (token) => {
          setState((prev) => ({
            ...prev,
            streamingContent: prev.streamingContent + token,
          }));
        },
        onDone: (usage: TokenUsage | null, durationMs: number) => {
          setState((prev) => {
            const assistantMsg: ChatMessage = {
              role: "assistant",
              content: prev.streamingContent,
            };
            const completionTokens = usage?.completion_tokens ?? 0;
            const newCompletion = prev.completionTokens + completionTokens;
            const newPrompt = prev.promptTokens + (usage?.prompt_tokens ?? 0);

            return {
              ...prev,
              messages: [...prev.messages, assistantMsg],
              status: "idle",
              streamingContent: "",
              lastError: null,
              requestCount: prev.requestCount + 1,
              completionTokens: newCompletion,
              promptTokens: newPrompt,
              totalTokens: newPrompt + newCompletion,
              lastDurationMs: durationMs,
              tokensPerSecond: computeTPS(completionTokens, durationMs),
            };
          });
        },
        onError: (message) => {
          setState((prev) => ({
            ...prev,
            status: "error",
            streamingContent: "",
            lastError: message,
          }));
        },
      }
    );
  }, [state]);

  const clearSession = useCallback(() => {
    sessionId.current = makeSessionId();
    setState(makeInitialState(sessionId.current));
  }, []);

  return {
    state,
    sessionId: sessionId.current,
    sendMessage,
    clearSession,
  };
}
