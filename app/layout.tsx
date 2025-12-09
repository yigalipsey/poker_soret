import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/ui/BottomNav";
import { getActiveGame, getClubSession, getClub } from "./actions";

export const dynamic = "force-dynamic";

const heebo = Heebo({ subsets: ["hebrew", "latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const clubId = await getClubSession();
  let clubName = "מועדון פוקר";

  if (clubId) {
    const club = await getClub(clubId);
    if (club) {
      clubName = club.name;
    }
  }

  return {
    title: `${clubName} - הזירה של המקצוענים`,
    description: `מערכת לניהול פוקר מקצועי - ${clubName}`,
    keywords: ["פוקר", "poker", clubName, "ניהול משחקים", "poker management"],
    authors: [{ name: clubName }],
    openGraph: {
      title: clubName,
      description: `מערכת לניהול פוקר מקצועי - ${clubName}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: clubName,
      description: `מערכת לניהול פוקר מקצועי - ${clubName}`,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let activeGame = null;
  let clubId = null;
  try {
    clubId = await getClubSession();
    if (clubId) {
      activeGame = await getActiveGame(clubId);
    }
  } catch (error) {
    // אם אין חיבור למסד הנתונים (למשל בזמן build), נמשיך ללא activeGame
    console.error("Failed to get active game:", error);
  }

  return (
    <html lang="he" dir="rtl">
      <body
        className={cn(
          heebo.className,
          "bg-slate-950 text-slate-50 min-h-screen pb-20"
        )}
      >
        <main className="container mx-auto max-w-4xl">{children}</main>
        <BottomNav activeGameId={clubId ? activeGame?._id : null} />
      </body>
    </html>
  );
}
