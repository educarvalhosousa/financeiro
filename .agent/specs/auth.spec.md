# Auth & Security Specification (.spec)

## Fluxo de Identidade
O sistema utiliza **Supabase Auth** com o fluxo PKCE para máxima segurança no lado do cliente.

## Políticas RLS (Row Level Security)
A segurança é baseada em camadas:
1. **Camada Individual**: Usuários podem editar seus próprios perfis.
2. **Camada de Casa (Household)**: 
   - Transações e categorias são filtradas por `household_id`.
   - Um usuário só vê dados se `auth.uid() = user_id` OU se o `household_id` do registro for igual ao do seu perfil.
   - **IMPORTANTE**: A tabela `households` possui RLS ativado para permitir apenas `SELECT` por usuários autenticados (necessário para o processo de convite).

## Sessão e Estado
- O `FinanceContext` monitora a sessão via `onAuthStateChange`.
- **Performance**: O app prioriza o carregamento da interface (`setIsLoading(false)`) e enriquece os dados do perfil em segundo plano para evitar bloqueios.
