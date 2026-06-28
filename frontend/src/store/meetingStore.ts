import { create } from "zustand";
import type { Meeting } from "@/types/meeting";

interface MeetingState {
  /** All meetings visible to the current user. */
  meetings: Meeting[];
  /** The meeting currently being viewed or managed. */
  currentMeeting: Meeting | null;
  /** True while an async operation is in progress. */
  isLoading: boolean;
  /** Human-readable error from the last failed operation, or null. */
  error: string | null;

  setMeetings: (meetings: Meeting[]) => void;
  setCurrentMeeting: (meeting: Meeting | null) => void;
  addMeeting: (meeting: Meeting) => void;
  updateMeeting: (updated: Meeting) => void;
  removeMeeting: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Meeting store — populated in Phase 2 when meeting CRUD is implemented.
 *
 * The state shape and setters are defined here so route components can already
 * depend on the store's interface without any breaking changes when the API
 * calls are wired up.
 */
export const useMeetingStore = create<MeetingState>()((set) => ({
  meetings: [],
  currentMeeting: null,
  isLoading: false,
  error: null,

  setMeetings: (meetings) => set({ meetings }),
  setCurrentMeeting: (meeting) => set({ currentMeeting: meeting }),
  addMeeting: (meeting) =>
    set((state) => ({ meetings: [meeting, ...state.meetings] })),
  updateMeeting: (updated) =>
    set((state) => ({
      meetings: state.meetings.map((m) => (m.id === updated.id ? updated : m)),
      currentMeeting:
        state.currentMeeting?.id === updated.id ? updated : state.currentMeeting,
    })),
  removeMeeting: (id) =>
    set((state) => ({
      meetings: state.meetings.filter((m) => m.id !== id),
      currentMeeting:
        state.currentMeeting?.id === id ? null : state.currentMeeting,
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
