# Regras de negócio e cálculos

- Energia é medida em **kWh**; potência de conector é **kW**.
- Energia carregada precisa ser maior que zero. Valores de custo e distância não podem ser negativos.
- Dados opcionais ausentes são `NULL`, não zero.
- Recarga residencial pode calcular `energia × tarifa residencial` ao solicitar explicitamente “Usar tarifa cadastrada”; o valor continua editável.
- Custo médio por kWh = soma de custos pagos ÷ soma dos kWh. Sem kWh, exibe dados insuficientes.
- Custo por km = soma do custo das recargas com distância conhecida e positiva ÷ soma dessas distâncias. Registros sem distância são excluídos.
- Estimativa gasolina = distância comparável ÷ km/l de referência × preço BRL/litro.
- Economia estimada = custo estimado gasolina − custo elétrico associado às mesmas recargas/distâncias.
- Sem distância, preço ou eficiência válida, a comparação não é calculada.
- Custos de eletricidade, estimativa de combustível e gráficos consideram o período selecionado no dashboard. O histórico completo abrange as recargas desde o primeiro mês registrado.
- Data/hora é armazenada como `timestamptz`, normalizada pelo cliente para UTC. Os períodos mensais, gráficos e datas do histórico usam `America/Fortaleza`; a apresentação usa locale `pt-BR`.

## Dados externos

Open Charge Map é a fonte dos pontos do mapa. O horário de consulta e o timestamp da estação (quando reportado) são mostrados separadamente. Informações ausentes aparecem como “Não informado”; status e preços reportados podem estar desatualizados. CargaCE não declara disponibilidade em tempo real.
