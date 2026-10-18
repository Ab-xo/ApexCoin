import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "./components/footer";
import { Header } from "./components/header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Apex Coin",
  description:
    "Apex Coin is a decentralized cryptocurrency that aims to provide fast, secure, and low-cost transactions for users worldwide.",
  icons: {
    icon: [{ url: "/img/favicon.jpg", type: "image/jpeg" }],
  },
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_transparent_35%),linear-gradient(180deg,#020817_0%,#0f172a_40%,#020817_100%)] text-slate-50"
        suppressHydrationWarning
      >
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
