"use client";

/**
 * useMeetingSocket — React lifecycle wrapper around {@link MeetingSocket}.
 *
 * The socket is created lazily in render (so `on()`/`send()` work from consumer
 * effects immediately) and connected/torn-down in an effect — no leaks, strict-
 * mode safe. A stable `pid` is generated once for the session.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { MeetingSocket, type RTStatus } from "@/lib/realtime/socket";

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID().replace(/-/g, "");
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export interface UseMeetingSocket {
  status: RTStatus;
  pid: string;
  send: (type: string, data?: Record<string, unknown>) => void;
  on: (type: string, h: (data: any) => void) => () => void;
}

export function useMeetingSocket(code: string, name: string, enabled = true): UseMeetingSocket {
  const [status, setStatus] = useState<RTStatus>("connecting");
  const pidRef = useRef<string>("");
  if (!pidRef.current) pidRef.current = randomId();

  const sockRef = useRef<MeetingSocket | null>(null);
  const nameRef = useRef(name);
  nameRef.current = name;

  if (enabled && code && !sockRef.current) {
    sockRef.current = new MeetingSocket(code, nameRef.current, pidRef.current, setStatus);
  }

  useEffect(() => {
    if (!enabled || !code) return;
    const s = sockRef.current;
    if (!s) return;
    s.connect();
    return () => {
      s.close();
      sockRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, enabled]);

  const send = useCallback((type: string, data: Record<string, unknown> = {}) => sockRef.current?.send(type, data), []);
  const on = useCallback((type: string, h: (data: any) => void) => sockRef.current?.on(type, h) ?? (() => {}), []);

  return { status, pid: pidRef.current, send, on };
}
