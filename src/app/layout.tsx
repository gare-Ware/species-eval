import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist_Mono } from "next/font/google";
import "./globals.css";

// Variable font with weight + width + optical-size axes: one file covers the fat
// poster headline (800) and body text, and leaves wdth free for motion play.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "What Species Are You?",
  description:
    "A short personality quiz that matches you to an alien species from the lore.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bricolage.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
