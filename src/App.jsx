"use client"
import React, { useState } from 'react';
import { FinanceProvider, useFinance, DEFAULT_CATEGORIES } from './context/FinanceContext';
import DashboardCharts from './components/Charts';
import QrScanner from './components/QrScanner';
import { Filter, LogOut, Calendar, Tag, Loader2, Users, QrCode, Copy, Check } from 'lucide-react';
import { supabase } from './utils/supabase';

const formatCurrency = (value) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// --- CABEÇALHO RESTAURADO (PRINT 2) ---
const Header = ({ onManageCategories, onManageHousehold }) => {
    const { currentUser, logout } = useFinance();
    return (
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <img src="/logo6.png" alt="FinanSee" style={{ height: '32px' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={onManageHousehold} className="btn-icon-glass" title="Membros"><Users size={18} /></button>
                <button onClick={onManageCategories} className="btn-icon-glass" title="Categorias"><Tag size={18} /></button>

                <div className="user-pill-badge">
                    {currentUser.picture && <img src={currentUser.picture} alt="" className="user-avatar-small" />}
                    <span className="user-name-text">{currentUser.name}</span>
                </div>

                <button onClick={logout} className="btn-exit-glass"><LogOut size={18} /></button>
            </div>
        </header>
    );
};

// --- GERENCIADOR DE CASA COM BOTÃO COPIAR ---
const HouseholdManager = ({ isOpen, onClose }) => {
    const { currentUser, joinHousehold } = useFinance();
    const [inviteCode, setInviteCode] = useState('');
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(currentUser.household_id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && onClose()}>
            <div className="modal-content">
                <h2>Gerenciar Casa</h2>
                <div className="invite-box-container">
                    <label>Seu Código de Convite</label>
                    <div className="copy-field">
                        <code>{currentUser.household_id}</code>
                        <button onClick={handleCopy} className="btn-copy">
                            {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                        </button>
                    </div>
                </div>
                <div className="divider">ou entre em uma casa</div>
                <form onSubmit={async (e) => { e.preventDefault(); await joinHousehold(inviteCode); onClose(); }} className="stack">
                    <input placeholder="Código do parceiro..." value={inviteCode} onChange={e => setInviteCode(e.target.value)} />
                    <button type="submit" className="btn btn-primary">Vincular</button>
                </form>
                <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: '10px' }}>Fechar</button>
            </div>
        </div>
    );
};

// --- FILTRO BAR RESTAURADO COM DATA PERSONALIZADA (PRINT 2) ---
const FilterBar = () => {
    const { filters, setFilters, categories, householdMembers } = useFinance();

    return (
        <div className="card filter-card-container">
            <div className="card-header-row"><Filter size={16} /> Filtros</div>
            <div className="filter-controls-stack">
                <div className="filter-row-top">
                    <select value={filters.period} onChange={e => setFilters({ ...filters, period: e.target.value })}>
                        <option value="month">Mês Atual</option>
                        <option value="all">Todo o período</option>
                        <option value="custom">Personalizado</option>
                    </select>
                    <select value={filters.user} onChange={e => setFilters({ ...filters, user: e.target.value })}>
                        <option value="all">Todos Membros</option>
                        {householdMembers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                    </select>
                </div>

                {filters.period === 'custom' && (
                    <div className="filter-row-dates animate-in">
                        <div className="date-input-group">
                            <Calendar size={14} />
                            <input type="date" value={filters.startDate || ''} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
                        </div>
                        <div className="date-input-group">
                            <Calendar size={14} />
                            <input type="date" value={filters.endDate || ''} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
                        </div>
                    </div>
                )}

                <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}>
                    <option value="all">Todas Categorias</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
            </div>
        </div>
    );
};

