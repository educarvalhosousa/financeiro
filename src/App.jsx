"use client"
import React, { useState } from 'react';
import { FinanceProvider, useFinance, DEFAULT_CATEGORIES } from './context/FinanceContext';
import DashboardCharts from './components/Charts';
import QrScanner from './components/QrScanner';
import { Filter, LogOut, Calendar, Tag, Loader2, Users, QrCode } from 'lucide-react';
import { supabase } from './utils/supabase';

const formatCurrency = (value) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// --- COMPONENTE: CABEÇALHO ---
const Header = ({ onManageCategories, onManageHousehold }) => {
    const { currentUser, logout } = useFinance();
    return (
        <header>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <img src="/logo6.png" alt="FinanSe" style={{ height: '35px', width: 'auto' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={onManageHousehold} className="btn-icon" title="Configurações da Casa">
                    <Users size={16} />
                </button>
                <button onClick={onManageCategories} className="btn-icon" title="Gerenciar Categorias">
                    <Tag size={16} />
                </button>
                <div className="user-badge">
                    {currentUser.picture && <img src={currentUser.picture} alt="" className="user-avatar" />}
                    {currentUser.name}
                </div>
                <button onClick={logout} className="btn-logout">
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
};

// --- COMPONENTE: GERENCIADOR DE CASA (MEMBROS) ---
const HouseholdManager = ({ isOpen, onClose }) => {
    const { currentUser, joinHousehold } = useFinance();
    const [inviteCode, setInviteCode] = useState('');
    const [status, setStatus] = useState('');

    if (!isOpen) return null;

    const handleJoin = async (e) => {
        e.preventDefault();
        setStatus('Processando...');
        const result = await joinHousehold(inviteCode);
        if (result.success) {
            setStatus('Sucesso! Casa vinculada.');
            setTimeout(onClose, 2000);
        } else {
            setStatus('Erro: ' + result.error);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && onClose()}>
            <div className="modal-content">
                <h2>Minha Casa</h2>
                <div className="code-box">
                    <label>Seu Código de Convite:</label>
                    <code>{currentUser.household_id || 'Carregando...'}</code>
                </div>
                <form onSubmit={handleJoin} className="stack">
                    <input placeholder="Cole o código do parceiro..." value={inviteCode} onChange={e => setInviteCode(e.target.value)} required />
                    <button type="submit" className="btn btn-primary">Vincular Contas</button>
                </form>
                {status && <p className="status-msg">{status}</p>}
                <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: '10px' }}>Fechar</button>
            </div>
        </div>
    );
};

// --- COMPONENTE: GERENCIADOR DE CATEGORIAS ---
const CategoryManager = ({ isOpen, onClose }) => {
    const { categories, addCategory, removeCategory } = useFinance();
    const [newCat, setNewCat] = useState({ name: '', type: 'expense' });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newCat.name) return;
        await addCategory(newCat);
        setNewCat({ ...newCat, name: '' });
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && onClose()}>
            <div className="modal-content scrollable">
                <h2>Categorias</h2>
                <form onSubmit={handleSubmit} className="row">
                    <input placeholder="Nova..." value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} style={{ flex: 1 }} />
                    <button type="submit" className="btn btn-primary">+</button>
                </form>
                <div className="list">
                    {categories.map((c, idx) => (
                        <div key={c.id || idx} className="list-item">
                            <span>{c.name} ({c.type === 'income' ? 'Rec' : 'Des'})</span>
                            <button onClick={() => removeCategory(c.id)} className="btn-delete">✕</button>
                        </div>
                    ))}
                </div>
                <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
            </div>
        </div>
    );
};

// --- COMPONENTE: BARRA DE FILTROS ---
const FilterBar = () => {
    const { filters, setFilters, householdMembers } = useFinance();
    return (
        <div className="card filter-card">
            <div className="card-header"><Filter size={16} /> Filtros</div>
            <div className="filter-grid">
                <select value={filters.period} onChange={e => setFilters({ ...filters, period: e.target.value })}>
                    <option value="all">Todo o período</option>
                    <option value="month">Mês Atual</option>
                </select>
                <select value={filters.user} onChange={e => setFilters({ ...filters, user: e.target.value })}>
                    <option value="all">Todos</option>
                    {householdMembers.map(m => <option key={m.id} value={m.id}>{m.full_name?.split(' ')[0]}</option>)}
                </select>
            </div>
        </div>
    );
};

