import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import TravelBackground from "@/components/backgrounds/TravelBackground";

export const metadata: Metadata = {
  title: "TripWeaver",
  description:
    "Your intelligent travel companion for searching hotels and booking flights effortlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Initialize with dark mode to prevent flash
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <body
          className={cn(
            "min-h-screen font-sans text-foreground antialiased selection:bg-indigo-500/30"
          )}
        >
          {/* Subtle global background effects for dark mode */}
          <div className="fixed inset-0 z-[-1] pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-background to-background dark:from-indigo-900/20" />
          
          <div className="fixed inset-0 z-0 pointer-events-none">
            <TravelBackground />
          </div>

          <div className="relative z-10 flex min-h-screen flex-col">
            <main className="flex-1">
              {children}
            </main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
