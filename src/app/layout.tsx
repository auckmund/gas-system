import type { Metadata } from "next";
import { Oxanium, Source_Code_Pro } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const oxanium = Oxanium({
  subsets: ["latin"],
  variable: "--font-oxanium",
  display: "swap",
});

const sourceCode = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-source-code",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AUGMUND | Smart LPG Monitoring",
  description:
    "Predictive Gas Management Through Connected Intelligence — IoT LPG cylinder monitoring platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${oxanium.variable} ${sourceCode.variable}`} suppressHydrationWarning>
      <body className={`${oxanium.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
