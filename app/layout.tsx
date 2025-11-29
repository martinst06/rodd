import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { LanguageProvider } from "@/components/LanguageProvider";
import { SiteHeader } from "@/components/SiteHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shared Picture Bucket",
  description: "Upload and download pictures stored in Backblaze B2.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-zinc-100`}
      >
        <LanguageProvider>
          <div className="flex min-h-screen flex-col bg-black text-zinc-100">
            <SiteHeader />
            <main className="mx-auto flex w-full max-w-4xl flex-1 px-6 py-8">
              {children}
            </main>
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}


