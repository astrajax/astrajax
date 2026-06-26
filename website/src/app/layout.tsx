import type { Metadata } from "next";
import { Fraunces, Inter, Space_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { GlobalCliveLauncher } from "@/components/GlobalCliveLauncher";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

const logoImage = "/astrajax-logo.png";

export const metadata: Metadata = {
  metadataBase: new URL("https://astrajax.com"),
  title: "AstraJax — The adoption operating system for AI agents",
  description:
    "AstraJax helps domain experts design, run and improve AI agents their teams actually use — starting with curated context, adoption loops and human judgement.",
  icons: {
    icon: [{ url: logoImage, type: "image/png", sizes: "596x597" }],
    shortcut: [logoImage],
    apple: [{ url: logoImage, type: "image/png", sizes: "596x597" }],
  },
  openGraph: {
    title: "AstraJax — The adoption operating system for AI agents",
    description:
      "For the people who know the work, not the developers. Context-centred, adoption-led and built for citizen-builders.",
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
    title: "AstraJax — The adoption operating system for AI agents",
    description:
      "For the people who know the work, not the developers. Context-centred, adoption-led and built for citizen-builders.",
    images: [logoImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(fraunces.variable, inter.variable, spaceMono.variable, "font-sans", geist.variable)}
    >
      <body className="antialiased">
        {children}
        <GlobalCliveLauncher />
      </body>
    </html>
  );
}
