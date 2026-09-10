# Link Bio Admin — Xingyu

CMS de banners para a Link Bio da Xingyu. A página pública lê apenas campanhas habilitadas e dentro da janela de publicação; o painel autenticado permite criar, editar, duplicar, ocultar, programar, excluir logicamente e reordenar banners.

## Stack

- Next.js 16 (App Router), React 19 e TypeScript
- Supabase Auth, PostgreSQL e Storage
- React Hook Form + Zod, dnd-kit e Lucide

## Instalação

Requer Node.js 20.9 ou superior e um projeto no Supabase.

```bash
npm install
cp .env.example .env.local
npm run dev
```

No Windows, crie `.env.local` manualmente a partir de `.env.example`. A aplicação fica em `http://localhost:3000`.

## Supabase

1. Crie um projeto no Supabase.
2. Execute `supabase/migrations/20260910000000_create_banners.sql` no SQL Editor, ou use `supabase db push` com o CLI vinculado.
3. Confirme o bucket público `banners`. Upload, alteração e exclusão são restritos a usuários autenticados.
4. Copie a URL do projeto e a anon/publishable key para `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
```

Não é utilizada service role key.

## Primeiro administrador

No Dashboard do Supabase, abra **Authentication > Users > Add user** e crie manualmente o usuário com e-mail e senha. Não há cadastro público. Toda conta Auth criada administrativamente tem acesso ao painel nesta V1; uma tabela explícita de papéis pode ser adicionada quando houver outros tipos de usuário.

## Arquitetura

- `src/app/page.tsx`: Link Bio pública dinâmica
- `src/app/login`: acesso administrativo
- `src/app/admin`: dashboard e rotas protegidas
- `src/app/admin/actions.ts`: mutações validadas no servidor
- `src/components`: formulário e lista reutilizáveis
- `src/lib/supabase`: clientes e renovação de sessão
- `src/lib/banners.ts`: queries e regra central de status
- `supabase/migrations`: schema, índices, RLS e Storage

Datas do painel são interpretadas em `America/Sao_Paulo` e gravadas como `TIMESTAMPTZ`. A página pública usa renderização dinâmica para respeitar campanhas programadas.

## Assets

O repositório recebido não continha o logo original nem banners finais. Substitua o componente provisório `src/components/brand-mark.tsx` pelo asset oficial quando ele for fornecido, preferencialmente em `public/brand/`. As artes são enviadas completas pelo painel e nunca reconstruídas em HTML.

## Verificação

```bash
npm run lint
npm run typecheck
npm run build
```

Teste criando o admin, entrando em `/login`, enviando dois banners, alterando a ordem, ocultando/reativando e criando janelas futura e encerrada. Confira `/` após cada alteração.

## Deploy na Vercel

Importe o repositório na Vercel, configure as duas variáveis em **Project Settings > Environment Variables** e publique. Adicione a URL de produção nas URLs permitidas do Supabase Auth.

## V2

Configuração institucional pelo painel, papéis granulares, recuperação de senha, analytics/UTM, histórico de versões e limpeza automática de arquivos órfãos.
