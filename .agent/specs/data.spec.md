# Data Specification (.spec)

## Entidades e Ciclo de Vida
O projeto evoluiu de um modelo individual para um modelo de "Casa Compartilhada" (Household).

## Modelo Relacional
1. **Households**: UUID único. É a "âncora" da conta compartilhada.
2. **Profiles**: Vinculado a `auth.users`. Contém o `household_id`.
3. **Transactions**: Cada transação DEVE pertencer a um `user_id` (quem fez) e um `household_id` (para quem aparece).
4. **Categories**: Segue o mesmo padrão de `household_id`.

## Regras de Integridade
- **Escopo**: Nenhuma query de transações deve ser feita sem filtro de `household_id` se o usuário estiver em uma casa.
- **Cascade**: Exclusão do usuário ou da casa limpa os registros órfãos.
- **Default categories**: O sistema provê 6 categorias padrão que são mescladas com as personalizadas em tempo de execução.
