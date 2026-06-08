"use client";

import { useQuery } from "@tanstack/react-query";
import { useView } from "@/components/view-context";
import type {
  BusinessHealthResult,
  CallDetail,
  CallPage,
  CostResult,
  LiveOpsResult,
  OverviewResult,
  PerformanceResult,
} from "@/lib/data/source";
import type { Agent, Organization, Project } from "@/lib/types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export interface Meta {
  orgs: Organization[];
  projects: Project[];
  agents: Agent[];
}

export function useMeta() {
  return useQuery({ queryKey: ["meta"], queryFn: () => fetchJson<Meta>("/api/meta"), staleTime: Infinity });
}

export function useOverview() {
  const { query } = useView();
  return useQuery({
    queryKey: ["overview", query],
    queryFn: () => fetchJson<OverviewResult>(`/api/overview?${query}`),
  });
}

export function useCost() {
  const { query } = useView();
  return useQuery({
    queryKey: ["cost", query],
    queryFn: () => fetchJson<CostResult>(`/api/cost?${query}`),
  });
}

export function usePerformance() {
  const { query } = useView();
  return useQuery({
    queryKey: ["performance", query],
    queryFn: () => fetchJson<PerformanceResult>(`/api/performance?${query}`),
  });
}

export function useCalls(params: { page: number; pageSize: number; status?: string; closedReason?: string; flagged?: boolean; search?: string }) {
  const { query } = useView();
  const sp = new URLSearchParams(query);
  sp.set("page", String(params.page));
  sp.set("pageSize", String(params.pageSize));
  if (params.status) sp.set("status", params.status);
  if (params.closedReason) sp.set("closedReason", params.closedReason);
  if (params.flagged) sp.set("flagged", "true");
  if (params.search) sp.set("search", params.search);
  const qs = sp.toString();
  return useQuery({ queryKey: ["calls", qs], queryFn: () => fetchJson<CallPage>(`/api/calls?${qs}`) });
}

export function useCall(callId: string) {
  return useQuery({
    queryKey: ["call", callId],
    queryFn: () => fetchJson<CallDetail>(`/api/calls/${callId}`),
    enabled: !!callId,
  });
}

export function useBusiness() {
  const { query } = useView();
  return useQuery({
    queryKey: ["business", query],
    queryFn: () => fetchJson<BusinessHealthResult>(`/api/business?${query}`),
  });
}

export function useLiveOps(enabled = true) {
  const { query } = useView();
  return useQuery({
    queryKey: ["live", query],
    queryFn: () => fetchJson<LiveOpsResult>(`/api/live?${query}`),
    refetchInterval: enabled ? 20_000 : false,
  });
}
