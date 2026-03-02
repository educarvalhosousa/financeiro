import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const nfeUrl = searchParams.get('url');

    if (!nfeUrl) return NextResponse.json({ error: 'URL ausente' }, { status: 400 });

    try {
        const response = await fetch(nfeUrl);
        const html = await response.text();

        // Lógica de extração para o estado de São Paulo (SAT/NFC-e)
        // Buscamos o Valor Total e o Nome da Loja no HTML
        const totalMatch = html.match(/class="vTxtPagar">([\d,.]+)</);
        const storeMatch = html.match(/class="txtTopo">([^<]+)</);

        const value = totalMatch ? totalMatch[1].replace(',', '.') : '';
        const name = storeMatch ? storeMatch[1].trim() : 'Compra via Nota Fiscal';

        return NextResponse.json({ name, value });
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao ler a nota' }, { status: 500 });
    }
}
