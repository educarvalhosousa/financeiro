import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const FinanceContext = createContext();

export const useFinance = () => useContext(FinanceContext);

export const DEFAULT_CATEGORIES = [
    { id: '1', name: 'Alimentação', type: 'expense', icon: 'Utensils' },
    { id: '2', name: 'Lazer', type: 'expense', icon: 'Gamepad' },
    { id: '3', name: 'Transporte', type: 'expense', icon: 'Car' },
    { id: '4', name: 'Saúde', type: 'expense', icon: 'HeartPulse' },
    { id: '5', name: 'Salário', type: 'income', icon: 'Wallet' },
    { id: '6', name: 'Investimentos', type: 'income', icon: 'TrendingUp' },
];

export const USERS = ['Marido', 'Esposa'];

export const FinanceProvider = ({ children }) => {
    const [transactions, setTransactions] = useState(() => {
        const saved = localStorage.getItem('transactions');
        return saved ? JSON.parse(saved) : [];
    });

    const [currentUser, setCurrentUser] = useState(() => {
        const saved = localStorage.getItem('currentUser');
        try {
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    });

    const [categories, setCategories] = useState(() => {
        const saved = localStorage.getItem('categories');
        return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
    });

    // Filter State
    const [filters, setFilters] = useState({
        period: 'month', // all, month, week, custom
        category: 'all',
        user: 'all',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    }, [transactions]);

    useEffect(() => {
        localStorage.setItem('categories', JSON.stringify(categories));
    }, [categories]);

    useEffect(() => {
        if (currentUser) localStorage.setItem('currentUser', JSON.stringify(currentUser));
        else localStorage.removeItem('currentUser');
    }, [currentUser]);

    const addTransaction = (transaction) => {
        setTransactions(prev => [
            {
                ...transaction,
                id: Date.now(),
                date: new Date().toISOString(),
                userName: currentUser?.name || 'Sistema' // Link to user name
            },
            ...prev
        ]);
    };

    const removeTransaction = (id) => {
        if (window.confirm('Deseja excluir esta transação?')) {
            setTransactions(prev => prev.filter(t => t.id !== id));
        }
    };

    const addCategory = (category) => {
        setCategories(prev => [...prev, { ...category, id: Date.now().toString() }]);
    };

    const removeCategory = (id) => {
        if (window.confirm('Deseja excluir esta categoria?')) {
            setCategories(prev => prev.filter(c => c.id !== id));
        }
    };

    const logout = () => setCurrentUser(null);

    // Computed: Filtered Transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const matchUser = filters.user === 'all' || t.userName === filters.user;
            const matchCategory = filters.category === 'all' || t.category === filters.category;

            const tDate = new Date(t.date);
            tDate.setHours(0, 0, 0, 0); // Reset time for comparison

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

    // Totals based on filtered data
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

    // Data for Charts (Filtered Period)
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
            setCurrentUser,
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
