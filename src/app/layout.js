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
    icons: {
        apple: "/icon-192x192.png",
    },
};

// Configurações de Interface Mobile
export const viewport = {
    themeColor: "#000000",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // Essencial para o feeling de app nativo
};

export default function RootLayout({ children }) {
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
