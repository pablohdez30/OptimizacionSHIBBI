import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShibbiShop Manager",
  description: "Gestión de muebles a medida",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="bg-bg" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{localStorage.removeItem('theme');var t=localStorage.getItem('theme-mode');if(t==='light'){document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();",
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg text-text">
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#111111",
              border: "1px solid #2A2A2A",
              color: "#F5F5F5",
            },
            classNames: {
              success: "!border-state-success/40",
              error: "!border-state-danger/40",
              info: "!border-gold/40",
            },
          }}
        />
      </body>
    </html>
  );
}
