"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getOnboardingData } from "@/lib/storage";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function check() {
      if (loading || !user) {
        return;
      }

      const data = await getOnboardingData();
      if (!data) {
        router.replace("/onboarding");
      } else {
        setReady(true);
      }
    }
    check();
  }, [router, user, loading]);

  if (loading || !ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
