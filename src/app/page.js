"use client"
import { FinanceProvider } from '../context/FinanceContext';
import MainApp from '../App'; // Isso sai da pasta 'app' e entra na 'src'

export default function Home() {
    return (
        <FinanceProvider>
            <MainApp />
        </FinanceProvider>
    );
}