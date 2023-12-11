import type {Metadata} from "next";
// import {Inter} from "next/font/google";
import "@/app/globals.css";
import Script from "next/script";

// const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
  title: "Tina Admin Page",
  description: "tina admin page",
};

export default function AdminEditingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Script src="https://cdn.tailwindcss.com"></Script>
      <body>{children}</body>
    </html>
  );
}
