import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { GlobalCliveLauncher } from "@/components/GlobalCliveLauncher";
import { StoryModeProvider } from "@/components/command-centre/StoryModeProvider";
import { PlatformSessionProvider } from "@/components/platform-session/PlatformSessionProvider";

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
    icon: [{ url: logoImage, type: "image/png", sizes: "1024x929" }],
    shortcut: [logoImage],
    apple: [{ url: logoImage, type: "image/png", sizes: "1024x929" }],
  },
  openGraph: {
    title: "AstraJax — The AI Adoption Operating System",
    description: "Building is commoditised. Adoption is the moat.",
    type: "website",
    images: [
      {
        url: logoImage,
        width: 1024,
        height: 929,
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
        <PlatformSessionProvider>
          <StoryModeProvider>
            {children}
            <GlobalCliveLauncher />
          </StoryModeProvider>
        </PlatformSessionProvider>
      </body>
    </html>
  );
}
