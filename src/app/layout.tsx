import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = 'https://web-kappa-navy.vercel.app'

export const metadata: Metadata = {
  title: {
    default: 'H2Prism — Hydrogen Economics, Decoded',
    template: '%s | H2Prism',
  },
  description: 'Free LCOH calculator for hydrogen production pathways. Compare PEM, ALK, SOEC, SMR, ATR+CCS cost models with DCF analysis, sensitivity charts, and NPV/IRR modeling.',
  keywords: ['LCOH calculator', 'hydrogen cost', 'levelized cost of hydrogen', 'green hydrogen', 'blue hydrogen', 'PEM electrolyzer', 'SMR', 'H2 economics', '수소 생산 비용', 'LCOH 계산기'],
  authors: [{ name: 'H2Prism' }],
  creator: 'H2Prism',
  metadataBase: new URL(BASE_URL),
  openGraph: {
    type: 'website',
    siteName: 'H2Prism',
    title: 'H2Prism — Hydrogen Economics, Decoded',
    description: 'Free LCOH calculator for hydrogen production pathways. Compare PEM, ALK, SOEC, SMR cost models with DCF and NPV/IRR analysis.',
    url: BASE_URL,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'H2Prism — Hydrogen Economics, Decoded',
    description: 'Free LCOH calculator for hydrogen production pathways.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
