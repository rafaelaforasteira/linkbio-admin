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

### Preview local do Admin

Enquanto o Supabase ainda não estiver configurado, o painel pode ser visualizado localmente adicionando ao `.env.local`:

```env
ADMIN_PREVIEW_MODE=true
```

Reinicie `npm run dev` depois de alterar a variável. Esse modo libera `/admin` e suas subrotas somente quando `NODE_ENV=development`. Para desativá-lo, use `ADMIN_PREVIEW_MODE=false` ou remova a variável. Mesmo que seja definida como `true` em produção, o bypass permanece desativado.

## Supabase

1. Crie um projeto no Supabase.
2. Execute, em ordem, todos os arquivos de `supabase/migrations/` no SQL Editor, ou use `supabase db push` com o CLI vinculado. A segunda migration adiciona a reordenação atômica dos banners.
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
- `src/lib/banners.ts`: status, datas e validação de redirecionamento interno
- `src/lib/banner-queries.ts`: consultas públicas e administrativas
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

Rotas disponíveis: `/`, `/login`, `/admin`, `/admin/banners`, `/admin/banners/novo`, `/admin/banners/[id]`, `/admin/programacoes` e `/admin/configuracoes`.

Sem as variáveis do Supabase, `/admin` falha fechado e volta para `/login`; a tela informa que a configuração está pendente. O parâmetro `next` só aceita caminhos internos iniciados por `/admin`.

## Deploy na Vercel

Importe o repositório na Vercel, configure as duas variáveis em **Project Settings > Environment Variables** e publique. Adicione a URL de produção nas URLs permitidas do Supabase Auth.

## V2

Configuração institucional pelo painel, papéis granulares, recuperação de senha, analytics/UTM, histórico de versões e limpeza automática de arquivos órfãos.
