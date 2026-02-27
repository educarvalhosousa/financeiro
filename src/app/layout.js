import "./globals.css";
import PushInitializer from "../components/PushInitializer";

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
    return (
        <html lang="pt-BR">
            <head>
                <meta name="mobile-web-app-capable" content="yes" />
            </head>
            <body className="antialiased">
                <PushInitializer />
                {children}
            </body>
        </html>
    );
}
