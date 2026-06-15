"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useView } from "@/components/view-context";
import { useMeta } from "@/lib/hooks";
import { DateRangeControl } from "@/components/date-range-control";

const ALL = "__all__";

export function ScopeFilters() {
  const { orgId, projectId, range, setOrg, setProject, setRange } = useView();
  const { data } = useMeta();

  const projects = (data?.projects ?? []).filter((p) => !orgId || p.orgId === orgId);

  return (
    <div className="flex items-center gap-2">
      <Select value={orgId ?? ALL} onValueChange={(v) => setOrg(v && v !== ALL ? v : undefined)}>
        <SelectTrigger size="sm" className="w-[150px]">
          <SelectValue placeholder="Organization" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All orgs</SelectItem>
          {data?.orgs.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={projectId ?? ALL} onValueChange={(v) => setProject(v && v !== ALL ? v : undefined)}>
        <SelectTrigger size="sm" className="w-[180px]">
          <SelectValue placeholder="Project" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All projects</SelectItem>
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DateRangeControl value={range} onChange={setRange} />
    </div>
  );
}
