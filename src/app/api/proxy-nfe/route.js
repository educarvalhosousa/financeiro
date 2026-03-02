import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const nfeUrl = searchParams.get('url');

    if (!nfeUrl) return NextResponse.json({ error: 'URL ausente' }, { status: 400 });

    try {
        const response = await fetch(nfeUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const html = await response.text();

        // 1. Extração do Nome da Loja (Focado na classe txtTopo da SEFAZ-SP)
        const nameRegex = /<div[^>]*class="txtTopo"[^>]*>([^<]+)<\/div>/i;
        const nameMatch = html.match(nameRegex);
        let extractedName = "Compra via Nota Fiscal";

        if (nameMatch && nameMatch[1]) {
            extractedName = nameMatch[1].trim();
        }

        // 2. Extração do Valor Total (Focado na classe vTxtPagar da SEFAZ-SP)
        const valueRegex = /<span[^>]*class="vTxtPagar"[^>]*>([\d,.]+)<\/span>/i;
        const valueMatch = html.match(valueRegex);
        let extractedValue = "";

        if (valueMatch && valueMatch[1]) {
            // Converte o formato brasileiro "12,50" para o formato do sistema "12.50"
            extractedValue = valueMatch[1].replace(/\./g, '').replace(',', '.');
        }

        // Log para você conferir no terminal do VS Code
        console.log("--- NOTA FISCAL SP DETECTADA ---");
        console.log("Loja:", extractedName);
        console.log("Valor:", extractedValue);

        return NextResponse.json({
            name: extractedName,
            value: extractedValue
        });

    } catch (error) {
        return NextResponse.json({ error: 'Erro de conexão com a SEFAZ' }, { status: 500 });
    }
}