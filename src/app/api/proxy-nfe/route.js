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

        // 1. EXTRAÇÃO DO ESTABELECIMENTO (Conforme print 001)
        const nameRegex = /class="txtTopo">([\s\S]*?)<\/div>/i;
        const nameMatch = html.match(nameRegex);
        let extractedName = "Compra via Nota Fiscal";
        if (nameMatch) {
            extractedName = nameMatch[1].replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
        }

        // 2. EXTRAÇÃO DO VALOR TOTAL (Conforme print 002 - focado no "Valor a pagar")
        let extractedValue = "";

        // Busca o valor que vem logo após o termo "Valor a pagar R$" visto no seu print
        const valueRadarRegex = /Valor a pagar R\$:?[\s\S]{0,100}>([\d\.,]+)</i;
        const valueRadarMatch = html.match(valueRadarRegex);

        if (valueRadarMatch && valueRadarMatch[1]) {
            extractedValue = valueRadarMatch[1].replace(/\./g, '').replace(',', '.');
        }

        // --- BACKUP 1: Pela classe vTxtPagar (caso o radar falhe) ---
        if (!extractedValue) {
            const classMatch = html.match(/class="vTxtPagar"[^>]*>([\s\S]*?)<\/span>/i);
            if (classMatch) {
                extractedValue = classMatch[1].replace(/[^\d,]/g, '').replace(',', '.');
            }
        }

        // --- BACKUP 2: Pelo "Valor pago R$" (visto no print 003) ---
        if (!extractedValue) {
            const paidMatch = html.match(/Valor pago R\$:?[\s\S]{0,50}>([\d\.,]+)</i);
            if (paidMatch) {
                extractedValue = paidMatch[1].replace(/\./g, '').replace(',', '.');
            }
        }

        console.log("--- DEBUG EDU: SCANNER RADAR ---");
        console.log("Loja:", extractedName);
        console.log("Valor:", extractedValue);

        return NextResponse.json({ name: extractedName, value: extractedValue });

    } catch (error) {
        return NextResponse.json({ error: 'Falha na conexão' }, { status: 500 });
    }
}