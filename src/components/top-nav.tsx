"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  PlusCircle,
  BarChart3,
  GraduationCap,
  Banknote,
  Sparkles,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/assistant", label: "AI Assistant", icon: Sparkles },
  { href: "/log", label: "Log Sale", icon: PlusCircle },
  { href: "/insights", label: "Insights", icon: BarChart3 },
    { href: "/loans", label: "Loans", icon: Banknote },
    { href: "/learn", label: "Learn", icon: GraduationCap },
  ];

const hiddenRoutes = ["/", "/onboarding", "/signin", "/signup"];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();

  async function handleSignOut() {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  }

  if (hiddenRoutes.includes(pathname)) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 hidden border-b bg-white/95 backdrop-blur-md md:block">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">
            AI
          </div>
          <span className="text-lg font-bold text-primary">SME AI</span>
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
          <Button
            onClick={handleSignOut}
            variant="ghost"
            size="sm"
            className="ml-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </nav>
      </div>
    </header>
  );
}
