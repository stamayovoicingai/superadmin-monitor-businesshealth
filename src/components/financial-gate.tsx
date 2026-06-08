"use client";

import { useView } from "@/components/view-context";
import { canSeeFinancials } from "@/lib/auth/policy";

/** Renders children only when the current role may see revenue/margin/business financials. */
export function FinancialGate({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { role } = useView();
  return canSeeFinancials(role) ? <>{children}</> : <>{fallback}</>;
}

export function useFinancials() {
  const { role } = useView();
  return canSeeFinancials(role);
}
