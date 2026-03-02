import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const nfeUrl = searchParams.get('url');

    if (!nfeUrl) return NextResponse.json({ error: 'URL ausente' }, { status: 400 });

    try {
        const response = await fetch(nfeUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
            }
        });
        const html = await response.text();

        // 1. Procura por valores monetários formatados (ex: 12,50 ou 1.250,00)
        // Focamos em valores que venham logo após termos de "Total"
        const valueRegex = /(?:Valor total R\$|vTxtPagar|totalNFe)[^>]*>([\d,.]+)</i;
        const valueMatch = html.match(valueRegex);

        let extractedValue = "";
        if (valueMatch) {
            extractedValue = valueMatch[1].replace(/\./g, '').replace(',', '.');
        }

        // 2. Procura pelo nome da empresa (geralmente na classe txtTopo ou txtLoja)
        const nameRegex = /(?:class="txtTopo"|class="txtLoja"|Razão Social)[^>]*>([^<]+)</i;
        const nameMatch = html.match(nameRegex);

        let extractedName = "Compra via Nota Fiscal";
        if (nameMatch) {
            extractedName = nameMatch[1].trim().replace(/\s+/g, ' ');
        }

        // Se não achou nada, vamos logar o status para depurar
        console.log(`[Proxy] Status: ${response.status} | Valor: ${extractedValue}`);

        return NextResponse.json({
            name: extractedName,
            value: extractedValue
        });

    } catch (error) {
        return NextResponse.json({ error: 'Falha na conexão' }, { status: 500 });
    }
}