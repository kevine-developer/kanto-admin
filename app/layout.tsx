import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/lib/theme-context";
import { ToastProvider } from "@/components/feedback/ToastContext";
import "./globals.css";

const appFont = Plus_Jakarta_Sans({
  variable: "--font-app",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Kanto Admin — Conservatoire & Patrimoine Vivant Malagasy",
  description: "Espace d'administration culturelle, phonothèque IA Gemini TTS et registre des sagesses de Madagascar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${appFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                var suppress = function(msg) {
                  return typeof msg === 'string' && (msg.indexOf('startTime') !== -1 || msg.indexOf('reportAllChanges') !== -1);
                };
                var origOnError = window.onerror;
                window.onerror = function(msg, url, line, col, err) {
                  if (suppress(msg) || (err && suppress(err.message))) return true;
                  return origOnError ? origOnError.apply(this, arguments) : false;
                };
                window.addEventListener('error', function(e) {
                  if (suppress(e.message) || (e.error && suppress(e.error.message))) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                  }
                }, true);
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[var(--background)] text-[var(--foreground)] selection:bg-[#2D6A4F]/20 selection:text-[#2D6A4F]">
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
