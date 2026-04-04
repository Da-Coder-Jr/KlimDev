// Chat history management.
// Keeps an in-memory list of messages for the current session
// and serializes/deserializes from disk for persistence.

import { ChatMessage } from "../api/types.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const HISTORY_DIR = join(homedir(), ".klimdev", "sessions");

export interface Session {
  id: string;
  name: string;
  createdAt: Date;
  messages: ChatMessage[];
}

function sessionPath(id: string): string {
  return join(HISTORY_DIR, `${id}.json`);
}

function ensureDir(): void {
  if (!existsSync(HISTORY_DIR)) {
    mkdirSync(HISTORY_DIR, { recursive: true });
  }
}

export function saveSession(session: Session): void {
  ensureDir();
  writeFileSync(sessionPath(session.id), JSON.stringify(session, null, 2), "utf8");
}

export function loadSession(id: string): Session | null {
  const path = sessionPath(id);
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, "utf8");
    const data = JSON.parse(raw) as Session;
    data.createdAt = new Date(data.createdAt);
    return data;
  } catch {
    return null;
  }
}

export function listSessions(): Session[] {
  ensureDir();
  const { readdirSync } = require("fs") as typeof import("fs");
  try {
    const files = readdirSync(HISTORY_DIR).filter((f: string) => f.endsWith(".json"));
    return files
      .map((f: string) => loadSession(f.replace(".json", "")))
      .filter((s: Session | null): s is Session => s !== null)
      .sort((a: Session, b: Session) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch {
    return [];
  }
}

export function makeSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function generateSessionName(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New Session";
  const snippet = first.content.slice(0, 40).replace(/\n/g, " ");
  return snippet.length < first.content.length ? snippet + "…" : snippet;
}
