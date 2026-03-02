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

        // 1. EXTRAÇÃO DO NOME DA LOJA (Classe txtTopo)
        const nameRegex = /<div[^>]*class="txtTopo"[^>]*>([\s\S]*?)<\/div>/i;
        const nameMatch = html.match(nameRegex);
        let extractedName = "Compra via Nota Fiscal";

        if (nameMatch && nameMatch[1]) {
            // Remove espaços extras e possíveis tags HTML dentro do nome
            extractedName = nameMatch[1].replace(/<[^>]*>?/gm, '').trim();
        }

        // 2. EXTRAÇÃO DO VALOR TOTAL (Classe vTxtPagar)
        // Adicionada limpeza agressiva de espaços e caracteres especiais
        const valueRegex = /<span[^>]*class="vTxtPagar"[^>]*>([\s\S]*?)<\/span>/i;
        const valueMatch = html.match(valueRegex);
        let extractedValue = "";

        if (valueMatch && valueMatch[1]) {
            // Limpa o valor: remove "R$", espaços, pontos de milhar e troca vírgula por ponto
            extractedValue = valueMatch[1]
                .replace(/&nbsp;/g, '') // Remove o espaço especial do HTML
                .replace(/[^\d,]/g, '') // Mantém apenas números e a vírgula
                .replace(',', '.');     // Converte para formato decimal do sistema
        }

        console.log("--- RESULTADO DA EXTRAÇÃO (Edu) ---");
        console.log("Estabelecimento:", extractedName);
        console.log("Valor Final:", extractedValue);

        return NextResponse.json({
            name: extractedName,
            value: extractedValue
        });

    } catch (error) {
        return NextResponse.json({ error: 'Erro de conexão' }, { status: 500 });
    }
}