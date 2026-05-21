import type { Metadata } from "next";
import { Fira_Code, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const font_jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const font_jetBrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetBrains",
});

const font_firacode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-firacode",
});

const font_firacode_nerd = localFont({
  src: "../fonts/FiraCodeNerdFont-Regular.ttf",
  variable: "--font-firacode-nerd",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cadaide",
};

console.log("[Frontend] PORT: " + process.env.PORT);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${font_jakarta.variable} ${font_jetBrains.variable} ${font_firacode.variable} ${font_firacode_nerd.variable} mocha dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ctp-base text-ctp-text">
        {children}
      </body>
    </html>
  );
}
