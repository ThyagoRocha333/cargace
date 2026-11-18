# Roadmap

## MVP implementado

- Landing page em português, autenticação Supabase e rotas privadas.
- Cadastro/edição/exclusão de veículos e recargas com validação.
- Configuração de tarifa e premissas de gasolina.
- Dashboard com métricas calculadas dos registros e comparação auditável.
- Mapa Leaflet com consulta backend à Open Charge Map, filtros, origem, cache e link de navegação.
- Postgres/RLS, manifesto PWA, página offline informativa, testes focados e CI.

## Antes da publicação

- Configurar projeto/credenciais Supabase e SMTP, aplicar migration e validar e-mail/callback.
- Obter chave Open Charge Map e testar a cota/uso permitido.
- Criar projeto Vercel, configurar variáveis e domínios, validar deploy e RLS em produção.
- Executar teste de ponta a ponta de autenticação com ambiente Supabase de teste.
- Adicionar ícones raster dedicados e validar instalação em dispositivos-alvo, se exigido pela loja/navegador.

## Evoluções possíveis

- Testes end-to-end completos com ambiente de staging e testes de isolamento RLS automatizados.
- Registrar snapshots de tarifa por recarga e importação de dados, mediante consentimento.
- Preferências de unidade/moeda e comparação por veículo/período.
- Paginação para históricos extensos e cache/telemetria de fontes externas.
- Avaliar provedor de mapas/tiles dedicado caso o tráfego deixe de ser compatível com a política pública do OpenStreetMap.

Não são escopo do MVP: rastreamento em tempo real, disponibilidade garantida, pagamento, preços automáticos de combustível, sincronização offline e catálogo automático de veículos.