// --- MODAL DE LANÇAMENTO (RESTALRADO + SCANNER INTELIGENTE) ---
const Modal = ({ isOpen, onClose }) => {
    const { addTransaction, categories } = useFinance();
    const [form, setForm] = useState({ name: '', value: '', type: 'expense', category: DEFAULT_CATEGORIES[0].name });
    const [showScanner, setShowScanner] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);

    if (!isOpen) return null;

    const suggestCategory = (storeName) => {
        const name = storeName.toLowerCase();
        const mapping = {
            'Alimentação': ['mercado', 'savegnago', 'extra', 'carrefour', 'pao de acucar', 'atacadao', 'varejão'],
            'Transporte': ['posto', 'shell', 'ipiranga', 'petrobras', 'combustivel', 'uber'],
            'Saúde': ['farmacia', 'droga', 'raia', 'drogasil', 'hospital'],
            'Lazer': ['restaurante', 'bar', 'lanchonete', 'ifood', 'netflix'],
            'Casa': ['leroy', 'madeiranit', 'cpfl', 'sabesp']
        };
        for (const [category, keywords] of Object.entries(mapping)) {
            if (keywords.some(keyword => name.includes(keyword))) return category;
        }
        return 'Outros';
    };

    const handleScanSuccess = async (url) => {
        setShowScanner(false);
        setIsExtracting(true);
        try {
            const response = await fetch(`/api/proxy-nfe?url=${encodeURIComponent(url)}`);
            const data = await response.json();
            if (data.value) {
                const detectedCategory = suggestCategory(data.name);
                setForm(prev => ({ ...prev, name: data.name, value: data.value, category: detectedCategory }));
            }
        } catch (error) { console.error(error); } finally { setIsExtracting(false); }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && onClose()}>
            <div className="modal-content">
                <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Novo Lançamento</h2>

                {!showScanner ? (
                    <button onClick={() => setShowScanner(true)} className="btn-scan-action" disabled={isExtracting}>
                        {isExtracting ? <Loader2 className="animate-spin" size={18} /> : <QrCode size={18} />}
                        {isExtracting ? "Processando..." : "Escanear Nota Fiscal"}
                    </button>
                ) : (
                    <div className="scanner-wrapper">
                        <QrScanner onScanSuccess={handleScanSuccess} />
                        <button onClick={() => setShowScanner(false)} className="btn-cancel-scan">Cancelar Scanner</button>
                    </div>
                )}

                <form onSubmit={async (e) => { e.preventDefault(); await addTransaction({ ...form, value: parseFloat(form.value) }); onClose(); }} className="stack">
                    <div className="form-group"><label>Descrição</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                    <div className="form-group"><label>Valor (R$)</label><input type="number" step="0.01" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} required /></div>
                    <div className="row-split">
                        <div className="form-group flex-1">
                            <label>Tipo</label>
                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                <option value="income">Receita</option>
                                <option value="expense">Despesa</option>
                            </select>
                        </div>
                        <div className="form-group flex-1">
                            <label>Categoria</label>
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                {categories.filter(c => c.type === form.type).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-large">Adicionar Lançamento</button>
                    <button type="button" className="btn-text-only" onClick={onClose}>Cancelar</button>
                </form>
            </div>
        </div>
    );
};

// --- COMPONENTES AUXILIARES ---
const CategoryManager = ({ isOpen, onClose }) => {
    const { categories, addCategory, removeCategory } = useFinance();
    const [newCat, setNewCat] = useState({ name: '', type: 'expense' });
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && onClose()}>
            <div className="modal-content scrollable">
                <h2>Categorias</h2>
                <form onSubmit={async (e) => { e.preventDefault(); await addCategory(newCat); setNewCat({ ...newCat, name: '' }); }} className="row-gap">
                    <input placeholder="Nova..." value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} />
                    <button type="submit" className="btn-add-small">+</button>
                </form>
                <div className="category-list">
                    {categories.map(c => (
                        <div key={c.id} className="category-row">
                            <span>{c.name}</span>
                            <button onClick={() => removeCategory(c.id)} className="btn-del">✕</button>
                        </div>
                    ))}
                </div>
                <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
            </div>
        </div>
    );
};

const TransactionList = () => {
    const { transactions, removeTransaction } = useFinance();
    return (
        <div className="transactions-section">
            <div className="section-title">Histórico</div>
            <div className="list-container">
                {transactions.length === 0 ? (
                    <div className="empty-state">Nenhuma transação encontrada.</div>
                ) : (
                    transactions.map(t => (
                        <div key={t.id} className="transaction-item" onDoubleClick={() => removeTransaction(t.id)}>
                            <div className="transaction-info">
                                <span className="transaction-name">{t.name}</span>
                                <span className="transaction-date">{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className={`stat-value ${t.type}`}>{formatCurrency(t.value)}</div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const Login = () => {
    const handleGoogleLogin = async () => {
        await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    };
    return (
        <div className="login-screen">
            <div className="login-card">
                <img src="/logo4.png" alt="FinanSe" className="login-logo" />
                <button onClick={handleGoogleLogin} className="btn-google">
                    <img src="https://www.google.com/favicon.ico" alt="" /> Entrar com Google
                </button>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
export default function MainApp() {
    const { currentUser, totals, isLoading, filters } = useFinance();
    const [modals, setModals] = useState({ add: false, cat: false, house: false });

    if (isLoading) return <div className="full-loader"><Loader2 className="animate-spin" size={48} /></div>;
    if (!currentUser) return <Login />;

    return (
        <div className="container-main">
            <Header
                onManageCategories={() => setModals({ ...modals, cat: true })}
                onManageHousehold={() => setModals({ ...modals, house: true })}
            />

            <div className="dashboard-layout-grid">
                <div className="column-main">
                    <div className="card balance-hero">
                        <div className="balance-label">SALDO EM NUVEM {filters.period !== 'all' && '(FILTRO)'}</div>
                        <div className="balance-amount">{formatCurrency(totals.balance)}</div>
                    </div>
                    <div className="stats-quick-row">
                        <div className="stat-card"><div className="stat-label">Receitas</div><div className="stat-value income">{formatCurrency(totals.income)}</div></div>
                        <div className="stat-card"><div className="stat-label">Despesas</div><div className="stat-value expense">{formatCurrency(totals.expense)}</div></div>
                    </div>
                    <DashboardCharts />
                </div>

                <div className="column-sidebar">
                    <FilterBar />
                    <TransactionList />
                </div>
            </div>

            <button className="btn-fab-add" onClick={() => setModals({ ...modals, add: true })}>+</button>
            <Modal isOpen={modals.add} onClose={() => setModals({ ...modals, add: false })} />
            <CategoryManager isOpen={modals.cat} onClose={() => setModals({ ...modals, cat: false })} />
            <HouseholdManager isOpen={modals.house} onClose={() => setModals({ ...modals, house: false })} />
        </div>
    );
}