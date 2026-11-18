# CargaCE

Aplicação web full-stack para proprietários de veículos elétricos em Fortaleza, Ceará. O CargaCE organiza recargas, calcula custos a partir dos dados informados pelo usuário e consulta eletropostos reportados pela Open Charge Map.

> **Estado do projeto:** MVP implementado e preparado para configuração. Autenticação, persistência e consulta ao mapa dependem das credenciais do Supabase e Open Charge Map; nenhum dado ou ponto de recarga é fabricado. Ainda não há URL de produção.

## Problema e público

Motoristas de veículos elétricos precisam reunir gastos de recarga, consumo e opções de carregamento em fontes separadas. O CargaCE é voltado a proprietários que desejam acompanhar seus próprios custos e consultar estações públicas em Fortaleza.

## Funcionalidades

- Cadastro, login, logout e recuperação de acesso por Supabase Auth.
- Cadastro e edição de veículos.
- Registro, edição e exclusão de recargas residenciais e públicas.
- Tarifa residencial e premissas para comparação com gasolina.
- Dashboard com gastos, kWh, custo por kWh, custo por km, comparação estimada e gráficos.
- Mapa navegável com pontos consultados no servidor via Open Charge Map, filtros e link de navegação.
- Interface responsiva em português brasileiro e PWA instalável.
- Postgres com RLS para isolar os dados de cada usuário.

Valores e estimativas dependem dos registros do usuário. Custo por quilômetro usa apenas recargas com distância positiva informada. A comparação com gasolina é uma estimativa com premissas editáveis; não é uma promessa de economia.

## Tecnologias

Next.js App Router, React, TypeScript strict, Tailwind CSS 4, shadcn/ui, Lucide React, React Hook Form, Zod, Recharts, Leaflet/React Leaflet, Supabase Auth/PostgreSQL, Open Charge Map, Vitest e GitHub Actions.

## Arquitetura

- `src/app`: páginas, layouts e Route Handlers.
- `src/components`: componentes por funcionalidade e componentes shadcn/ui.
- `src/lib`: validação, cálculos e clientes Supabase de navegador/servidor.
- `supabase/migrations`: schema PostgreSQL, constraints, índices, triggers e políticas RLS.
- `public`: manifesto, ícone, service worker e assets.

O acesso ao banco ocorre com a chave pública Supabase e sessão do usuário; as políticas RLS são a barreira final de isolamento. A chave `service_role` não é usada. Consulte [docs/architecture.md](./docs/architecture.md).

## Requisitos

- Node.js 22 LTS (ou versão compatível com Next.js 16) e npm.
- Projeto Supabase.
- Chave Open Charge Map para habilitar o mapa.

## Instalação local

```bash
git clone https://github.com/ThyagoRocha333/cargace.git
cd cargace
npm ci
cp .env.example .env.local
```

Edite `.env.local` com as credenciais do seu projeto (não as compartilhe nem as versione):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICAVEL_SUPABASE
OPEN_CHARGE_MAP_API_KEY=SUA_CHAVE_OCM
```

O valor público do Supabase é projetado para uso no navegador; a segurança dos registros vem da autenticação e RLS. A chave Open Charge Map só é lida pelo servidor. Nunca adicione `service_role` ao ambiente público.

## Banco de dados e autenticação

1. Abra o SQL Editor do seu projeto Supabase e aplique `supabase/migrations/202611180001_initial_schema.sql`, ou configure o Supabase CLI e execute `supabase db push`.
2. Em **Authentication → URL Configuration**, configure a URL local `http://localhost:3000` e o callback `http://localhost:3000/auth/callback`. Para produção, adicione o domínio de produção.
3. Configure o provedor de e-mail/SMTP e as regras de confirmação desejadas no Supabase Auth. O cadastro mostra instruções para confirmar o e-mail quando a confirmação estiver ativada.
4. Copie a URL do projeto e a chave publicável/anon para `.env.local`.

Detalhes: [docs/database.md](./docs/database.md).

## Executar e validar

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

Abra `http://localhost:3000`. Sem credenciais Supabase, telas privadas e persistência não estarão disponíveis; sem a chave OCM, o mapa informa explicitamente a indisponibilidade da integração.

## Screenshots

As capturas de tela reais ainda não foram registradas neste repositório. Esta seção será atualizada com imagens da aplicação executando em desktop e dispositivos móveis após a validação visual.

## Open Charge Map e atribuição

A consulta ocorre em `/api/charging-stations`, no servidor, em um raio de 35 km do centro de Fortaleza, limitada a 100 estações e com cache de 5 minutos. A chave deve ser obtida no [portal Open Charge Map](https://openchargemap.org/site/develop/api) e configurada como `OPEN_CHARGE_MAP_API_KEY`.

Os pontos são dados colaborativos externos: preço, estado operacional e última atualização podem estar ausentes ou desatualizados e não indicam disponibilidade em tempo real. A interface informa a fonte e o horário da consulta. Os tiles do mapa são do OpenStreetMap, com atribuição na interface e uso direto do servidor público; para tráfego elevado, configure um provedor de tiles apropriado e respeite a [política de uso de tiles](https://operations.osmfoundation.org/policies/tiles/).

## PWA

O manifesto e ícone estão em `public/manifest.webmanifest` e `public/icons/icon.svg`. O service worker mantém apenas a página offline informativa; não armazena respostas de API, telas privadas ou dados pessoais. Criar/editar registros requer conexão.

## Deploy

1. Publique o código no GitHub depois de revisar o repositório e os arquivos a enviar.
2. Conecte o repositório à Vercel.
3. Configure as três variáveis listadas acima no ambiente correto da Vercel.
4. Configure os domínios de autenticação/callback no Supabase e aplique a migration no banco de produção.
5. Execute o deploy e valide cadastro, confirmação, CRUD, RLS com usuários distintos, integração OCM e instalação PWA.

Não há publicação GitHub/Vercel nem credenciais Supabase/OCM configuradas nesta cópia. Portanto, nenhuma URL de produção ou integração real está sendo afirmada.

## Documentação

- [Arquitetura](./docs/architecture.md)
- [Banco de dados](./docs/database.md)
- [Regras de negócio](./docs/business-rules.md)
- [Roadmap](./docs/roadmap.md)

## Roadmap

Veja [docs/roadmap.md](./docs/roadmap.md). Próximos passos dependem de credenciais, validação com usuários e autorização para publicação.
