import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DraftDone",
  description: "草圖轉 AutoCAD，室內設計師的必備工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
