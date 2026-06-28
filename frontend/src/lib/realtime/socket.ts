/**
 * MeetingSocket — typed WebSocket client for the live meeting backend.
 *
 * Mirrors `app/websocket/events.py`. Adds the production concerns a raw socket
 * lacks: an `on()` event-emitter (→ unsubscribe), auto-reconnect with backoff
 * and a stable `pid` so identity survives drops, a heartbeat ping, and a clean
 * `close()` so React effects leave nothing running.
 */

export type RTHandler = (data: any) => void;
export type RTStatus = "connecting" | "connected" | "reconnecting" | "closed";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function wsUrl(code: string, name: string, pid: string): string {
  const base = API_BASE.replace(/^http/i, "ws").replace(/\/+$/, "");
  const q = new URLSearchParams({ name, pid });
  return `${base}/api/v1/ws/meetings/${encodeURIComponent(code)}?${q.toString()}`;
}

export class MeetingSocket {
  private ws: WebSocket | null = null;
  private readonly handlers = new Map<string, Set<RTHandler>>();
  private closedByUser = false;
  private attempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly code: string,
    private readonly name: string,
    public readonly pid: string,
    private readonly onStatus?: (s: RTStatus) => void,
  ) {}

  connect() {
    this.closedByUser = false;
    this.open();
  }

  on(type: string, h: RTHandler): () => void {
    let set = this.handlers.get(type);
    if (!set) this.handlers.set(type, (set = new Set()));
    set.add(h);
    return () => set!.delete(h);
  }

  send(type: string, data: Record<string, unknown> = {}) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ type, data }));
  }

  close() {
    this.closedByUser = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.ws?.close();
    this.ws = null;
    this.handlers.clear();
  }

  private open() {
    this.onStatus?.(this.attempts === 0 ? "connecting" : "reconnecting");
    const ws = new WebSocket(wsUrl(this.code, this.name, this.pid));
    this.ws = ws;

    ws.onopen = () => {
      this.attempts = 0;
      this.onStatus?.("connected");
      this.pingTimer = setInterval(() => this.send("ping"), 25000);
    };
    ws.onmessage = (ev) => {
      let msg: { type?: string; data?: unknown };
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.type) this.handlers.get(msg.type)?.forEach((h) => { try { h(msg.data ?? {}); } catch (e) { console.error(e); } });
    };
    ws.onclose = (ev) => {
      if (this.pingTimer) clearInterval(this.pingTimer);
      if (this.closedByUser || ev.code === 4404) { this.onStatus?.("closed"); return; }
      this.onStatus?.("reconnecting");
      const delay = Math.min(10000, 1000 * 2 ** this.attempts);
      this.attempts += 1;
      this.reconnectTimer = setTimeout(() => this.open(), delay);
    };
    ws.onerror = () => { /* onclose drives reconnect */ };
  }
}
