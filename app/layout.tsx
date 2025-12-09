import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/ui/BottomNav";
import { getActiveGame } from "./actions";

const heebo = Heebo({ subsets: ["hebrew", "latin"] });

export const metadata: Metadata = {
  title: "Club Soret - הזירה של המקצוענים",
  description: "מערכת לניהול פוקר מקצועי - Club Soret",
  keywords: ["פוקר", "poker", "Club Soret", "ניהול משחקים", "poker management"],
  authors: [{ name: "Club Soret" }],
  openGraph: {
    title: "Club Soret",
    description: "מערכת לניהול פוקר מקצועי",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Club Soret",
    description: "מערכת לניהול פוקר מקצועי",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const activeGame = await getActiveGame();

  return (
    <html lang="he" dir="rtl">
      <body
        className={cn(
          heebo.className,
          "bg-slate-950 text-slate-50 min-h-screen pb-20"
        )}
      >
        <main className="container mx-auto p-4 max-w-4xl">{children}</main>
        <BottomNav activeGameId={activeGame?._id} />
      </body>
    </html>
  );
}
