import { useEffect } from "react";
import "./globals.css";

// Configurações de Identidade e PWA
export const metadata = {
    title: "FinanSee Pro",
    description: "Gestão Financeira Inteligente para Casais",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "FinanSee Pro",
    },
};

export default function RootLayout({ children }) {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((registration) => {
                    console.log("Service Worker registered with scope:", registration.scope);
                })
                .catch((error) => {
                    console.error("Service Worker registration failed:", error);
                });
        }
    }, []);

    return (
        <html lang="pt-BR">
            <head>
                <meta name="mobile-web-app-capable" content="yes" />
            </head>
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
