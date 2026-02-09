import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kursverwaltung",
  description:
    "Verwaltung von Schülerdaten mit Kursübersichten, Anwesenheit sowie AV/SV Pflege.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${inter.variable} font-sans bg-slate-100 text-slate-900`}>
        {children}
      </body>
    </html>
  );
}
