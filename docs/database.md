# Banco de dados

Migration inicial: `supabase/migrations/202611180001_initial_schema.sql`.

## Entidades

- `profiles`: extensão privada de `auth.users`; trigger cria o perfil no cadastro.
- `vehicles`: fabricante/modelo/ano, capacidade de bateria em kWh, consumo estimado em kWh/100 km e conector.
- `home_energy_tariffs`: uma tarifa residencial atual por usuário, em R$/kWh.
- `fuel_comparison_settings`: preço de referência em R$/litro e consumo do veículo de referência em km/l.
- `charging_sessions`: veículo, instante da recarga, origem residencial/pública, local/ID opcional da estação, energia em kWh, custo em BRL, distância opcional em km e observações.

`user_id` referencia `auth.users`. Cada tabela privada habilita RLS com políticas SELECT/INSERT/UPDATE/DELETE próprias. Sessões também validam que o veículo pertence ao mesmo usuário. A FK composta impede associar um registro a veículo alheio; a exclusão de veículo referenciado é restringida para não apagar histórico inadvertidamente.

Índices cobrem `vehicles(user_id, created_at)` e `charging_sessions(user_id, charged_at)`. Timestamps são `timestamptz`; valores são `numeric` com constraints para evitar energia não positiva, custo negativo, dados fora de limites e enumeração de origem inválida. Triggers mantêm `updated_at`.

## Aplicação

1. Faça backup do banco se já houver dados.
2. Aplique a migration pelo SQL Editor Supabase ou Supabase CLI.
3. Confirme no painel que RLS está habilitada e as políticas foram criadas.
4. Teste o isolamento com duas contas e nunca use a chave `service_role` no cliente.

## Notas

A migration é idempotente para tabelas, índices, funções, triggers e policies recriadas com seus nomes. A constraint de FK depende da chave composta de `vehicles`. Alterações futuras devem entrar em novas migrations versionadas, sem editar migration aplicada em produção.
