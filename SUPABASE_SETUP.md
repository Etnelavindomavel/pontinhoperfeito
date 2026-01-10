# Setup do Supabase - Ponto Perfeito

## PARTE 1: Criar Conta e Projeto Supabase

1. Acesse: https://supabase.com
2. Clique "Start your project"
3. Sign in com GitHub ou email
4. Clique "New Project"
5. Preencha:
   - **Name**: ponto-perfeito
   - **Database Password**: [gere uma senha forte e GUARDE]
   - **Region**: South America (São Paulo)
6. Clique "Create new project"
7. Aguarde 2-3 minutos (setup do banco)

## PARTE 2: Configurar Tabelas no Supabase

Após projeto criado:

1. No menu lateral, clique **"SQL Editor"**
2. Clique **"New query"**
3. Abra o arquivo `supabase-setup.sql` deste projeto
4. Cole todo o conteúdo SQL no editor
5. Clique **"Run"** (ou F5)
6. Verifique se apareceu **"Success. No rows returned"**

## PARTE 3: Obter Credenciais do Supabase

1. No menu lateral, clique **"Project Settings"** (ícone de engrenagem)
2. Clique **"API"**
3. Copie e guarde:
   - **Project URL** (algo como: `https://xxxxx.supabase.co`)
   - **anon public key** (chave longa começando com `eyJ...`)

## PARTE 4: Configurar Variáveis de Ambiente

1. Na raiz do projeto, crie o arquivo `.env.local`
2. Adicione:

```env
VITE_SUPABASE_URL=sua_project_url_aqui
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

**IMPORTANTE**: Substitua pelos valores reais copiados no passo anterior!

3. Reinicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## PARTE 5: Testar Integração

1. Limpe o localStorage do navegador
2. Acesse `/register`
3. Crie uma conta nova
4. Verifique no Supabase:
   - **Table Editor** → `users` → ver registro criado
   - **Table Editor** → `auth.users` → ver usuário de autenticação
5. Faça logout
6. Faça login novamente
7. Deve funcionar com Supabase!

## Estrutura do Banco de Dados

### Tabelas Criadas:

- **users**: Perfis de usuários (extende auth.users)
- **uploads**: Histórico de uploads de arquivos
- **raw_data**: Dados brutos das transações (JSONB)
- **reports**: Relatórios PDF gerados
- **user_preferences**: Preferências do usuário

### Segurança (RLS):

- Row Level Security habilitado em todas as tabelas
- Usuários só podem ver/editar seus próprios dados
- Políticas configuradas automaticamente

### Triggers:

- **handle_new_user**: Cria perfil automaticamente após signup
- **handle_updated_at**: Atualiza `updated_at` automaticamente

## Troubleshooting

### Erro: "Supabase não configurado"
- Verifique se `.env.local` existe
- Verifique se as variáveis estão corretas
- Reinicie o servidor após criar/editar `.env.local`

### Erro: "Invalid login credentials"
- Verifique se o email está correto
- Verifique se a senha está correta
- Tente criar uma nova conta

### Erro ao executar SQL
- Verifique se está no SQL Editor correto
- Execute o script em partes se necessário
- Verifique se as extensões estão habilitadas

## Próximos Passos

Após configurar o Supabase:
1. Teste cadastro e login
2. Teste upload de arquivo
3. Verifique dados salvos no Supabase
4. Teste logout e login novamente
5. Migre funcionalidades restantes conforme necessário
