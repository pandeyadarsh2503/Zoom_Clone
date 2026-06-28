import { create } from "zustand";
import type { ParticipantWithUser } from "@/types/participant";
import type { ChatMessage } from "@/types/chat";

interface RoomState {
  /** All participants currently in the room, keyed by user_id. */
  participants: Map<string, ParticipantWithUser>;
  /** The local camera/microphone MediaStream. */
  localStream: MediaStream | null;
  /** Whether the local microphone is muted. */
  isMuted: boolean;
  /** Whether the local camera is disabled. */
  isVideoOff: boolean;
  /** Whether the local screen share is active. */
  isSharingScreen: boolean;
  /** In-room chat messages, ordered oldest → newest. */
  messages: ChatMessage[];
  /** True when the WebSocket signaling connection is established. */
  isConnected: boolean;

  // ── Participant actions ─────────────────────────────────────
  addParticipant: (participant: ParticipantWithUser) => void;
  removeParticipant: (userId: string) => void;
  updateParticipant: (userId: string, patch: Partial<ParticipantWithUser>) => void;

  // ── Media actions ───────────────────────────────────────────
  setLocalStream: (stream: MediaStream | null) => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  setIsSharingScreen: (sharing: boolean) => void;

  // ── Chat actions ────────────────────────────────────────────
  addMessage: (message: ChatMessage) => void;

  // ── Connection actions ──────────────────────────────────────
  setConnected: (connected: boolean) => void;

  /** Reset all room state when leaving a call. */
  reset: () => void;
}

const INITIAL_STATE = {
  participants: new Map<string, ParticipantWithUser>(),
  localStream: null,
  isMuted: false,
  isVideoOff: false,
  isSharingScreen: false,
  messages: [] as ChatMessage[],
  isConnected: false,
};

/**
 * Room store — ephemeral state that lives only during an active call.
 *
 * `reset()` is called when the user leaves the room, ensuring no stale
 * media streams or participant lists bleed into the next session.
 */
export const useRoomStore = create<RoomState>()((set) => ({
  ...INITIAL_STATE,

  addParticipant: (participant) =>
    set((state) => {
      const next = new Map(state.participants);
      next.set(participant.user_id, participant);
      return { participants: next };
    }),

  removeParticipant: (userId) =>
    set((state) => {
      const next = new Map(state.participants);
      next.delete(userId);
      return { participants: next };
    }),

  updateParticipant: (userId, patch) =>
    set((state) => {
      const existing = state.participants.get(userId);
      if (!existing) return {};
      const next = new Map(state.participants);
      next.set(userId, { ...existing, ...patch });
      return { participants: next };
    }),

  setLocalStream: (localStream) => set({ localStream }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  toggleVideo: () => set((s) => ({ isVideoOff: !s.isVideoOff })),
  setIsSharingScreen: (isSharingScreen) => set({ isSharingScreen }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setConnected: (isConnected) => set({ isConnected }),

  reset: () =>
    set({
      ...INITIAL_STATE,
      participants: new Map(),
      messages: [],
    }),
}));
