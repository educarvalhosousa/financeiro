"use client"
import React, { useState } from 'react';
import { FinanceProvider, useFinance, DEFAULT_CATEGORIES } from './context/FinanceContext';
import DashboardCharts from './components/Charts';
import QrScanner from './components/QrScanner';
import { Filter, LogOut, Calendar, Tag, Loader2, Users, UserMinus, Trash2, X, QrCode, Copy, Check } from 'lucide-react';
import { supabase } from './utils/supabase';

const formatCurrency = (value) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// --- CABEÇALHO (RESTAURADO ESTILO PRINT 2) ---
const Header = ({ onManageCategories, onManageHousehold }) => {
    const { currentUser, logout } = useFinance();
    return (
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <img src="/logo6.png" alt="FinanSee" style={{ height: '30px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={onManageHousehold} className="btn-icon-glass" style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}><Users size={18} /></button>
                <button onClick={onManageCategories} className="btn-icon-glass" style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}><Tag size={18} /></button>

                {/* Badge Perfil Pílula */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent-primary)', padding: '5px 12px', borderRadius: '25px', fontSize: '14px', fontWeight: '500' }}>
                    {currentUser.picture && <img src={currentUser.picture} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%' }} />}
                    <span>{currentUser.name}</span>
                </div>

                <button onClick={logout} style={{ color: '#ff4444', background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}><LogOut size={20} /></button>
            </div>
        </header>
    );
};

const HouseholdManager = ({ isOpen, onClose }) => {
    const { currentUser, householdMembers, removeMember } = useFinance();
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(currentUser?.household_id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 9999, display: 'flex' }} onClick={(e) => e.target.className === 'modal-overlay' && onClose()}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2 style={{ marginBottom: '20px' }}>Gerenciar Casa</h2>

                <div className="invite-box-container">
                    <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '8px' }}>Seu Código de Convite</label>
                    <div className="copy-field" style={{ background: '#000', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #333' }}>
                        <code style={{ fontSize: '12px', color: '#fff', wordBreak: 'break-all', marginRight: '10px' }}>{currentUser?.household_id}</code>
                        <button onClick={handleCopy} className="btn-copy" style={{ background: 'var(--accent-primary)', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', flexShrink: 0 }}>
                            {copied ? "Copiado!" : "Copiar"}
                        </button>
                    </div>
                </div>

                <div className="members-section" style={{ marginTop: '20px' }}>
                    <h3 style={{ fontSize: '14px', color: '#fff', marginBottom: '12px' }}>Membros Ativos</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', paddingRight: '5px' }}>
                        {/* O '?' aqui é a trava de segurança para não dar erro */}
                        {householdMembers?.map((member) => (
                            <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <img
                                        src={member.picture}
                                        onError={(e) => {
                                            console.warn("Foto falhou, usando iniciais.");
                                            e.target.onerror = null;
                                            e.target.src = 'https://ui-avatars.com/api/?name=' + member.full_name;
                                        }}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            objectFit: 'cover'
                                        }}
                                        alt={member.full_name}
                                    />
                                    <span style={{ fontSize: '14px' }}>{member.full_name} {member.id === currentUser.id && "(Você)"}</span>
                                </div>
                                {member.id !== currentUser.id && (
                                    <button
                                        onClick={() => { if (confirm("Remover membro?")) removeMember(member.id) }}
                                        style={{ color: '#ff4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                                    >
                                        Remover
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: '20px', width: '100%', background: 'rgba(255,255,255,0.05)', color: '#fff' }}>Fechar</button>
            </div>
        </div>
    );
};

// --- GERENCIADOR DE CATEGORIAS (COM EDIÇÃO) ---
const CategoryManager = ({ isOpen, onClose }) => {
    const { categories, addCategory, removeCategory, updateCategory } = useFinance();
    const [newCat, setNewCat] = useState({ name: '', type: 'expense' });
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');

    if (!isOpen) return null;

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newCat.name.trim()) return;
        await addCategory(newCat);
        setNewCat({ ...newCat, name: '' });
    };

    const handleUpdate = async (id) => {
        if (!editName.trim()) return;
        await updateCategory(id, { name: editName });
        setEditingId(null);
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 9999, display: 'flex' }} onClick={(e) => e.target.className === 'modal-overlay' && onClose()}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2 style={{ marginBottom: '20px' }}>Gerenciar Categorias</h2>

                <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
                    <input
                        placeholder="Nova categoria..."
                        value={newCat.name}
                        onChange={e => setNewCat({ ...newCat, name: e.target.value })}
                        style={{ flex: 3, padding: '12px', borderRadius: '8px', background: '#222', border: '1px solid #444', color: 'white', minWidth: '0' }}
                    />
                    <select
                        value={newCat.type}
                        onChange={e => setNewCat({ ...newCat, type: e.target.value })}
                        style={{ flex: 1.5, padding: '12px 8px', borderRadius: '8px', background: '#222', border: '1px solid #444', color: 'white', fontSize: '14px', minWidth: '0' }}
                    >
                        <option value="expense">Despesa</option>
                        <option value="income">Receita</option>
                    </select>
                    <button type="submit" className="btn btn-primary" style={{ width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0', fontSize: '20px', flexShrink: 0 }}>+</button>
                </form>

                <div className="category-list" style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {categories.map(cat => (
                        <div key={cat.id || `default-${cat.name}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: cat.type === 'income' ? '#4ade80' : '#f87171' }}></div>
                                {editingId === cat.id ? (
                                    <input
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        onBlur={() => handleUpdate(cat.id)}
                                        onKeyDown={e => e.key === 'Enter' && handleUpdate(cat.id)}
                                        autoFocus
                                        style={{ background: '#000', border: '1px solid var(--accent-primary)', color: 'white', padding: '4px 8px', borderRadius: '4px', width: '80%' }}
                                    />
                                ) : (
                                    <span style={{ fontSize: '14px' }}>{cat.name}</span>
                                )}
                            </div>

                            {cat.id && ( // Só categorias do usuário
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {editingId !== cat.id ? (
                                        <button onClick={() => { setEditingId(cat.id); setEditName(cat.name); }} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px' }}>Editar</button>
                                    ) : (
                                        <button onClick={() => handleUpdate(cat.id)} style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', fontSize: '12px' }}>Salvar</button>
                                    )}
                                    <button onClick={() => removeCategory(cat.id)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '12px' }}>Excluir</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: '20px', width: '100%' }}>Fechar</button>
            </div>
        </div>
    );
};

// --- FILTRO BAR (RESTAURADO ESTILO PRINT 2 - SEM GRUDAR) ---
const FilterBar = () => {
    const { filters, setFilters, categories, householdMembers } = useFinance();
    return (
        <div className="card" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                <Filter size={16} /> Filtros
            </div>

            {/* Linha 1: Lado a Lado */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <select value={filters.period} onChange={e => setFilters({ ...filters, period: e.target.value })}>
                    <option value="month">Mês Atual</option>
                    <option value="all">Todo o período</option>
                    <option value="custom">Personalizado</option>
                </select>
                <select value={filters.user} onChange={e => setFilters({ ...filters, user: e.target.value })}>
                    <option value="all">Todos Membros</option>
                    {householdMembers?.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
            </div>

            {/* Linha 2: Categorias abaixo */}
            <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}>
                <option value="all">Todas Categorias</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>

            {/* Calendário Personalizado */}
            {filters.period === 'custom' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '5px' }}>
                    <div className="date-input-wrapper">
                        <Calendar size={14} />
                        <input type="date" value={filters.startDate || ''} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
                    </div>
                    <div className="date-input-wrapper">
                        <Calendar size={14} />
                        <input type="date" value={filters.endDate || ''} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MODAL DE LANÇAMENTO (COM SCANNER E CATEGORIZAÇÃO) ---
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

            // Verifica se a API deu erro de servidor (500)
            if (!response.ok) {
                const errData = await response.json();
                alert(`Erro no servidor: ${errData.error || 'Falha desconhecida'}`);
                return;
            }

            const data = await response.json();

            if (data.value && data.value !== "") {
                const detectedCategory = suggestCategory(data.name);
                setForm(prev => ({
                    ...prev,
                    name: data.name,
                    value: data.value,
                    category: detectedCategory
                }));
            } else {
                // Se o valor veio vazio, a SEFAZ bloqueou o robô
                alert("A SEFAZ bloqueou a leitura automática desta vez. Tente novamente ou digite o valor.");
            }
        } catch (error) {
            alert("Erro técnico: Verifique se o seu servidor Next.js está rodando.");
        } finally {
            setIsExtracting(false);
        }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 9999, display: 'flex' }} onClick={(e) => e.target.className === 'modal-overlay' && onClose()}>
            <div className="modal-content">
                <h2 style={{ marginBottom: '20px' }}>Novo Lançamento</h2>
                {!showScanner ? (
                    <button onClick={() => setShowScanner(true)} className="btn btn-scan" style={{ width: '100%', marginBottom: '15px', display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
                        {isExtracting ? <Loader2 className="animate-spin" size={18} /> : <QrCode size={18} />}
                        {isExtracting ? "Lendo..." : "Escanear Nota Fiscal"}
                    </button>
                ) : (
                    <div style={{ marginBottom: '15px' }}>
                        <QrScanner onScanSuccess={handleScanSuccess} />
                        <button onClick={() => setShowScanner(false)} className="btn btn-danger" style={{ width: '100%', marginTop: '10px' }}>Cancelar Scanner</button>
                    </div>
                )}
                <form onSubmit={async (e) => { e.preventDefault(); await addTransaction({ ...form, value: parseFloat(form.value) }); onClose(); }} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div className="form-group"><label>Descrição</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                    <div className="form-group"><label>Valor (R$)</label><input type="number" step="0.01" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} required /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="form-group"><label>Tipo</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="income">Receita</option><option value="expense">Despesa</option></select></div>
                        <div className="form-group"><label>Categoria</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.filter(c => c.type === form.type).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ padding: '14px' }}>Adicionar Lançamento</button>
                </form>
            </div>
        </div>
    );
};

// --- TELA DE LOGIN (CORRIGIDA - CENTRALIZADA) ---
const Login = () => {
    const handleGoogleLogin = async () => {
        await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    };
    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', background: '#0a0a0c' }}>
            <img src="/logo4.png" alt="FinanSee" style={{ width: '220px', marginBottom: '40px' }} />
            <div className="card" style={{ padding: '30px', width: '100%', maxWidth: '350px', textAlign: 'center' }}>
                <h3 style={{ marginBottom: '20px', color: '#fff' }}>Seja bem-vindo</h3>
                <button onClick={handleGoogleLogin} className="btn-google" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '12px', borderRadius: '12px', background: '#fff', color: '#000', fontWeight: '600', border: 'none' }}>
                    <img src="https://www.google.com/favicon.ico" alt="" style={{ width: '18px' }} />
                    Entrar com Google
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
        <div className="container" style={{ padding: '15px' }}>
            <Header onManageCategories={() => setModals(prev => ({ ...prev, cat: true }))} onManageHousehold={() => setModals(prev => ({ ...prev, house: true }))} />

            <div className="dashboard-grid">
                <div className="main-content">
                    <div className="card balance-card" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', padding: '25px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>SALDO EM NUVEN {filters.period !== 'all' && '(FILTRO)'}</div>
                        <div style={{ fontSize: '36px', fontWeight: '800', marginTop: '5px' }}>{formatCurrency(totals.balance)}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                        <div className="card" style={{ padding: '15px' }}><div style={{ fontSize: '12px', color: '#888' }}>Receitas</div><div style={{ color: '#4ade80', fontSize: '18px', fontWeight: 'bold' }}>{formatCurrency(totals.income)}</div></div>
                        <div className="card" style={{ padding: '15px' }}><div style={{ fontSize: '12px', color: '#888' }}>Despesas</div><div style={{ color: '#f87171', fontSize: '18px', fontWeight: 'bold' }}>{formatCurrency(totals.expense)}</div></div>
                    </div>
                    <DashboardCharts />
                </div>

                <div className="sidebar-content" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <FilterBar />
                    <div className="transactions-section">
                        <div className="section-title">Histórico</div>
                        <div className="list-container">
                            {/* Lista de transações aqui... */}
                        </div>
                    </div>
                </div>
            </div>

            <button className="fab" onClick={() => setModals(prev => ({ ...prev, add: true }))} style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--accent-primary)', border: 'none', color: 'white', position: 'fixed', bottom: '25px', right: '25px', fontSize: '28px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>+</button>
            <Modal isOpen={modals.add} onClose={() => setModals(prev => ({ ...prev, add: false }))} />
            <HouseholdManager isOpen={modals.house} onClose={() => setModals(prev => ({ ...prev, house: false }))} />
            <CategoryManager isOpen={modals.cat} onClose={() => setModals(prev => ({ ...prev, cat: false }))} />
        </div>
    );
}