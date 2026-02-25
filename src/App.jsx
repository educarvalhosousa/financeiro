"use client"
import React, { useState } from 'react';
import { FinanceProvider, useFinance, DEFAULT_CATEGORIES } from './context/FinanceContext';
import DashboardCharts from './components/Charts';
import { Filter, LogOut, Calendar, Tag, Loader2, Users } from 'lucide-react';
import { supabase } from './utils/supabase';

const formatCurrency = (value) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const Header = ({ onManageCategories, onManageHousehold }) => {
    const { currentUser, logout } = useFinance();
    return (
        <header>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src="/logo5.png" alt="FinanSe" style={{ height: '80px', width: 'auto' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                    onClick={onManageHousehold}
                    style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'white', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                    title="Configurações da Casa (Compartilhar)"
                >
                    <Users size={16} />
                </button>
                <button
                    onClick={onManageCategories}
                    style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'white', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                    title="Gerenciar Categorias"
                >
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
            setStatus('Sucesso! Você agora compartilha esta casa.');
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
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <code style={{ flex: 1, background: '#000', padding: '10px', borderRadius: '8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                            {currentUser.household_id || 'Carregando...'}
                        </code>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(currentUser.household_id);
                                alert('Código copiado!');
                            }}
                            className="btn btn-primary"
                            style={{ padding: '8px 15px', fontSize: '0.8rem' }}
                        >
                            Copiar
                        </button>
                    </div>
                    <p style={{ fontSize: '0.7rem', marginTop: '10px', color: 'var(--text-secondary)' }}>
                        Envie este código para seu parceiro(a) para compartilharem as finanças.
                    </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '15px' }}>Entrar em uma Casa</h3>
                    <form onSubmit={handleJoin} style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                        <input
                            placeholder="Cole o código do parceiro aqui..."
                            value={inviteCode}
                            onChange={e => setInviteCode(e.target.value)}
                            required
                        />
                        <button type="submit" className="btn btn-primary">Vincular Conta</button>
                    </form>
                    {status && <p style={{ fontSize: '0.8rem', marginTop: '10px', textAlign: 'center', color: status.startsWith('Erro') ? 'var(--accent-danger)' : 'var(--accent-primary)' }}>{status}</p>}
                </div>

                <button className="btn" style={{ background: 'var(--glass-bg)', width: '100%' }} onClick={onClose}>Fechar</button>
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
                <h2 style={{ marginBottom: '20px' }}>Gerenciar Categorias</h2>

                <form onSubmit={handleSubmit} style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                    <input
                        placeholder="Nova categoria..."
                        value={newCat.name}
                        onChange={e => setNewCat({ ...newCat, name: e.target.value })}
                        style={{ flex: 1 }}
                    />
                    <select value={newCat.type} onChange={e => setNewCat({ ...newCat, type: e.target.value })} style={{ width: '100px' }}>
                        <option value="income">Receita</option>
                        <option value="expense">Despesa</option>
                    </select>
                    <button type="submit" className="btn btn-primary" style={{ width: '45px', padding: '10px' }}>+</button>
                </form>

                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {categories.map((c, idx) => (
                        <div key={c.id || idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem' }}>
                            <span>{c.name} <small style={{ color: 'var(--text-secondary)' }}>({c.type === 'income' ? 'Rec' : 'Des'})</small></span>
                            {c.id && (
                                <button
                                    onClick={() => removeCategory(c.id)}
                                    style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer' }}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <button className="btn" style={{ marginTop: '20px', background: 'var(--glass-bg)' }} onClick={onClose}>Fechar</button>
            </div>
        </div>
    );
};

const FilterBar = () => {
    const { filters, setFilters, categories } = useFinance();

    return (
        <div className="card" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: '600' }}>
                <Filter size={16} /> Filtros
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <select value={filters.period} onChange={e => setFilters({ ...filters, period: e.target.value })} style={{ fontSize: '0.75rem', padding: '8px' }}>
                    <option value="all">Todo o período</option>
                    <option value="month">Mês Atual</option>
                    <option value="week">Última Semana</option>
                    <option value="custom">Personalizado (Calendário)</option>
                </select>
                <select value={filters.user} onChange={e => setFilters({ ...filters, user: e.target.value })} style={{ fontSize: '0.75rem', padding: '8px' }}>
                    <option value="all">Todos Membros</option>
                    {useFinance().householdMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.full_name?.split(' ')[0] || 'Membro'}</option>
                    ))}
                </select>
                <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })} style={{ fontSize: '0.75rem', padding: '8px', gridColumn: 'span 2' }}>
                    <option value="all">Todas Categorias</option>
                    {categories.map((c, idx) => <option key={c.id || idx} value={c.name}>{c.name}</option>)}
                </select>
            </div>

            {filters.period === 'custom' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.65rem' }}>De:</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                            style={{ fontSize: '0.75rem', padding: '5px' }}
                        />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.65rem' }}>Até:</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                            style={{ fontSize: '0.75rem', padding: '5px' }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const TransactionList = () => {
    const { transactions, removeTransaction } = useFinance();

    return (
        <div className="transactions-section" style={{ marginBottom: '80px' }}>
            <div className="section-title">Histórico</div>
            <div className="list-container">
                {transactions.length === 0 ? (
                    <div className="empty-state">Nenhuma transação encontrada com estes filtros.</div>
                ) : (
                    transactions.map(t => {
                        const creator = useFinance().householdMembers.find(m => m.id === t.user_id);
                        return (
                            <div key={t.id} className="transaction-item" onDoubleClick={() => removeTransaction(t.id)}>
                                <div className="transaction-info">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span className="transaction-name">{t.name}</span>
                                        {creator && (
                                            <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'var(--glass-bg)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                                                {creator.full_name?.split(' ')[0]}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                        <span className="transaction-date" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <Calendar size={10} /> {new Date(t.date).toLocaleDateString('pt-BR')}
                                        </span>
                                        <span className="transaction-date" style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--accent-primary)' }}>
                                            <Tag size={10} /> {t.category}
                                        </span>
                                    </div>
                                </div>
                                <div className={`stat-value ${t.type}`}>
                                    {t.type === 'income' ? '+' : '-'} {formatCurrency(t.value)}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

const Modal = ({ isOpen, onClose }) => {
    const { addTransaction, categories } = useFinance();
    const [form, setForm] = useState({ name: '', value: '', type: 'expense', category: DEFAULT_CATEGORIES[0].name });

    if (!isOpen) return null;

    const handleTypeChange = (newType) => {
        const firstValidCategory = categories.find(c => c.type === newType)?.name || '';
        setForm({ ...form, type: newType, category: firstValidCategory });
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
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Descrição</label>
                        <input type="text" placeholder="Ex: Mercado, Salário..." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Valor (R$)</label>
                        <input type="number" step="0.01" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} required />
                    </div>
                    <div className="row">
                        <div className="form-group">
                            <label>Tipo</label>
                            <select value={form.type} onChange={e => handleTypeChange(e.target.value)}>
                                <option value="income">Receita (+)</option>
                                <option value="expense">Despesa (-)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Categoria</label>
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                {categories.filter(c => c.type === form.type).map((c, idx) => (
                                    <option key={c.id || idx} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary">Adicionar</button>
                    <button type="button" className="btn" style={{ marginTop: '10px', background: 'transparent', color: 'var(--text-secondary)' }} onClick={onClose}>Cancelar</button>
                </form>
            </div>
        </div>
    );
};

const Login = () => {
    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: process.env.NEXT_PUBLIC_SITE_URL || window.location.origin,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            }
        });
        if (error) console.error('Erro no login:', error.message);
    };

    return (
        <div className="container" style={{ justifyContent: 'center', height: '100vh', display: 'flex', alignItems: 'center' }}>
            <div className="card" style={{ textAlign: 'center', maxWidth: '400px', width: '90%' }}>
                <div style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                    <img src="/logo1.png" alt="FinanSe" style={{ width: '180px', height: 'auto' }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Dados seguros na nuvem</p>
                </div>
                <button
                    onClick={handleGoogleLogin}
                    className="btn btn-primary"
                    style={{ background: '#fff', color: '#000', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                    <img src="https://www.google.com/favicon.ico" alt="" style={{ width: '18px' }} />
                    Entrar com Google
                </button>
                <p style={{ marginTop: '20px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Acesse seus dados de qualquer computador de forma segura.
                </p>
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
            <div className="card balance-card">
                <div className="balance-label">Saldo em Nuvem (Filtro)</div>
                <div className="balance-value" style={{ fontSize: '2rem' }}>{formatCurrency(totals.balance)}</div>
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
            <FilterBar />
            <TransactionList />

            <button className="fab" onClick={() => setIsModalOpen(true)}>+</button>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            <CategoryManager isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} />
            <HouseholdManager isOpen={isHouseholdModalOpen} onClose={() => setIsHouseholdModalOpen(false)} />
        </div>
    );
}
