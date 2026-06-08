"use client";

/**
 * Client view state: role (View-as switcher), org/project scope, time range.
 * Persisted to localStorage. Server reads the same params via the API query string.
 */
import * as React from "react";
import type { Role } from "@/lib/types";
import type { RangePreset } from "@/lib/period";

interface ViewState {
  role: Role;
  orgId?: string;
  projectId?: string;
  range: RangePreset;
}

interface ViewContextValue extends ViewState {
  setRole: (r: Role) => void;
  setOrg: (orgId?: string) => void;
  setProject: (projectId?: string) => void;
  setRange: (r: RangePreset) => void;
  /** Query string for API calls based on current scope. */
  query: string;
}

const ViewContext = React.createContext<ViewContextValue | null>(null);
const STORAGE_KEY = "voicing-superadmin-view";

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ViewState>({ role: "superadmin", range: "30d" });

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState((s) => ({ ...s, ...JSON.parse(raw) }));
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
    params.set("range", state.range);
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
