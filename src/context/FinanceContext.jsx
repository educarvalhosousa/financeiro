"use client"
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabase';

const FinanceContext = createContext();

export const useFinance = () => useContext(FinanceContext);

export const DEFAULT_CATEGORIES = [
    { name: 'Alimentação', type: 'expense', icon: 'Utensils' },
    { name: 'Lazer', type: 'expense', icon: 'Gamepad' },
    { name: 'Transporte', type: 'expense', icon: 'Car' },
    { name: 'Saúde', type: 'expense', icon: 'HeartPulse' },
    { name: 'Salário', type: 'income', icon: 'Wallet' },
    { name: 'Investimentos', type: 'income', icon: 'TrendingUp' },
];

export const FinanceProvider = ({ children }) => {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [householdMembers, setHouseholdMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter State
    const [filters, setFilters] = useState({
        period: 'month',
        category: 'all',
        user: 'all',
        startDate: '',
        endDate: ''
    });

    // 1. Escutar Mudanças de Autenticação
    useEffect(() => {
        console.log('FinanceContext: Inicializando monitor de auth...');

        // Função interna para buscar o perfil e atualizar o household_id em background
        const enrichUserWithProfile = async (session) => {
            if (!session) return;
            console.log('FinanceContext: Enriquecendo perfil para:', session.user.id);
            try {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('household_id, full_name, avatar_url')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (error) {
                    console.warn('FinanceContext: Erro ao buscar perfil (usuário pode não ter registro em public.profiles):', error.message);
                    return;
                }

                if (profile) {
                    console.log('FinanceContext: Perfil encontrado, household_id:', profile.household_id);
                    setCurrentUser(prev => prev ? {
                        ...prev,
                        name: profile.full_name || prev.name,
                        picture: profile.avatar_url || prev.picture,
                        household_id: profile.household_id
                    } : null);
                } else {
                    console.log('FinanceContext: Nenhum perfil encontrado na tabela public.profiles para este ID.');
                }
            } catch (err) {
                console.error('FinanceContext: Falha ao enriquecer perfil:', err);
            }
        };

        // Tentar pegar a sessão atual imediatamente
        const initAuth = async () => {
            console.log('FinanceContext: Iniciando initAuth...');
            console.log('FinanceContext: Supabase URL detectada:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 15) + '...');

            // Safety Hatch: Se em 10 segundos não carregar, libera a tela
            const timeout = setTimeout(() => {
                if (isLoading) {
                    console.warn('FinanceContext: Timeout de carregamento atingido! Forçando desbloqueio.');
                    setIsLoading(false);
                }
            }, 10000);

            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error('FinanceContext: Erro ao recuperar sessão:', sessionError.message);
                }

                console.log('FinanceContext: Sessão inicial:', session ? 'Encontrada' : 'Nula');

                if (session) {
                    setCurrentUser({
                        id: session.user.id,
                        name: session.user.user_metadata.full_name,
                        picture: session.user.user_metadata.avatar_url,
                        email: session.user.email,
                        household_id: null
                    });
                    enrichUserWithProfile(session);
                }
            } catch (err) {
                console.error('FinanceContext: Erro fatal no initAuth:', err);
            } finally {
                clearTimeout(timeout);
                setIsLoading(false);
            }
        };

        initAuth();

        // Escutar eventos de auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('FinanceContext: Evento Auth:', event, session ? 'Logado' : 'Deslogado');

            if (session) {
                setCurrentUser({
                    id: session.user.id,
                    name: session.user.user_metadata.full_name,
                    picture: session.user.user_metadata.avatar_url,
                    email: session.user.email,
                    household_id: null
                });
                enrichUserWithProfile(session);
            } else {
                setCurrentUser(null);
            }

            setIsLoading(false);
        });

        return () => {
            console.log('FinanceContext: Desinscrevendo do monitor de auth');
            subscription.unsubscribe();
        };
    }, []);

    // 2. Função para buscar dados (pode ser chamada quando trocar de household)
    const fetchData = async () => {
        if (!currentUser) return;
        console.log('FinanceContext: Iniciando fetchData para household_id:', currentUser.household_id);
        setIsLoading(true);

        try {
            // Buscar Transações (Household ou Próprias)
            const query = supabase.from('transactions').select('*').order('date', { ascending: false });
            if (currentUser.household_id) query.eq('household_id', currentUser.household_id);
            else query.eq('user_id', currentUser.id);

            const { data: transData, error: transError } = await query;
            if (transError) console.error('FinanceContext: Erro transações:', transError);
            if (transData) setTransactions(transData);

            // Buscar Categorias
            const catQuery = supabase.from('categories').select('*');
            if (currentUser.household_id) catQuery.eq('household_id', currentUser.household_id);
            else catQuery.eq('user_id', currentUser.id);

            const { data: catData, error: catError } = await catQuery;
            if (catError) console.error('FinanceContext: Erro categorias:', catError);
            if (catData) setCategories([...DEFAULT_CATEGORIES, ...catData]);

            // Buscar Membros da Casa
            if (currentUser.household_id) {
                const { data: members, error: memError } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .eq('household_id', currentUser.household_id);
                if (memError) console.error('FinanceContext: Erro membros:', memError);
                if (members) setHouseholdMembers(members);
            } else {
                setHouseholdMembers([{ id: currentUser.id, full_name: currentUser.name }]);
            }
        } catch (err) {
            console.error('FinanceContext: Erro ao carregar dados:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!currentUser) {
            setTransactions([]);
            setCategories(DEFAULT_CATEGORIES);
            return;
        }
        fetchData();
    }, [currentUser?.id, currentUser?.household_id]);

    const addTransaction = async (transaction) => {
        if (!currentUser) return;

        const newTrans = {
            ...transaction,
            user_id: currentUser.id,
            household_id: currentUser.household_id,
            date: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('transactions')
            .insert([newTrans])
            .select();

        if (!error && data) {
            setTransactions(prev => [data[0], ...prev]);
        }
    };

    const removeTransaction = async (id) => {
        if (!currentUser) return;
        if (window.confirm('Deseja excluir esta transação?')) {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id);

            if (!error) {
                setTransactions(prev => prev.filter(t => t.id !== id));
            }
        }
    };

    const addCategory = async (category) => {
        if (!currentUser) return;
        const newCat = {
            ...category,
            user_id: currentUser.id,
            household_id: currentUser.household_id
        };

        const { data, error } = await supabase
            .from('categories')
            .insert([newCat])
            .select();

        if (error) {
            console.error('FinanceContext: Erro ao adicionar categoria:', error);
            alert('Erro ao adicionar categoria: ' + error.message);
            return;
        }

        if (data) {
            setCategories(prev => [...prev, data[0]]);
        }
    };

    const updateCategory = async (id, updates) => {
        if (!currentUser) return;
        const { data, error } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) {
            console.error('FinanceContext: Erro ao atualizar categoria:', error);
            alert('Erro ao atualizar categoria: ' + error.message);
            return;
        }

        if (data) {
            setCategories(prev => prev.map(c => c.id === id ? data[0] : c));
        }
    };

    const removeCategory = async (id) => {
        if (!currentUser) return;
        if (window.confirm('Deseja excluir esta categoria?')) {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('FinanceContext: Erro ao excluir categoria:', error);
                alert('Erro ao excluir categoria: ' + error.message);
                return;
            }

            setCategories(prev => prev.filter(c => c.id !== id));
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
    };

    // Computed: Filtered Transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const matchUser = filters.user === 'all' || t.user_id === filters.user;
            const matchCategory = filters.category === 'all' || t.category === filters.category;

            const tDate = new Date(t.date);
            tDate.setHours(0, 0, 0, 0);

            const now = new Date();
            now.setHours(0, 0, 0, 0);

            let matchPeriod = true;

            if (filters.period === 'month') {
                matchPeriod = tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
            } else if (filters.period === 'week') {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(now.getDate() - 7);
                matchPeriod = tDate >= oneWeekAgo;
            } else if (filters.period === 'custom') {
                const start = filters.startDate ? new Date(filters.startDate) : null;
                const end = filters.endDate ? new Date(filters.endDate) : null;
                if (start) start.setHours(0, 0, 0, 0);
                if (end) end.setHours(23, 59, 59, 999);

                if (start && end) {
                    matchPeriod = tDate >= start && tDate <= end;
                } else if (start) {
                    matchPeriod = tDate >= start;
                } else if (end) {
                    matchPeriod = tDate <= end;
                }
            }

            return matchUser && matchCategory && matchPeriod;
        });
    }, [transactions, filters]);

    const totals = useMemo(() => {
        return filteredTransactions.reduce((acc, t) => {
            const val = parseFloat(t.value);
            if (t.type === 'income') {
                acc.income += val;
                acc.balance += val;
            } else {
                acc.expense += val;
                acc.balance -= val;
            }
            return acc;
        }, { balance: 0, income: 0, expense: 0 });
    }, [filteredTransactions]);

    const chartData = useMemo(() => {
        const categoriesData = filteredTransactions.reduce((acc, t) => {
            if (t.type === 'expense') {
                acc[t.category] = (acc[t.category] || 0) + parseFloat(t.value);
            }
            return acc;
        }, {});

        return Object.keys(categoriesData).map(name => ({
            name,
            value: categoriesData[name]
        }));
    }, [filteredTransactions]);

    const joinHousehold = async (inviteCode) => {
        if (!currentUser || !inviteCode) return { error: 'Dados inválidos' };

        // 1. O código de convite é o próprio household_id (UUID)
        // No futuro podemos simplificar para um código curto mais amigável
        const { data: household, error: hError } = await supabase
            .from('households')
            .select('id')
            .eq('id', inviteCode)
            .single();

        if (hError || !household) return { error: 'Código de convite inválido' };

        // 2. Atualizar o perfil do usuário atual
        const { error: pError } = await supabase
            .from('profiles')
            .update({ household_id: household.id })
            .eq('id', currentUser.id);

        if (pError) return { error: 'Erro ao vincular conta' };

        // 3. Atualizar estado local
        setCurrentUser(prev => ({ ...prev, household_id: household.id }));
        return { success: true };
    };

    return (
        <FinanceContext.Provider value={{
            transactions: filteredTransactions,
            allTransactions: transactions,
            addTransaction,
            removeTransaction,
            totals,
            currentUser,
            isLoading,
            logout,
            categories,
            addCategory,
            removeCategory,
            updateCategory,
            filters,
            setFilters,
            chartData,
            joinHousehold,
            householdMembers
        }}>
            {children}
        </FinanceContext.Provider>
    );
};
