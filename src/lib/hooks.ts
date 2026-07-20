"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useView } from "@/components/view-context";
import { resolveRangeState, type RangeState } from "@/lib/period";
import type {
  AddIpRuleInput,
  AssistantUsageResult,
  BusinessHealthResult,
  CallDetail,
  CallPage,
  CostResult,
  IpRulesResult,
  LiveOpsResult,
  OverviewResult,
  PerformanceResult,
  SetIpPolicyInput,
  FallbacksResult,
  UpdateFallbackInput,
  HealthResult,
  SetRecipientsInput,
  SetServiceOverrideInput,
  K8sResult,
  ElbResult,
  IssuesResult,
  CreateThresholdInput,
  UpdateThresholdPatch,
  SipCallFilter,
  SipCallPage,
} from "@/lib/data/source";
import type { Agent, CallFlag, FlagStatus, IpRule, IssueCategory, Organization, Project, SipCallDetail, Threshold } from "@/lib/types";

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

export function useAssistant() {
  const { query } = useView();
  return useQuery({
    queryKey: ["assistant", query],
    queryFn: () => fetchJson<AssistantUsageResult>(`/api/assistant?${query}`),
  });
}

export function useIpRules() {
  const { query } = useView();
  return useQuery({
    queryKey: ["access", query],
    queryFn: () => fetchJson<IpRulesResult>(`/api/access?${query}`),
  });
}

export function useAddIpRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddIpRuleInput) => {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "request_failed");
      return res.json() as Promise<IpRule>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["access"] }),
  });
}

export function useDeleteIpRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/access?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("request_failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["access"] }),
  });
}

export function useSetIpPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SetIpPolicyInput) => {
      const res = await fetch("/api/access", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("request_failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["access"] }),
  });
}

export function useFallbacks() {
  const { query } = useView();
  return useQuery({
    queryKey: ["fallbacks", query],
    queryFn: () => fetchJson<FallbacksResult>(`/api/fallbacks?${query}`),
  });
}

export function useUpdateFallback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateFallbackInput) => {
      const res = await fetch("/api/fallbacks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("request_failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fallbacks"] }),
  });
}

export function useHealth() {
  const { query } = useView();
  return useQuery({
    queryKey: ["health", query],
    queryFn: () => fetchJson<HealthResult>(`/api/health?${query}`),
    refetchInterval: 30_000,
  });
}

export function useSetRecipients() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SetRecipientsInput) => {
      const res = await fetch("/api/health", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "recipients", ...input }),
      });
      if (!res.ok) throw new Error("request_failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["health"] }),
  });
}

export function useSetServiceOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SetServiceOverrideInput) => {
      const res = await fetch("/api/health", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "override", ...input }),
      });
      if (!res.ok) throw new Error("request_failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["health"] }),
  });
}

/** Build a query string from the global scope, overriding from/to with a tab-local range. */
function withLocalRange(globalQuery: string, range?: RangeState): string {
  if (!range) return globalQuery;
  const sp = new URLSearchParams(globalQuery);
  const { from, to } = resolveRangeState(range);
  sp.set("from", from);
  sp.set("to", to);
  return sp.toString();
}

export function useIssues() {
  const { query } = useView();
  return useQuery({
    queryKey: ["issues", query],
    queryFn: () => fetchJson<IssuesResult>(`/api/issues?${query}`),
  });
}

export function useThresholds() {
  return useQuery({
    queryKey: ["thresholds"],
    queryFn: () => fetchJson<{ thresholds: Threshold[]; categories: IssueCategory[] }>("/api/thresholds"),
  });
}

function invalidateIssues(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["thresholds"] });
  qc.invalidateQueries({ queryKey: ["issues"] });
}

export function useCreateThreshold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateThresholdInput) => {
      const res = await fetch("/api/thresholds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      if (!res.ok) throw new Error("request_failed");
    },
    onSuccess: () => invalidateIssues(qc),
  });
}

export function useUpdateThreshold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: UpdateThresholdPatch) => {
      const res = await fetch("/api/thresholds", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      if (!res.ok) throw new Error("request_failed");
    },
    onSuccess: () => invalidateIssues(qc),
  });
}

export function useDeleteThreshold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/thresholds?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("request_failed");
    },
    onSuccess: () => invalidateIssues(qc),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/issue-categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      if (!res.ok) throw new Error("request_failed");
    },
    onSuccess: () => invalidateIssues(qc),
  });
}

export function useFlags() {
  const { query } = useView();
  return useQuery({
    queryKey: ["flags", query],
    queryFn: () => fetchJson<CallFlag[]>(`/api/flags?${query}`),
  });
}

export function useCreateFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { callId: string; comment: string }) => {
      const res = await fetch("/api/flags", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      if (!res.ok) throw new Error("request_failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["flags"] }),
  });
}

export function useUpdateFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status?: FlagStatus; comment?: string }) => {
      const res = await fetch("/api/flags", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      if (!res.ok) throw new Error("request_failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["flags"] }),
  });
}

export function useInfraK8s(range?: RangeState) {
  const { query } = useView();
  // Memoize so a preset range (which resolves via new Date()) doesn't change the key every render.
  const qs = useMemo(() => withLocalRange(query, range), [query, range]);
  return useQuery({
    queryKey: ["infra-k8s", qs],
    queryFn: () => fetchJson<K8sResult>(`/api/infra/kubernetes?${qs}`),
  });
}

export function useInfraElb(range?: RangeState) {
  const { query } = useView();
  const qs = useMemo(() => withLocalRange(query, range), [query, range]);
  return useQuery({
    queryKey: ["infra-elb", qs],
    queryFn: () => fetchJson<ElbResult>(`/api/infra/elb?${qs}`),
  });
}

export function useTelephonyCalls(params: { page: number; pageSize: number } & SipCallFilter, live = false) {
  const { query } = useView();
  const sp = new URLSearchParams(query);
  sp.set("page", String(params.page));
  sp.set("pageSize", String(params.pageSize));
  if (params.origin) sp.set("origin", params.origin);
  if (params.destination) sp.set("destination", params.destination);
  if (params.sipCallId) sp.set("sipCallId", params.sipCallId);
  if (params.status) sp.set("status", params.status);
  const qs = sp.toString();
  return useQuery({
    queryKey: ["telephony", qs],
    queryFn: () => fetchJson<SipCallPage>(`/api/infra/telephony?${qs}`),
    refetchInterval: live ? 15_000 : false,
  });
}

export function useTelephonyCall(callId: string) {
  return useQuery({
    queryKey: ["telephony-call", callId],
    queryFn: () => fetchJson<SipCallDetail>(`/api/infra/telephony/${callId}`),
    enabled: !!callId,
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
