"use client"
import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const QrScanner = ({ onScanSuccess }) => {
    const scannerRef = useRef(null);

    useEffect(() => {
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 }
        };

        // Inicia direto na câmera traseira sem pedir seleção
        html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
                html5QrCode.stop().then(() => {
                    onScanSuccess(decodedText);
                });
            },
            () => { /* Erros de foco ignorados */ }
        ).catch(err => console.error("Erro na câmera:", err));

        return () => {
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop().catch(err => console.error(err));
            }
        };
    }, [onScanSuccess]);

    return (
        <div style={{ position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)', background: '#000' }}>
            <div id="reader" style={{ width: '100%' }}></div>
            <div style={{ position: 'absolute', bottom: '10px', width: '100%', textAlign: 'center', color: 'white', fontSize: '0.8rem', background: 'rgba(0,0,0,0.5)', padding: '5px 0' }}>
                Aponte para o QR Code da nota fiscal
            </div>
        </div>
    );
};

export default QrScanner;