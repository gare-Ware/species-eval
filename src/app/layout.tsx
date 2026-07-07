import type { Metadata } from "next";
import { Fraunces, Geist_Mono } from "next/font/google";
import "./globals.css";

// Display + body face. Fraunces is a variable editorial serif: the opsz axis
// (9–144) means the browser auto-serves the high-contrast display cut for the
// giant headline and the sturdier text cut for body copy from the same file;
// wght 100–900 stays open for axis motion. (SOFT/WONK axes exist but aren't
// loaded — add them here to play with Fraunces' wonky display forms.) To
// audition a different face, swap the import + constructor here — everything
// else reads the semantic --font-display hook.
const displayFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz"],
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
        className={`${displayFont.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
