import type { Metadata } from "next";
import { Barlow, Big_Shoulders } from "next/font/google";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const shoulders = Big_Shoulders({
  variable: "--font-shoulders",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "Sagram Sports | Football and cricket jerseys",
    template: "%s | Sagram Sports",
  },
  description:
    "Club, national team and retro jerseys, with your name and number printed on the back.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${barlow.variable} ${shoulders.variable}`} suppressHydrationWarning>
      {/* suppressHydrationWarning: browser extensions (Grammarly, ColorZilla, dark-mode tools) add attributes to html/body before React loads. Only affects these two tags. */}
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
