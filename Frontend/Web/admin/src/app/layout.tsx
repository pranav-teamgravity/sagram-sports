import type { Metadata } from "next";
import Link from "next/link";
import { Barlow, Big_Shoulders } from "next/font/google";
import { Shirt } from "lucide-react";
import "./globals.css";

const barlow = Barlow({ variable: "--font-barlow", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const shoulders = Big_Shoulders({ variable: "--font-shoulders", subsets: ["latin"], weight: ["700", "800", "900"] });

export const metadata: Metadata = {
  title: { default: "Sagram admin", template: "%s | Sagram admin" },
  // Admin screens must never be indexed.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${barlow.variable} ${shoulders.variable}`} suppressHydrationWarning>
      {/* suppressHydrationWarning: browser extensions (Grammarly, ColorZilla, dark-mode tools) add attributes to html/body before React loads. Only affects these two tags. */}
      <body className="antialiased" suppressHydrationWarning>
        <div className="flex min-h-svh">
          <aside className="hidden w-60 shrink-0 flex-col bg-navy px-4 py-6 text-white md:flex">
            <Link href="/jerseys" className="px-2 font-display text-3xl font-black">
              Sagram <span className="text-lg font-bold text-shirt">admin</span>
            </Link>
            <nav aria-label="Admin" className="mt-8">
              <Link
                href="/jerseys"
                className="flex items-center gap-2.5 rounded-lg bg-white/10 px-3 py-2.5 font-medium"
              >
                <Shirt className="size-4" aria-hidden />
                Jerseys
              </Link>
            </nav>
            <p className="mt-auto px-2 text-xs leading-relaxed text-white/60">
              Local mode: jerseys are saved straight into the customer app on this computer, until the backend is
              connected.
            </p>
          </aside>
          <main className="min-w-0 flex-1 px-4 py-8 sm:px-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
