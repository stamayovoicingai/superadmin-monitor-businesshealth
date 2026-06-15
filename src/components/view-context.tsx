"use client";

/**
 * Client view state: role (View-as switcher), org/project scope, time range.
 * Persisted to localStorage. The query string always carries resolved from/to so every
 * endpoint reads an explicit window (presets and custom ranges both work).
 */
import * as React from "react";
import type { Role } from "@/lib/types";
import { resolveRangeState, type RangeState } from "@/lib/period";

interface ViewState {
  role: Role;
  orgId?: string;
  projectId?: string;
  range: RangeState;
}

interface ViewContextValue extends ViewState {
  setRole: (r: Role) => void;
  setOrg: (orgId?: string) => void;
  setProject: (projectId?: string) => void;
  setRange: (r: RangeState) => void;
  /** Query string (orgId, projectId, from, to) for API calls based on current scope. */
  query: string;
}

const ViewContext = React.createContext<ViewContextValue | null>(null);
const STORAGE_KEY = "voicing-superadmin-view";

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ViewState>({ role: "superadmin", range: { preset: "30d" } });

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // migrate older shape where range was a string preset
        if (typeof parsed.range === "string") parsed.range = { preset: parsed.range };
        setState((s) => ({ ...s, ...parsed }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persist = React.useCallback((next: ViewState) => {
    setState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const value = React.useMemo<ViewContextValue>(() => {
    const params = new URLSearchParams();
    if (state.orgId) params.set("orgId", state.orgId);
    if (state.projectId) params.set("projectId", state.projectId);
    const { from, to } = resolveRangeState(state.range);
    params.set("from", from);
    params.set("to", to);
    return {
      ...state,
      setRole: (role) => persist({ ...state, role }),
      setOrg: (orgId) => persist({ ...state, orgId, projectId: undefined }),
      setProject: (projectId) => persist({ ...state, projectId }),
      setRange: (range) => persist({ ...state, range }),
      query: params.toString(),
    };
  }, [state, persist]);

  return <ViewContext.Provider value={value}>{children}</ViewContext.Provider>;
}

export function useView(): ViewContextValue {
  const ctx = React.useContext(ViewContext);
  if (!ctx) throw new Error("useView must be used within ViewProvider");
  return ctx;
}
