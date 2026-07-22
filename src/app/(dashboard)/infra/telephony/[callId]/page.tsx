"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { TransactionPanel } from "@/components/telephony/transaction-panel";
import { MessageModal } from "@/components/telephony/message-modal";
import { useState } from "react";

/** Deep-link surface for a single transaction — reuses the same panel shown in the floating modal. */
export default function TelephonyCallDetailPage() {
  const params = useParams<{ callId: string }>();
  const router = useRouter();
  const [messageUuid, setMessageUuid] = useState<string | null>(null);

  return (
    <div>
      <PageHeader
        title={params.callId}
        actions={
          <Button variant="ghost" size="sm" onClick={() => router.push("/infra/telephony")}>
            <ArrowLeft className="size-4" /> Back
          </Button>
        }
      />
      <TransactionPanel callId={params.callId} onOpenMessage={setMessageUuid} />
      <MessageModal uuid={messageUuid} onOpenChange={(open) => !open && setMessageUuid(null)} />
    </div>
  );
}
