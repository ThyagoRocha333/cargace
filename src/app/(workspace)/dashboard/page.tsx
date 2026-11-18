import Link from "next/link";
import {
  BatteryCharging,
  CarFront,
  ChartNoAxesCombined,
  CircleDollarSign,
  MapPin,
  Zap,
} from "lucide-react";
import { DashboardCharts } from "@/components/dashboard-charts";
import {
  averageCostPerKwh,
  costPerKm,
  fuelComparison,
  monthlyTotals,
  type ChargeForCalculation,
} from "@/lib/finance";
import { createClient } from "@/lib/supabase/server";

type RawCharge = ChargeForCalculation & {
  id: string;
  charging_type: "home" | "public";
  location_name: string | null;
};

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const quantity = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function periodStart(period: string) {
  const date = new Date();
  if (period === "year") date.setMonth(date.getMonth() - 11, 1);
  else if (period === "all") return null;
  else date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: requestedPeriod } = await searchParams;
  const period = ["month", "year", "all"].includes(requestedPeriod ?? "")
    ? requestedPeriod!
    : "month";
  const supabase = await createClient();
  const start = periodStart(period);
  const [chargesResult, settingsResult] = await Promise.all([
    fetchAllCharges(supabase),
    supabase
      .from("fuel_comparison_settings")
      .select("gasoline_price_brl_liter, gasoline_efficiency_km_liter")
      .maybeSingle(),
  ]);
  if (chargesResult.error || settingsResult.error) {
    return (
      <div className="alert alert-error" role="alert">
        Não foi possível carregar seus indicadores. Atualize a página ou tente
        novamente mais tarde.
      </div>
    );
  }

  const allCharges = (chargesResult.data ?? []).map((row) => ({
    ...row,
    energy_kwh: Number(row.energy_kwh),
    total_cost_brl: Number(row.total_cost_brl),
    distance_km: row.distance_km === null ? null : Number(row.distance_km),
  })) as RawCharge[];
  const charges = start
    ? allCharges.filter((charge) => charge.charged_at >= start)
    : allCharges;
  const spend = charges.length
    ? charges.reduce((sum, item) => sum + item.total_cost_brl, 0)
    : null;
  const energy = charges.length
    ? charges.reduce((sum, item) => sum + item.energy_kwh, 0)
    : null;
  const costPerKwh = averageCostPerKwh(charges);
  const kilometerCost = costPerKm(charges);
  const settings = settingsResult.data;
  const comparison = fuelComparison(
    charges,
    settings?.gasoline_price_brl_liter === undefined
      ? null
      : Number(settings.gasoline_price_brl_liter),
    settings?.gasoline_efficiency_km_liter === undefined
      ? null
      : Number(settings.gasoline_efficiency_km_liter),
  );
  const chartData = monthlyTotals(allCharges as ChargeForCalculation[]);
  const recent = charges.slice(0, 5);
  const periodLabel =
    period === "month"
      ? "neste mês"
      : period === "year"
        ? "últimos 12 meses"
        : "todo o período";

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SEU PAINEL</p>
          <h1>Visão geral</h1>
          <p>
            Indicadores calculados a partir dos seus registros {periodLabel}.
          </p>
        </div>
        <div className="page-actions">
          <form action="/dashboard" method="get">
            <label className="sr-only" htmlFor="period">
              Período
            </label>
            <select
              className="select-control"
              id="period"
              name="period"
              defaultValue={period}
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
            >
              <option value="month">Este mês</option>
              <option value="year">Últimos 12 meses</option>
              <option value="all">Todo o período</option>
            </select>
          </form>
          <Link className="button button-primary" href="/recargas/nova">
            <Zap size={15} /> Registrar recarga
          </Link>
        </div>
      </div>

      <section className="metric-grid" aria-label="Indicadores do período">
        <Metric
          icon={<CircleDollarSign size={16} />}
          label="Gasto total"
          value={spend === null ? "—" : brl.format(spend)}
          note={
            spend === null
              ? "Sem recargas neste período"
              : `Total ${periodLabel}`
          }
        />
        <Metric
          icon={<BatteryCharging size={16} />}
          label="Energia registrada"
          value={energy === null ? "—" : `${quantity.format(energy)} kWh`}
          note={
            energy === null
              ? "Sem dados de energia"
              : "Soma da energia carregada"
          }
        />
        <Metric
          icon={<Zap size={16} />}
          label="Custo médio por kWh"
          value={costPerKwh === null ? "—" : `${brl.format(costPerKwh)}/kWh`}
          note={
            costPerKwh === null
              ? "Dados insuficientes"
              : "Valor pago ÷ energia registrada"
          }
        />
        <Metric
          icon={<ChartNoAxesCombined size={16} />}
          label="Custo por km"
          value={
            kilometerCost === null ? "—" : `${brl.format(kilometerCost)}/km`
          }
          note={
            kilometerCost === null
              ? "Informe distância confiável"
              : "Somente recargas com distância informada"
          }
        />
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Gastos com recargas</h2>
              <p>Valores registrados por mês (BRL)</p>
            </div>
            <CircleDollarSign size={16} color="#16a34a" />
          </div>
          <DashboardCharts data={chartData} variant="cost" />
        </article>
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Consumo de energia</h2>
              <p>Energia registrada por mês (kWh)</p>
            </div>
            <Zap size={16} color="#3b82f6" />
          </div>
          <DashboardCharts data={chartData} variant="energy" />
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Comparação com gasolina</h2>
              <p>Estimativa baseada nas suas premissas configuradas</p>
            </div>
            <CarFront size={16} color="#16a34a" />
          </div>
          {comparison ? (
            <div className="comparison-grid">
              <div>
                <span>Distância comparável</span>
                <strong>{quantity.format(comparison.distanceKm)} km</strong>
              </div>
              <div>
                <span>Gasto elétrico associado</span>
                <strong>{brl.format(comparison.electricCost)}</strong>
              </div>
              <div>
                <span>Estimativa gasolina</span>
                <strong>{brl.format(comparison.gasolineCost)}</strong>
              </div>
              <div>
                <span>Economia estimada</span>
                <strong
                  className={comparison.savings >= 0 ? "positive" : "negative"}
                >
                  {brl.format(comparison.savings)}
                </strong>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              Dados insuficientes. Informe distância em recargas e configure
              preço e consumo de referência da gasolina.
              <br />
              <Link href="/configuracoes">Configurar comparação</Link>
            </div>
          )}
          <p className="form-note">
            Estimativa informativa; depende dos registros com distância e das
            premissas salvas em Configurações. Não representa economia
            garantida.
          </p>
        </article>
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Recargas recentes</h2>
              <p>Últimos registros deste período</p>
            </div>
            <Link className="text-link" href="/recargas">
              Ver todas
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="empty-state">
              <div>
                <span className="empty-icon">
                  <BatteryCharging size={19} />
                </span>
                <strong>Seu histórico começa aqui</strong>
                <p>Registre uma recarga para acompanhar sua energia.</p>
                <Link href="/recargas/nova">Registrar primeira recarga</Link>
              </div>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Local</th>
                    <th>Energia</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((charge) => (
                    <tr key={charge.id}>
                      <td>{dateFormat.format(new Date(charge.charged_at))}</td>
                      <td>
                        {charge.location_name ??
                          (charge.charging_type === "home"
                            ? "Residencial"
                            : "Pública")}
                      </td>
                      <td>{quantity.format(charge.energy_kwh)} kWh</td>
                      <td>{brl.format(charge.total_cost_brl)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
      <p className="data-source-note">
        <MapPin size={12} /> Seus dados são privados e calculados com base nos
        registros desta conta.
      </p>
    </>
  );
}

async function fetchAllCharges(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const rows: {
    id: string;
    charged_at: string;
    energy_kwh: number | string;
    total_cost_brl: number | string;
    distance_km: number | string | null;
    charging_type: "home" | "public";
    location_name: string | null;
  }[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("charging_sessions")
      .select(
        "id, charged_at, energy_kwh, total_cost_brl, distance_km, charging_type, location_name",
      )
      .order("charged_at", { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (error) return { data: null, error };
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return { data: rows, error: null };
}

function Metric({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="metric-card">
      <div className="metric-top">
        <span>{label}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <p className="metric-value">{value}</p>
      <span className="metric-note">{note}</span>
    </article>
  );
}
