import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/components/UserContext";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Duolingo Clone",
  description: "Learn a language, keep your streak — a Duolingo web app clone.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* set dark mode before paint to avoid a flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.theme==="dark")document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
      </head>
      <body className={`${nunito.variable} font-din`}>
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