// --- COMPONENTE: LISTA DE TRANSAÇÕES ---
const TransactionList = () => {
    const { transactions, removeTransaction } = useFinance();
    return (
        <div className="transactions-section">
            <div className="section-title">Histórico</div>
            <div className="list-container">
                {transactions.length === 0 ? (
                    <div className="empty-state">Sem transações.</div>
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

// --- COMPONENTE: MODAL DE LANÇAMENTO (COM SCANNER E CATEGORIZAÇÃO) ---
const Modal = ({ isOpen, onClose }) => {
    const { addTransaction, categories } = useFinance();
    const [form, setForm] = useState({ name: '', value: '', type: 'expense', category: DEFAULT_CATEGORIES[0].name });
    const [showScanner, setShowScanner] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);

    if (!isOpen) return null;

    // Lógica Inteligente de Sugestão de Categoria (Franca/SP)
    const suggestCategory = (storeName) => {
        const name = storeName.toLowerCase();
        const mapping = {
            'Alimentação': ['mercado', 'supermercado', 'savegnago', 'extra', 'carrefour', 'pao de acucar', 'açougue', 'padaria', 'atacadao', 'varejão', 'tonin'],
            'Transporte': ['posto', 'shell', 'ipiranga', 'petrobras', 'combustivel', 'uber', '99app', 'estacionamento', 'gasolina', 'etanol'],
            'Saúde': ['farmacia', 'droga', 'raia', 'drogasil', 'hospital', 'clinica', 'unimed', 'odontoclinic'],
            'Lazer': ['restaurante', 'bar', 'lanchonete', 'cinema', 'ifood', 'netflix', 'spotify', 'sorveteria', 'churrascaria'],
            'Casa': ['leroy', 'madeiranit', 'eletro', 'moveis', 'cpfl', 'sabesp', 'internet', 'claro', 'vivo']
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
                setForm(prev => ({
                    ...prev,
                    name: data.name,
                    value: data.value,
                    category: detectedCategory
                }));
            }
        } catch (error) {
            alert("Erro ao ler dados da SEFAZ.");
        } finally {
            setIsExtracting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.value) return;
        await addTransaction({ ...form, value: parseFloat(form.value) });
        setForm({ name: '', value: '', type: 'expense', category: DEFAULT_CATEGORIES[0].name });
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && onClose()}>
            <div className="modal-content">
                <h2>Novo Lançamento</h2>

                {/* ÁREA DO SCANNER REVISADA */}
                {!showScanner ? (
                    <button onClick={() => setShowScanner(true)} className="btn btn-scan" disabled={isExtracting} style={{ width: '100%', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'var(--glass-bg)', border: '1px solid var(--accent-primary)', color: 'white', padding: '12px', borderRadius: '12px' }}>
                        {isExtracting ? <Loader2 className="animate-spin" size={18} /> : <QrCode size={18} />}
                        {isExtracting ? "Processando..." : "Escanear Nota Fiscal"}
                    </button>
                ) : (
                    <div style={{ marginBottom: '20px' }}>
                        <QrScanner onScanSuccess={handleScanSuccess} />
                        <button onClick={() => setShowScanner(false)} className="btn" style={{ width: '100%', background: 'transparent', color: 'var(--accent-danger)', marginTop: '10px' }}>
                            Cancelar Scanner
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="stack" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div className="form-group">
                        <label>Descrição</label>
                        <input type="text" placeholder="Onde foi gasto?" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Valor (R$)</label>
                        <input type="number" step="0.01" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} required />
                    </div>
                    <div className="row" style={{ display: 'flex', gap: '10px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Tipo</label>
                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                <option value="income">Receita</option>
                                <option value="expense">Despesa</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Categoria</label>
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                {categories.filter(c => c.type === form.type).map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>Adicionar</button>
                    <button type="button" className="btn btn-text" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}>Cancelar</button>
                </form>
            </div>
        </div>
    );
};

// --- COMPONENTE: LOGIN ---
const Login = () => {
    const handleGoogleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
    };
    return (
        <div className="login-container">
            <div className="login-card">
                <img src="/logo4.png" alt="FinanSe" className="login-logo" />
                <button onClick={handleGoogleLogin} className="btn-google">
                    <img src="https://www.google.com/favicon.ico" alt="" />
                    Entrar com Google
                </button>
            </div>
        </div>
    );
};

// --- APP PRINCIPAL (EXPORT DEFAULT) ---
export default function MainApp() {
    const { currentUser, totals, isLoading } = useFinance();
    const [modals, setModals] = useState({ add: false, cat: false, house: false });

    if (isLoading) return <div className="loader-screen"><Loader2 className="animate-spin" size={48} /></div>;
    if (!currentUser) return <Login />;

    return (
        <div className="container">
            <Header
                onManageCategories={() => setModals({ ...modals, cat: true })}
                onManageHousehold={() => setModals({ ...modals, house: true })}
            />

            <div className="dashboard-grid">
                <div className="main-content">
                    <div className="card balance-card">
                        <div className="balance-label">Saldo em Nuvem</div>
                        <div className="balance-value">{formatCurrency(totals.balance)}</div>
                    </div>
                    <div className="row">
                        <div className="stat-item"><div className="stat-label">Receitas</div><div className="stat-value income">{formatCurrency(totals.income)}</div></div>
                        <div className="stat-item"><div className="stat-label">Despesas</div><div className="stat-value expense">{formatCurrency(totals.expense)}</div></div>
                    </div>
                    <DashboardCharts />
                </div>
                <div className="sidebar-content">
                    <FilterBar />
                    <TransactionList />
                </div>
            </div>

            <button className="fab" onClick={() => setModals({ ...modals, add: true })}>+</button>
            <Modal isOpen={modals.add} onClose={() => setModals({ ...modals, add: false })} />
            <CategoryManager isOpen={modals.cat} onClose={() => setModals({ ...modals, cat: false })} />
            <HouseholdManager isOpen={modals.house} onClose={() => setModals({ ...modals, house: false })} />
        </div>
    );
}