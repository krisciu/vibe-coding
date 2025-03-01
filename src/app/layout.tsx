import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import {
  Paytone_One,
  Cherry_Bomb_One,
  Permanent_Marker,
} from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const paytoneOne = Paytone_One({
  variable: "--font-paytone",
  weight: "400",
  subsets: ["latin"],
});

const cherryBomb = Cherry_Bomb_One({
  variable: "--font-cherry-bomb",
  weight: "400",
  subsets: ["latin"],
});

const marker = Permanent_Marker({
  variable: "--font-marker",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mood Mash | Vibe Generator",
  description: "Generate your chaotic mood board with this fun vibe generator!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistMono.variable} ${paytoneOne.variable} ${cherryBomb.variable} ${marker.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
