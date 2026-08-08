import {ClerkProvider} from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
  title: "BABELCORE ©",
  description: "Oracle-AI library",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* HubSpot tracking — portal 243595741 (NA2) */}
        <Script
          id="hs-script-loader"
          src="//js-na2.hs-scripts.com/243595741.js"
          strategy="afterInteractive"
        />
        <ClerkProvider
          localization={{
            signIn: { start: { title: "BABELCORE" } },
            signUp: { start: { title: "BABELCORE" } },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}