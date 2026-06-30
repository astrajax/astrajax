import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { GlobalCliveLauncher } from "@/components/GlobalCliveLauncher";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const logoImage = "/astrajax-logo.png";

export const metadata: Metadata = {
  metadataBase: new URL("https://astrajax.com"),
  title: "AstraJax — The AI Adoption Operating System",
  description: "Building is commoditised. Adoption is the moat.",
  icons: {
    icon: [{ url: logoImage, type: "image/png", sizes: "596x597" }],
    shortcut: [logoImage],
    apple: [{ url: logoImage, type: "image/png", sizes: "596x597" }],
  },
  openGraph: {
    title: "AstraJax — The AI Adoption Operating System",
    description: "Building is commoditised. Adoption is the moat.",
    type: "website",
    images: [
      {
        url: logoImage,
        width: 596,
        height: 597,
        alt: "AstraJax logo mark",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "AstraJax — The AI Adoption Operating System",
    description: "Building is commoditised. Adoption is the moat.",
    images: [logoImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(inter.variable, "font-sans")}>
      <body className={cn(inter.className, "antialiased")}>
        {children}
        <GlobalCliveLauncher />
      </body>
    </html>
  );
}
