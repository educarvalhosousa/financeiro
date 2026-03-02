"use client"
import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QrScanner = ({ onScanSuccess }) => {
    useEffect(() => {
        const scanner = new Html5QrcodeScanner('reader', {
            qrbox: { width: 250, height: 250 },
            fps: 10,
            rememberLastUsedCamera: true,
            aspectRatio: 1.0
        });

        scanner.render(
            (decodedText) => {
                scanner.clear().catch(err => console.error("Erro ao limpar scanner", err));
                onScanSuccess(decodedText);
            },
            (error) => { /* Ignora erros de foco */ }
        );

        return () => {
            scanner.clear().catch(err => console.error("Erro ao fechar scanner", err));
        };
    }, [onScanSuccess]);

    return (
        <div style={{ background: 'var(--card-bg)', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', marginBottom: '15px' }}>
            <div id="reader" style={{ width: '100%', overflow: 'hidden', borderRadius: '8px' }}></div>
            <p style={{ fontSize: '0.75rem', textAlign: 'center', marginTop: '10px', color: 'var(--text-secondary)' }}>
                Posicione o QR Code da nota no quadrado
            </p>
        </div>
    );
};

export default QrScanner;