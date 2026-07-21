import type { Metadata } from "next";
import { Bebas_Neue, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Industrial Operating Brain",
  description: "Cognitive Console for Industry 5.0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${manrope.variable} ${jetbrainsMono.variable} scroll-smooth`}>
      <body className="bg-background text-zinc-300 font-body min-h-screen overflow-x-hidden relative antialiased selection:bg-accent-bg selection:text-accent">
        {/* Persistent global noise texture from landing page */}
        <div className="fixed inset-0 z-50 pointer-events-none opacity-[0.02] mix-blend-screen noise-bg"></div>
        {children}
      </body>
    </html>
  );
}
