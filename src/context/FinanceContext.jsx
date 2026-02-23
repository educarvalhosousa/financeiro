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
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setCurrentUser({
                    id: session.user.id,
                    name: session.user.user_metadata.full_name,
                    picture: session.user.user_metadata.avatar_url,
                    email: session.user.email
                });
            }
            setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setCurrentUser({
                    id: session.user.id,
                    name: session.user.user_metadata.full_name,
                    picture: session.user.user_metadata.avatar_url,
                    email: session.user.email
                });
            } else {
                setCurrentUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // 2. Buscar Dados do Supabase quando o usuário estiver logado
    useEffect(() => {
        if (!currentUser) {
            setTransactions([]);
            setCategories(DEFAULT_CATEGORIES);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);

            // Buscar Transações
            const { data: transData } = await supabase
                .from('transactions')
                .select('*')
                .order('date', { ascending: false });

            if (transData) setTransactions(transData);

            // Buscar Categorias (Customizadas + Padrão se desejar)
            const { data: catData } = await supabase
                .from('categories')
                .select('*');

            if (catData) {
                setCategories([...DEFAULT_CATEGORIES, ...catData]);
            }

            setIsLoading(false);
        };

        fetchData();
    }, [currentUser]);

    const addTransaction = async (transaction) => {
        if (!currentUser) return;

        const newTrans = {
            ...transaction,
            user_id: currentUser.id,
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
        const newCat = { ...category, user_id: currentUser.id };

        const { data, error } = await supabase
            .from('categories')
            .insert([newCat])
            .select();

        if (!error && data) {
            setCategories(prev => [...prev, data[0]]);
        }
    };

    const removeCategory = async (id) => {
        if (!currentUser) return;
        if (window.confirm('Deseja excluir esta categoria?')) {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (!error) {
                setCategories(prev => prev.filter(c => c.id !== id));
            }
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
    };

    // Computed: Filtered Transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const matchUser = filters.user === 'all' || t.userName === filters.user;
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
            filters,
            setFilters,
            chartData
        }}>
            {children}
        </FinanceContext.Provider>
    );
};
