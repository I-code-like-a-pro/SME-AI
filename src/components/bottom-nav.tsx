"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  PlusCircle,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/log", label: "Log", icon: PlusCircle },
  { href: "/assistant", label: "AI", icon: Sparkles },
  { href: "/insights", label: "Insights", icon: BarChart3 },
];

const hiddenRoutes = ["/", "/onboarding"];

export function BottomNav() {
  const pathname = usePathname();

  if (hiddenRoutes.includes(pathname)) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur-md safe-bottom md:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          const isAi = href === "/assistant";
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors min-w-[56px]",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-6 w-6", isActive && "stroke-[2.5]", isAi && !isActive && "text-primary")} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
