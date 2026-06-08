/**
 * DataSource selector. Swap adapters via env DATA_SOURCE ("mock" | "supabase").
 * Supabase adapter is wired in a later step; defaults to mock.
 */
import type { DataSource } from "./source";
import { MockAdapter } from "./mock";

let _ds: DataSource | null = null;

export function getDataSource(): DataSource {
  if (_ds) return _ds;
  const kind = process.env.DATA_SOURCE ?? "mock";
  switch (kind) {
    // case "supabase": _ds = new SupabaseAdapter(); break;  // enabled once credentials are set
    case "mock":
    default:
      _ds = new MockAdapter();
  }
  return _ds;
}

export * from "./source";
