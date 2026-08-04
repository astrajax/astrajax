import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./app-shell.css";
import { cn } from "@/lib/utils";
import { StoryModeProvider } from "@/components/command-centre/StoryModeProvider";
import { PlatformSessionProvider } from "@/components/platform-session/PlatformSessionProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const logoImage = "/astrajax-logo.png";

export const viewport: Viewport = {
  themeColor: "#202A1B",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://astrajax.com"),
  title: "AstraJax — The AI Adoption Operating System",
  description: "Building is commoditised. Adoption is the moat.",
  appleWebApp: {
    capable: true,
    title: "AstraJax",
    statusBarStyle: "black-translucent",
  },
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
          </StoryModeProvider>
        </PlatformSessionProvider>
      </body>
    </html>
  );
}
