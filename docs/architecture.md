# Arquitetura

## Visão geral

O CargaCE é um monólito Next.js App Router. Server Components consultam o Supabase com sessão/cookies; Client Components ficam restritos a formulários interativos, gráficos e Leaflet. Route Handlers centralizam validação e operações de escrita.

```text
Browser
  ├─ páginas públicas e formulários autenticados
  ├─ Route Handlers /api/vehicles, /api/charges, /api/settings
  └─ /api/charging-stations
       ├─ Supabase SSR client (JWT/cookies) ── PostgreSQL + RLS
       └─ chave privada do servidor ── Open Charge Map
```

## Organização

- `src/app/(auth)`: login, cadastro e recuperação.
- `src/app/(workspace)`: telas privadas, protegidas por autenticação em layout.
- `src/app/api`: endpoints com verificação de usuário e validação Zod.
- `src/lib/supabase`: cliente browser e servidor `@supabase/ssr`.
- `src/lib/finance.ts`: funções puras com cálculos financeiros.
- `src/lib/validation.ts`: schemas usados no servidor e nos formulários.
- `src/components`: componentes específicos e shadcn/ui.
- `proxy.ts`: renova sessão Supabase antes de processar rotas.

O cliente browser usa somente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`. A autorização real é aplicada pelo JWT e políticas RLS; não há chave `service_role`.

## Integração de estações

`GET /api/charging-stations` chama Open Charge Map com `OPEN_CHARGE_MAP_API_KEY` no servidor. A resposta é reduzida aos campos usados pelo mapa; cache de 300 segundos, raio de 35 km, máximo de 100 pontos. A origem, horário de consulta e limitações acompanham a resposta. Erros de configuração e origem são expostos como respostas explícitas.

Leaflet carrega somente no cliente. O mapa começa no centro de Fortaleza, sem solicitar ou presumir a geolocalização do visitante. Tiles usam OpenStreetMap com atribuição.

## PWA e privacidade

O service worker fornece uma tela offline informativa e não intercepta APIs/autenticação nem mantém dados privados em cache. Cadastro e sincronização offline não são suportados.

## Decisões e limitações

- Sem camada service-role no backend: reduz privilégios e preserva RLS.
- Route Handlers verificam sessão, validam payloads Zod e deixam constraints do PostgreSQL proteger a integridade.
- Comparações de combustível usam premissas informadas pelo usuário, não cotação de preço externo.
- Exclusão de veículo com recargas relacionadas é restringida pelo banco para preservar o histórico.
- O pipeline CI valida lint, TypeScript, testes e build sem depender de credenciais reais.
