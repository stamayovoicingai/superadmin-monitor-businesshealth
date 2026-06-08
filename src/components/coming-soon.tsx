import { Construction } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ComingSoon({
  title,
  description,
  prd,
  phase,
}: {
  title: string;
  description: string;
  prd: string;
  phase?: string;
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
            <Construction className="size-6" />
          </div>
          <div className="text-lg font-semibold">Designed in the PRD — UI coming next</div>
          <p className="max-w-md text-sm text-muted-foreground">
            This module is fully specified in <span className="font-mono">{prd}</span> and will be
            built on top of the existing data layer.
          </p>
          <div className="flex gap-2">
            <Badge variant="outline">{prd}</Badge>
            {phase && <Badge variant="secondary">{phase}</Badge>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
