# Link Bio Admin — Xingyu

CMS interno de banners para a Link Bio da Xingyu. A página pública lê campanhas visíveis com a chave pública do Supabase; o painel usa uma única senha administrativa, sessão assinada e operações server-side com service role.

Cliques nos banners são registrados pelo próprio sistema e apresentados de forma agregada no painel, sem fingerprint ou armazenamento de IP.

## Stack

- Next.js 16, React 19 e TypeScript
- Supabase PostgreSQL e Storage (sem Supabase Auth)
- React Hook Form, Zod, dnd-kit e bcryptjs

## Instalação

Requer Node.js 20.9 ou superior e um projeto Supabase.

```bash
npm install
cp .env.example .env.local
npm run dev
```

No Windows, crie `.env.local` manualmente a partir de `.env.example`. A aplicação fica em `http://localhost:3000`.

## Configuração do Supabase

1. Crie o projeto no Supabase.
2. Execute em ordem todos os arquivos de `supabase/migrations/` pelo SQL Editor ou com `supabase db push`.
3. Confirme que o bucket público `banners` foi criado.
4. Obtenha a URL, a anon/publishable key e a service role key nas configurações da API.

A anon key é usada somente na leitura pública. A service role permanece no servidor e só é utilizada depois da validação da sessão administrativa.

## Configuração da senha administrativa

Gere o hash em um terminal interativo. A senha fica oculta, é confirmada e não é gravada em arquivos:

```bash
npm run admin:hash
```

Copie somente a linha `ADMIN_PASSWORD_HASH=...` para `.env.local`. O hash usa bcrypt com custo 12; a senha em texto puro não é armazenada.

Gere um segredo independente, com pelo menos 32 bytes de entropia:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Use o resultado como `ADMIN_SESSION_SECRET`. Não reutilize a senha administrativa como segredo da sessão.

## `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

ADMIN_PASSWORD_HASH=
ADMIN_SESSION_SECRET=

ADMIN_PREVIEW_MODE=false
```

Nunca use prefixo `NEXT_PUBLIC_` em `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD_HASH` ou `ADMIN_SESSION_SECRET`. `.env.local` é ignorado pelo Git.

## Autenticação e sessão

`/login` envia apenas a senha para uma Server Action. O servidor compara a senha com `ADMIN_PASSWORD_HASH` usando bcrypt. Quando válida, cria o cookie `xingyu_admin_session`, contendo somente um payload de versão e expiração assinado com HMAC SHA-256.

O cookie é `HttpOnly`, `SameSite=Lax`, `Path=/`, possui validade de 7 dias e recebe `Secure` em produção. O proxy verifica assinatura, versão e expiração em toda navegação para `/admin`; as Server Actions repetem a validação antes de usar a service role. Configuração ausente ou cookie inválido falham fechados.

O botão **Sair** invalida o cookie e redireciona para `/login`. O parâmetro `next` aceita somente caminhos internos iniciados por `/admin`.

Há um limite em memória de 8 tentativas por IP a cada 10 minutos. Em uma VPS com múltiplos processos, configure também rate limiting no Nginx para `/login`, por exemplo com `limit_req_zone` e `limit_req`. A camada de proxy deve encaminhar corretamente `X-Forwarded-For` e sobrescrever cabeçalhos recebidos diretamente do cliente.

## Preview local

Para visualizar o painel sem serviços reais:

```env
ADMIN_PREVIEW_MODE=true
```

O bypass só funciona quando `NODE_ENV=development`. Em produção, mesmo com a variável igual a `true`, a sessão continua obrigatória. Quando a service role não está configurada, `/admin`, `/admin/banners` e `/admin/programacoes` usam os mesmos banners demonstrativos locais; eles nunca aparecem na página pública nem são persistidos.

## Produção na VPS

Configure as variáveis no ambiente do processo, nunca no repositório:

```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_PASSWORD_HASH=
ADMIN_SESSION_SECRET=
ADMIN_PREVIEW_MODE=false
```

Depois, execute migrations, instale dependências, gere o build e reinicie o processo:

```bash
npm ci
npm run build
npm start
```

Use HTTPS no Nginx, encaminhe `Host`, `X-Real-IP` e `X-Forwarded-For`, e aplique limite de requisições em `/login`. Se `ADMIN_PASSWORD_HASH` ou `ADMIN_SESSION_SECRET` estiver ausente, o painel não será liberado. Se `SUPABASE_SERVICE_ROLE_KEY` estiver ausente, operações administrativas não serão executadas.

## Arquitetura

- `src/lib/admin-session.ts`: token HMAC compatível com Proxy/Web Crypto
- `src/lib/admin-auth.ts`: leitura, criação, exigência e remoção da sessão no servidor
- `src/lib/supabase/public.ts`: cliente anônimo para a Link Bio pública
- `src/lib/supabase/admin.ts`: cliente service role exclusivo do servidor
- `src/app/login/actions.ts`: comparação bcrypt e rate limit de login
- `src/app/admin/actions.ts`: mutações protegidas e uploads server-side
- `src/app/r/[id]/route.ts`: redirecionamento transparente e registro de clique
- `src/lib/banner-queries.ts`: consultas públicas e administrativas separadas
- `src/lib/click-metrics.ts`: métricas agregadas e contagem por banner
- `supabase/migrations`: schema, RLS, Storage e RPC de reordenação

## Métricas de clique

Banners com destino apontam para `/r/[id]`. A rota consulta o destino no banco, valida se o banner está público, registra data/hora e redireciona. A URL externa nunca é aceita pela requisição. Se somente a inserção da métrica falhar, o visitante ainda é redirecionado.

A migration de métricas cria `banner_clicks` com `banner_id`, `clicked_at`, `referrer` e `user_agent`, além de índices por banner, data e banner+data. A tabela tem RLS habilitada e não permite leitura ou escrita para `anon` ou `authenticated`.

O dashboard consulta uma RPC server-side que calcula hoje no fuso `America/Sao_Paulo`, períodos móveis de 7 e 30 dias, total histórico, série diária e Top 5. Gráfico e ranking podem ser alternados entre 7, 30 e 90 dias sem enviar os eventos individuais ao navegador. Banners excluídos logicamente continuam no histórico; duplicações começam sem cliques.

## Verificação

```bash
npm run lint
npm run typecheck
npm run build
```

Rotas: `/`, `/login`, `/admin`, `/admin/banners`, `/admin/banners/novo`, `/admin/banners/[id]`, `/admin/programacoes` e `/admin/configuracoes`.
