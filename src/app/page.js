"use client"
import { FinanceProvider } from '../context/FinanceContext';
import MainApp from '../App';

export default function Home() {
    return (
        <FinanceProvider>
            <MainApp />
        </FinanceProvider>
    );
}
