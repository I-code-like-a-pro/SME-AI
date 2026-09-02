import * as React from "react";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
}

export function LoadingSkeleton({
  className,
  lines = 3,
  ...props
}: LoadingSkeletonProps) {
  return (
    <div className={cn("animate-pulse space-y-3", className)} {...props}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-4 rounded-md bg-muted",
            index === 0 && "h-7 w-1/2",
            index === lines - 1 && "w-3/4",
          )}
        />
      ))}
    </div>
  );
}
