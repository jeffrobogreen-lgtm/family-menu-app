import type { Metadata } from "next";
import Link from "next/link";
import { Baloo_2, Work_Sans } from "next/font/google";
import "./globals.css";

const baloo = Baloo_2({
  subsets: ["latin"],
  variable: "--font-baloo",
  weight: ["600", "700"],
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-worksans",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Family Menu",
  description: "This week's dinner and breakfast picks",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${baloo.variable} ${workSans.variable}`}>
      <body className="font-body bg-kitchen-bg text-kitchen-ink min-h-screen">
        <header className="max-w-xl mx-auto px-4 pt-6 flex items-center justify-between">
          <Link href="/" className="font-display text-lg font-bold flex items-center gap-1.5">
            <span>🍽️</span> Family Menu
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-kitchen-ink/60">
            <Link href="/plan/new" className="hover:text-kitchen-tomato transition-colors">
              Plan Week
            </Link>
            <Link href="/family" className="hover:text-kitchen-tomato transition-colors">
              Family
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
