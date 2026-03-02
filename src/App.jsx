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

const Header = ({ onManageCategories, onManageHousehold }) => {
    const { currentUser, logout } = useFinance();
    return (
        <header>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <img src="/logo6.png" alt="FinanSe" style={{ height: '35px', width: 'auto' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={onManageHousehold} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'white', padding: '6px', borderRadius: '8px', cursor: 'pointer' }} title="Configurações da Casa">
                    <Users size={16} />
                </button>
                <button onClick={onManageCategories} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'white', padding: '6px', borderRadius: '8px', cursor: 'pointer' }} title="Gerenciar Categorias">
                    <Tag size={16} />
                </button>
                <div style={{ background: 'var(--accent-primary)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {currentUser.picture && <img src={currentUser.picture} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />}
                    {currentUser.name}
                </div>
                <button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer' }}>
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
};

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
                <h2 style={{ marginBottom: '20px' }}>Minha Casa</h2>
                <div style={{ marginBottom: '30px', padding: '15px', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Seu Código de Convite:</label>
                    <code style={{ background: '#000', padding: '10px', borderRadius: '8px', fontSize: '0.7rem', display: 'block', textAlign: 'center' }}>
                        {currentUser.household_id || 'Carregando...'}
                    </code>
                </div>
                <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input placeholder="Cole o código do parceiro..." value={inviteCode} onChange={e => setInviteCode(e.target.value)} required />
                    <button type="submit" className="btn btn-primary">Vincular Contas</button>
                </form>
                {status && <p style={{ fontSize: '0.8rem', marginTop: '10px', textAlign: 'center' }}>{status}</p>}
                <button className="btn" style={{ background: 'var(--glass-bg)', width: '100%', marginTop: '15px' }} onClick={onClose}>Fechar</button>
            </div>
        </div>
    );
};

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
            <div className="modal-content" style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ marginBottom: '20px' }}>Categorias</h2>
                <form onSubmit={handleSubmit} style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                    <input placeholder="Nova categoria..." value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} style={{ flex: 1 }} />
                    <select value={newCat.type} onChange={e => setNewCat({ ...newCat, type: e.target.value })} style={{ width: '100px' }}>
                        <option value="income">Rec</option>
                        <option value="expense">Des</option>
                    </select>
                    <button type="submit" className="btn btn-primary" style={{ width: '45px' }}>+</button>
                </form>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {categories.map((c, idx) => (
                        <div key={c.id || idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid var(--glass-border)' }}>
                            <span>{c.name}</span>
                            <button onClick={() => removeCategory(c.id)} style={{ background: 'none', border: 'none', color: 'var(--accent-danger)' }}>✕</button>
                        </div>
                    ))}
                </div>
                <button className="btn" style={{ marginTop: '20px', background: 'var(--glass-bg)' }} onClick={onClose}>Fechar</button>
            </div>
        </div>
    );
};

const FilterBar = () => {
    const { filters, setFilters, categories, householdMembers } = useFinance();
    return (
        <div className="card" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: '600' }}>
                <Filter size={16} /> Filtros
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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

const Modal = ({ isOpen, onClose }) => {
    const { addTransaction, categories } = useFinance();
    const [form, setForm] = useState({ name: '', value: '', type: 'expense', category: DEFAULT_CATEGORIES[0].name });
    const [showScanner, setShowScanner] = useState(false);

    if (!isOpen) return null;

    const handleScanSuccess = (url) => {
        setShowScanner(false);
        alert("Nota capturada com sucesso! Link: " + url);
        console.log("Link NFC-e:", url);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.value) return;
        await addTransaction({ ...form, value: parseFloat(form.value) });
        setForm({ ...form, name: '', value: '' });
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && onClose()}>
            <div className="modal-content">
                <h2 style={{ marginBottom: '24px' }}>Novo Lançamento</h2>

                {!showScanner ? (
                    <button onClick={() => setShowScanner(true)} className="btn" style={{ marginBottom: '20px', background: 'var(--glass-bg)', border: '1px solid var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <QrCode size={18} /> Escanear Nota Fiscal
                    </button>
                ) : (
                    <div style={{ marginBottom: '20px' }}>
                        <QrScanner onScanSuccess={handleScanSuccess} />
                        <button onClick={() => setShowScanner(false)} className="btn" style={{ background: 'transparent', color: 'var(--accent-danger)' }}>Cancelar Scanner</button>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group"><label>Descrição</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                    <div className="form-group"><label>Valor (R$)</label><input type="number" step="0.01" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} required /></div>
                    <div className="row">
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
                                {categories.filter(c => c.type === form.type).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary">Adicionar Lançamento</button>
                    <button type="button" className="btn" style={{ background: 'transparent', color: 'var(--text-secondary)', marginTop: '10px' }} onClick={onClose}>Cancelar</button>
                </form>
            </div>
        </div>
    );
};

const Login = () => {
    const handleGoogleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
                queryParams: { access_type: 'offline', prompt: 'consent' },
            }
        });
    };

    return (
        <div className="container" style={{ justifyContent: 'center', height: '100vh', display: 'flex', alignItems: 'center' }}>
            <div className="card" style={{ textAlign: 'center', maxWidth: '400px', width: '90%' }}>
                <img src="/logo4.png" alt="FinanSe" style={{ width: '180px', marginBottom: '30px' }} />
                <button onClick={handleGoogleLogin} className="btn btn-primary" style={{ background: '#fff', color: '#000', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <img src="https://www.google.com/favicon.ico" alt="" style={{ width: '18px' }} />
                    Entrar com Google
                </button>
            </div>
        </div>
    );
};

export default function MainApp() {
    const { currentUser, totals, isLoading } = useFinance();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [isHouseholdModalOpen, setIsHouseholdModalOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Loader2 className="animate-spin" size={48} color="var(--accent-primary)" />
            </div>
        );
    }

    if (!currentUser) return <Login />;

    return (
        <div className="container">
            <Header
                onManageCategories={() => setIsCatModalOpen(true)}
                onManageHousehold={() => setIsHouseholdModalOpen(true)}
            />

            <div className="dashboard-grid">
                <div className="main-content">
                    <div className="card balance-card">
                        <div className="balance-label">Saldo em Nuvem</div>
                        <div className="balance-value">{formatCurrency(totals.balance)}</div>
                    </div>
                    <div className="row">
                        <div className="stat-item">
                            <div className="stat-label">Receitas</div>
                            <div className="stat-value income">{formatCurrency(totals.income)}</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-label">Despesas</div>
                            <div className="stat-value expense">{formatCurrency(totals.expense)}</div>
                        </div>
                    </div>
                    <DashboardCharts />
                </div>

                <div className="sidebar-content">
                    <FilterBar />
                    <TransactionList />
                </div>
            </div>

            <button className="fab" onClick={() => setIsModalOpen(true)}>+</button>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            <CategoryManager isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} />
            <HouseholdManager isOpen={isHouseholdModalOpen} onClose={() => setIsHouseholdModalOpen(false)} />
        </div>
    );
}