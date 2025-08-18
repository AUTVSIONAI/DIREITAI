# Novas Funcionalidades - Direitai.com

## Funcionalidades Implementadas

### 1. Blog Patriota
- **Descrição**: Sistema completo de blog com artigos sobre política conservadora
- **Recursos**:
  - Listagem de posts com filtros por político, tags e busca
  - Visualização individual de posts com posts relacionados
  - Sistema de tags para categorização
  - Contagem de visualizações
  - Suporte a imagens e conteúdo rico

### 2. Diretório de Políticos da Direita
- **Descrição**: Catálogo completo de políticos conservadores brasileiros
- **Recursos**:
  - Listagem com filtros por estado, partido, cargo
  - Busca por nome
  - Perfis detalhados com biografia, posições políticas
  - Links para redes sociais e sites oficiais
  - Sistema de avaliação com estrelas (1-5)
  - Estatísticas de popularidade e distribuição de avaliações
  - Comentários dos usuários nas avaliações

### 3. Agentes IA por Político
- **Descrição**: Chatbots de IA que simulam conversas com políticos específicos
- **Recursos**:
  - Chat em tempo real com IA personalizada
  - Prompts customizados baseados no perfil do político
  - Histórico de conversas
  - Sistema de feedback dos usuários
  - Integração com OpenRouter para respostas de IA

## Estrutura do Banco de Dados

### Tabelas Criadas

#### `politicians`
- Armazena informações dos políticos (nome, partido, cargo, biografia, etc.)
- Campos para redes sociais e avaliações
- Campos para estatísticas de avaliação (average_rating, total_votes, popularity_score)
- Sistema de soft delete

#### `politician_agents`
- Configura os agentes de IA para cada político
- Prompts personalizados e configurações de IA
- Status ativo/inativo

#### `politician_posts`
- Posts do blog associados a políticos
- Sistema de tags, visualizações e status
- Suporte a conteúdo rico com imagens

#### `politician_tags`
- Tags para categorização de posts
- Cores personalizadas para cada tag

#### `agent_conversations`
- Histórico de conversas com agentes de IA
- Mensagens do usuário e respostas da IA
- Metadados da conversa

#### `user_feedback`
- Feedback dos usuários sobre agentes de IA
- Avaliações e comentários
- Prevenção de feedback duplicado

#### `politician_ratings`
- Sistema de avaliação de políticos com estrelas (1-5)
- Comentários opcionais dos usuários
- Constraint única: um usuário pode avaliar cada político apenas uma vez
- Atualização automática das estatísticas do político

### Atualizações na Tabela `users`
- Adicionado campo `role` (user, admin, journalist)
- Adicionado `journalist_request_status` para solicitações de jornalista

## APIs Implementadas

### Políticos (`/api/politicians`)
- `GET /api/politicians` - Lista políticos com filtros e estatísticas de avaliação
- `POST /api/politicians` - Cria novo político (admin)
- `GET /api/politicians/[id]` - Busca político específico
- `PUT /api/politicians/[id]` - Atualiza político (admin)
- `DELETE /api/politicians/[id]` - Remove político (admin)
- `GET /api/politicians/[id]/ratings` - Lista avaliações do político
- `POST /api/politicians/[id]/ratings` - Cria avaliação (usuário logado)
- `PUT /api/politicians/[id]/ratings` - Atualiza avaliação (usuário logado)
- `DELETE /api/politicians/[id]/ratings` - Remove avaliação (usuário logado)
- `GET /api/politicians/[id]/user-rating` - Avaliação do usuário logado

### Agentes IA (`/api/agents`)
- `GET /api/agents` - Lista agentes ativos
- `POST /api/agents` - Cria novo agente (admin)
- `POST /api/agents/[id]/chat` - Chat com agente específico

### Blog (`/api/blog`)
- `GET /api/blog` - Lista posts com filtros
- `POST /api/blog` - Cria novo post (admin/journalist)
- `GET /api/blog/[slug]` - Busca post específico
- `PUT /api/blog/[slug]` - Atualiza post (admin/journalist)
- `DELETE /api/blog/[slug]` - Remove post (admin/journalist)

### Feedback (`/api/feedback`)
- `GET /api/feedback` - Lista feedback (admin)
- `POST /api/feedback` - Cria novo feedback

## Páginas Frontend

### `/blog`
- Página principal do Blog Patriota
- Filtros por político, tags e busca
- Paginação e design responsivo

### `/blog/[slug]`
- Visualização individual de posts
- Posts relacionados
- Compartilhamento social

### `/politicos`
- Diretório de políticos
- Filtros por estado, partido, cargo
- Cards com informações resumidas e avaliações

### `/politicos/[id]`
- Perfil detalhado do político
- Sistema de avaliação com estrelas
- Lista de avaliações de outros usuários
- Estatísticas de distribuição de avaliações

### `/agente/[politicianId]`
- Chat com agente de IA do político
- Interface de conversa em tempo real
- Sistema de feedback

## Configuração Necessária

### Variáveis de Ambiente
```env
OPENROUTER_API_KEY=sua_chave_openrouter
SUPABASE_URL=sua_url_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_supabase
```

### Execução do Script SQL
1. Execute o arquivo `setup-database.sql` no Supabase
2. Isso criará todas as tabelas e configurações necessárias

## Próximos Passos

1. **Configurar OpenRouter**: Obter chave da API para os agentes de IA
2. **Popular Dados**: Adicionar políticos e criar agentes iniciais
3. **Criar Conteúdo**: Adicionar posts iniciais ao blog
4. **Testes**: Testar todas as funcionalidades
5. **Deploy**: Fazer deploy das novas funcionalidades

## Tecnologias Utilizadas

- **Backend**: Node.js, Supabase
- **Frontend**: React, TypeScript, Tailwind CSS
- **IA**: OpenRouter API
- **Banco de Dados**: PostgreSQL (Supabase)
- **Autenticação**: Supabase Auth