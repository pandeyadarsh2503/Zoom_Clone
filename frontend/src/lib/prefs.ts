/**
 * User meeting preferences — persisted to localStorage and applied when you
 * join a room. Unlike the old mock settings, these have real effects:
 *   - muteOnJoin / videoOffOnJoin → the room starts in that state
 *   - chatSound                  → a soft tone plays on incoming chat
 *   - desktopNotifications       → requests the browser Notification permission
 */
export interface Prefs {
  muteOnJoin: boolean;
  videoOffOnJoin: boolean;
  chatSound: boolean;
  desktopNotifications: boolean;
}

const KEY = "zc.prefs";

export const DEFAULT_PREFS: Prefs = {
  muteOnJoin: false,
  videoOffOnJoin: false,
  chatSound: true,
  desktopNotifications: false,
};

export function getPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

/** Short, quiet notification tone (used for incoming chat). Best-effort. */
export function playChime(): void {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
    osc.onended = () => ctx.close();
  } catch {
    /* audio unavailable — ignore */
  }
}
