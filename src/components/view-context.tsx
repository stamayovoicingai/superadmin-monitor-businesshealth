"use client";

/**
 * Client view state: role + simulated identity (View-as switcher), org/project scope, time range.
 * Persisted to localStorage. The query string always carries resolved from/to so every
 * endpoint reads an explicit window (presets and custom ranges both work).
 *
 * `simulatedUserId` is the provisioned AppUser (PRD/20) being previewed when `role !== "superadmin"`
 * — PM/Dev/Financial identities differ in granted scope, so which one is active matters. Resolving
 * it to an AppUser + effective org/project scope is done in `useCurrentIdentity()` (lib/hooks.ts),
 * not here, to avoid this context depending on data-fetching hooks (which depend on this context).
 */
import * as React from "react";
import type { Role } from "@/lib/types";
import { resolveRangeState, type RangeState } from "@/lib/period";

interface ViewState {
  role: Role;
  simulatedUserId?: string;
  orgId?: string;
  projectId?: string;
  range: RangeState;
}

interface ViewContextValue extends ViewState {
  setRole: (r: Role) => void;
  setSimulatedUser: (userId?: string) => void;
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
        // migrate the old 2-role model ("user") — closest v2 equivalent is Dev; no grants yet,
        // so the identity picker (role-switcher) will prompt to pick a provisioned identity.
        if (parsed.role === "user") {
          parsed.role = "dev";
          parsed.simulatedUserId = undefined;
        }
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
      setRole: (role) => persist({ ...state, role, simulatedUserId: role === "superadmin" ? undefined : state.simulatedUserId }),
      setSimulatedUser: (simulatedUserId) => persist({ ...state, simulatedUserId, orgId: undefined, projectId: undefined }),
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
