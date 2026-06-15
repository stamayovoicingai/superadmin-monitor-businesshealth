import type { Metadata } from "next";
import { Inter, Instrument_Serif, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { themeInitScript } from "@/components/theme";

// voicing.ai uses Inter (UI/body) + Instrument Serif (display).
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Voicing AI · SuperAdmin",
  description: "Voicing AI SuperAdmin platform — observability, cost & margin, infra and controls.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${instrumentSerif.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
