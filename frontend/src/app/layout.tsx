import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
});

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
            "min-h-screen bg-background font-sans text-foreground antialiased selection:bg-indigo-500/30",
            inter.variable,
            dmSans.variable
          )}
        >
          <div className="relative flex min-h-screen flex-col">
            {/* Subtle global background effects */}
            <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-background to-background dark:from-indigo-900/20" />

            <main className="flex-1">
              {children}
            </main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
