# Architecture Specification (.spec)

## DNA do Sistema
O **FinanSe Pro** é um organismo vivo baseado em **Next.js 15+** e **Supabase**. Sua estrutura é modular e client-centric, projetada para escalabilidade e performance imediata.

## Stack Tecnológica
- **Núcleo**: Next.js (App Router)
- **Estado Global**: React Context API (`FinanceContext`)
- **Backend/DB**: Supabase PostgreSQL
- **Estilo**: CSS Vanilla (Variables + Glassmorphism)
- **Visualização**: Recharts

## Padrões de Código
- **Componentes**: Devem ser funcionais e focar em "Single Responsibility".
- **Estado**: Transações e Categorias são centralizadas no `FinanceContext`. Não usar estados locais para dados que afetam o Dashboard.
- **Async**: Sempre usar blocos `try/catch/finally` em queries do Supabase para evitar "Loading Stunlock".
