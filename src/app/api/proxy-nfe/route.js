import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const nfeUrl = searchParams.get('url');

    if (!nfeUrl) return NextResponse.json({ error: 'URL ausente' }, { status: 400 });

    try {
        const response = await fetch(nfeUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' } // Simula um navegador real
        });
        const html = await response.text();

        // 1. EXTRAÇÃO DO VALOR TOTAL (Tenta vários formatos da SEFAZ)
        const valueRegex = /<span class="vTxtPagar">([\d,.]+)<\/span>|<span class="totalNFe">([\d,.]+)<\/span>|Valor total R\$:?\s*([\d,.]+)/i;
        const valueMatch = html.match(valueRegex);
        let extractedValue = "";

        if (valueMatch) {
            // Pega o primeiro grupo que não seja undefined e limpa
            const rawValue = valueMatch[1] || valueMatch[2] || valueMatch[3];
            extractedValue = rawValue.replace(/\./g, '').replace(',', '.');
        }

        // 2. EXTRAÇÃO DO NOME DA LOJA (Razão Social)
        const nameRegex = /<div class="txtTopo">([^<]+)<\/div>|<td class="txtLoja">([^<]+)<\/td>|Nome \/ Razão Social:?\s*([^<]+)/i;
        const nameMatch = html.match(nameRegex);
        let extractedName = "Compra via Nota Fiscal";

        if (nameMatch) {
            extractedName = (nameMatch[1] || nameMatch[2] || nameMatch[3]).trim();
        }

        console.log("DADOS EXTRAÍDOS:", { extractedName, extractedValue });

        return NextResponse.json({
            name: extractedName,
            value: extractedValue
        });

    } catch (error) {
        return NextResponse.json({ error: 'Erro ao conectar com a SEFAZ' }, { status: 500 });
    }
}