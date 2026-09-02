import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  helper?: string;
}

export function StatCard({
  label,
  value,
  helper,
  className,
  ...props
}: StatCardProps) {
  return (
    <Card
      className={cn("border-2 border-green-100 bg-white shadow-sm", className)}
      {...props}
    >
      <CardContent className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 text-2xl font-extrabold text-gray-900">{value}</p>
        {helper ? (
          <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
