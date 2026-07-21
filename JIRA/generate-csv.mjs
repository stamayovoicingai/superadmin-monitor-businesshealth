// Generate a Jira-import CSV from the JIRA/ epic + task markdown files.
// Usage: node JIRA/generate-csv.mjs  →  writes JIRA/jira-import.csv
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SKIP = new Set(["README.md", "CONVENTIONS.md", "ROADMAP.md"]);
const PRIORITY = { P0: "Highest", P1: "High", P2: "Medium", P3: "Low", P4: "Lowest" };

const field = (txt, label) => {
  const m = txt.match(new RegExp(`- \\*\\*${label}:\\*\\*\\s*(.+)`));
  return m ? m[1].trim() : "";
};
const ids = (s) => (s.match(/`([A-Z0-9]+-[A-Z0-9]+)`/g) || []).map((x) => x.replace(/`/g, "")).join("; ");
const labels = (s) => (s.match(/`([a-z0-9-]+)`/g) || []).map((x) => x.replace(/`/g, ""));
const title = (txt) => (txt.match(/^#\s+(.+)$/m) || [])[1]?.trim() ?? "";
const pri = (s) => (s.match(/\bP([0-4])\b/) || [])[0] ?? "P2";
const stripKey = (t) => t.replace(/^EPIC\s+[—-]\s+/, "").replace(/\s*\(`[^`]+`\)\s*$/, "").trim();
const bodyFromSections = (txt) => {
  const i = txt.indexOf("\n## ");
  return i === -1 ? "" : txt.slice(i).trim();
};

const rows = [];
for (const dir of readdirSync(ROOT).filter((d) => statSync(join(ROOT, d)).isDirectory())) {
  const dirPath = join(ROOT, dir);
  const files = readdirSync(dirPath).filter((f) => f.endsWith(".md"));
  const epicFile = files.find((f) => f === "EPIC.md");
  if (!epicFile) continue;
  const epicTxt = readFileSync(join(dirPath, epicFile), "utf8");
  const epicTitle = title(epicTxt);
  const epicName = stripKey(epicTitle);
  const epicKey = (epicTitle.match(/\(`([A-Z0-9]+)`\)/) || [])[1] ?? dir.toUpperCase();
  const epicPriority = pri(epicTxt.slice(0, 800));

  // Epic row
  rows.push({
    "Issue Type": "Epic",
    Summary: epicName,
    "Epic Name": epicName,
    "Epic Link": "",
    Priority: PRIORITY[epicPriority] ?? "Medium",
    "Story Points": "",
    Labels: ["epic", epicKey.toLowerCase()].join(" "),
    "External ID": epicKey,
    "Blocked By (IDs)": ids(epicTxt.match(/Blocked by:\*\*\s*(.+)/)?.[1] ?? ""),
    "Blocks (IDs)": "",
    Description: bodyFromSections(epicTxt) || epicTxt.split("\n").slice(1).join("\n").trim(),
  });

  // Task rows
  for (const f of files.filter((f) => f !== "EPIC.md")) {
    const txt = readFileSync(join(dirPath, f), "utf8");
    const type = field(txt, "Type");
    const issueType = /qa/i.test(type) ? "Task" : "Story";
    const id = field(txt, "ID").replace(/`/g, "");
    const p = pri(field(txt, "Priority"));
    const blockedBy = ids(field(txt, "Blocked by"));
    const blocks = ids(field(txt, "Blocks"));
    const lbls = [...new Set([...labels(field(txt, "Components/Labels")), epicKey.toLowerCase()])].join(" ");
    const meta =
      `**ID:** ${id} · **Priority:** ${p} · **Estimate:** ${field(txt, "Estimate")}\n` +
      `**Blocked by:** ${blockedBy || "—"} · **Blocks:** ${blocks || "—"}\n` +
      `**MVP ref:** ${field(txt, "MVP reference").replace(/`/g, "")}\n\n`;
    rows.push({
      "Issue Type": issueType,
      Summary: title(txt),
      "Epic Name": "",
      "Epic Link": epicName,
      Priority: PRIORITY[p] ?? "Medium",
      "Story Points": field(txt, "Estimate"),
      Labels: lbls,
      "External ID": id,
      "Blocked By (IDs)": blockedBy,
      "Blocks (IDs)": blocks,
      Description: meta + bodyFromSections(txt),
    });
  }
}

// Sort: epics first by key, then tasks
const order = ["PLAT", "ACCESS", "COST", "CALLS", "PERF", "LIVE", "THRESH", "ISSUE", "FLAG", "HEALTH", "K8S", "ELB", "TEL", "BIZ", "ASST", "INVOICE", "OVW", "FALLB", "IPACC", "QABENCH"];
const keyOf = (r) => (r["External ID"].split("-")[0]);
rows.sort((a, b) => {
  const ka = order.indexOf(keyOf(a)), kb = order.indexOf(keyOf(b));
  if (ka !== kb) return ka - kb;
  if (a["Issue Type"] === "Epic") return -1;
  if (b["Issue Type"] === "Epic") return 1;
  return a["External ID"].localeCompare(b["External ID"]);
});

const cols = ["Issue Type", "Summary", "Epic Name", "Epic Link", "Priority", "Story Points", "Labels", "External ID", "Blocked By (IDs)", "Blocks (IDs)", "Description"];
const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
writeFileSync(join(ROOT, "jira-import.csv"), csv + "\n", "utf8");
console.log(`Wrote jira-import.csv: ${rows.length} rows (${rows.filter((r) => r["Issue Type"] === "Epic").length} epics, ${rows.filter((r) => r["Issue Type"] !== "Epic").length} tasks)`);
