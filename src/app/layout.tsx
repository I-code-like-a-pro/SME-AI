import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { TopNav } from "@/components/top-nav";
import { AuthProvider } from "@/lib/auth-context";
import { AuthGuard } from "@/components/auth-guard";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SME AI — Your Smart Business Assistant",
  description:
    "AI-powered financial assistant for micro-traders and small business owners worldwide.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AuthGuard>
            {/* NOVUS_ANALYTICS */}
            <TopNav />
            <main className="min-h-screen pb-20 md:pb-0">{children}</main>
            <BottomNav />
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
