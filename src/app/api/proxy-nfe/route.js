import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const nfeUrl = searchParams.get('url');

    if (!nfeUrl) return NextResponse.json({ error: 'URL ausente' }, { status: 400 });

    try {
        const response = await fetch(nfeUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });
        const html = await response.text();

        // --- BUSCA PELO VALOR TOTAL ---
        // Tenta encontrar o valor após termos comuns como "Valor total", "vTxtPagar" ou "totalNFe"
        const valuePatterns = [
            /class="vTxtPagar">([\d,.]+)<\/span>/i,
            /totalNFe">([\d,.]+)<\/span>/i,
            /Valor total R\$:?\s*([\d,.]+)/i,
            /valor_total">([\d,.]+)/i
        ];

        let extractedValue = "";
        for (const pattern of valuePatterns) {
            const match = html.match(pattern);
            if (match) {
                const raw = match[1] || match[2] || match[3] || match[4];
                extractedValue = raw.replace(/\./g, '').replace(',', '.');
                break;
            }
        }

        // --- BUSCA PELO NOME DA LOJA ---
        const namePatterns = [
            /class="txtTopo">([^<]+)<\/div>/i,
            /class="txtLoja">([^<]+)<\/td>/i,
            /Nome \/ Razão Social:?\s*([^<]+)/i,
            /txtRazaoSocial">([^<]+)/i
        ];

        let extractedName = "Compra via Nota Fiscal";
        for (const pattern of namePatterns) {
            const match = html.match(pattern);
            if (match) {
                extractedName = (match[1] || match[2] || match[3] || match[4]).trim();
                break;
            }
        }

        // Log de depuração no terminal (você verá isso no VS Code)
        console.log("DEBUG - SEFAZ Extraído:", { extractedName, extractedValue });

        if (!extractedValue) {
            return NextResponse.json({ error: 'Valor não encontrado no HTML' }, { status: 404 });
        }

        return NextResponse.json({ name: extractedName, value: extractedValue });

    } catch (error) {
        console.error("Erro na Proxy:", error);
        return NextResponse.json({ error: 'Erro de conexão com SEFAZ' }, { status: 500 });
    }
}