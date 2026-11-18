export type ChargeForCalculation = {
  energy_kwh: number;
  total_cost_brl: number;
  distance_km: number | null;
  charged_at: string;
};

export type DashboardPeriod = "month" | "year" | "all";

const BUSINESS_TIME_ZONE = "America/Fortaleza";
const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  timeZone: BUSINESS_TIME_ZONE,
});
const historicalMonthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  year: "numeric",
  timeZone: BUSINESS_TIME_ZONE,
});
const monthPartsFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "2-digit",
  timeZone: BUSINESS_TIME_ZONE,
});

export function fortalezaMonthKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = monthPartsFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return year && month ? `${year}-${month}` : null;
}

function shiftMonth(key: string, offset: number) {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthKeys(start: string, end: string) {
  const keys: string[] = [];
  for (let key = start; key <= end; key = shiftMonth(key, 1)) {
    keys.push(key);
  }
  return keys;
}

function validCostsAndEnergy(charges: ChargeForCalculation[]) {
  return charges.filter(
    (item) =>
      Number.isFinite(item.energy_kwh) &&
      item.energy_kwh > 0 &&
      Number.isFinite(item.total_cost_brl) &&
      item.total_cost_brl >= 0,
  );
}

export function averageCostPerKwh(charges: ChargeForCalculation[]) {
  const comparable = validCostsAndEnergy(charges);
  const energy = comparable.reduce((sum, item) => sum + item.energy_kwh, 0);
  if (energy <= 0) return null;
  return (
    comparable.reduce((sum, item) => sum + item.total_cost_brl, 0) / energy
  );
}

export function costPerKm(charges: ChargeForCalculation[]) {
  const comparable = charges.filter(
    (item) =>
      item.distance_km !== null &&
      Number.isFinite(item.distance_km) &&
      item.distance_km > 0 &&
      Number.isFinite(item.total_cost_brl) &&
      item.total_cost_brl >= 0,
  );
  const distance = comparable.reduce(
    (sum, item) => sum + (item.distance_km ?? 0),
    0,
  );
  if (distance <= 0) return null;
  return (
    comparable.reduce((sum, item) => sum + item.total_cost_brl, 0) / distance
  );
}

export function fuelComparison(
  charges: ChargeForCalculation[],
  gasolinePrice: number | null,
  gasolineEfficiency: number | null,
) {
  const comparable = charges.filter(
    (item) =>
      item.distance_km !== null &&
      Number.isFinite(item.distance_km) &&
      item.distance_km > 0 &&
      Number.isFinite(item.total_cost_brl) &&
      item.total_cost_brl >= 0,
  );
  const distance = comparable.reduce(
    (sum, item) => sum + (item.distance_km ?? 0),
    0,
  );
  if (
    distance <= 0 ||
    gasolinePrice === null ||
    !Number.isFinite(gasolinePrice) ||
    gasolinePrice < 0 ||
    gasolineEfficiency === null ||
    !Number.isFinite(gasolineEfficiency) ||
    gasolineEfficiency <= 0
  ) {
    return null;
  }
  const electricCost = comparable.reduce(
    (sum, item) => sum + item.total_cost_brl,
    0,
  );
  const gasolineCost = (distance / gasolineEfficiency) * gasolinePrice;
  return {
    distanceKm: distance,
    electricCost,
    gasolineCost,
    savings: gasolineCost - electricCost,
  };
}

export function monthlyTotals(
  charges: ChargeForCalculation[],
  period: DashboardPeriod = "year",
  now = new Date(),
) {
  const currentKey = fortalezaMonthKey(now);
  if (!currentKey) return [];
  const datedCharges = charges.flatMap((charge) => {
    const key = fortalezaMonthKey(charge.charged_at);
    return key && key <= currentKey ? [{ charge, key }] : [];
  });
  const firstKey =
    period === "all"
      ? datedCharges.reduce(
          (earliest, item) => (item.key < earliest ? item.key : earliest),
          currentKey,
        )
      : shiftMonth(currentKey, period === "year" ? -11 : 0);
  const months = monthKeys(firstKey, currentKey).map((key) => {
    const [year, month] = key.split("-").map(Number);
    return {
      month: (period === "all" ? historicalMonthFormatter : monthFormatter)
        .format(new Date(Date.UTC(year, month - 1, 15, 12)))
        .replace(" de ", " "),
      key,
      cost: 0,
      energy: 0,
    };
  });
  const byKey = new Map(months.map((month) => [month.key, month]));
  for (const { charge, key } of datedCharges) {
    const month = byKey.get(key);
    if (month) {
      if (Number.isFinite(charge.total_cost_brl) && charge.total_cost_brl >= 0)
        month.cost += charge.total_cost_brl;
      if (Number.isFinite(charge.energy_kwh) && charge.energy_kwh > 0)
        month.energy += charge.energy_kwh;
    }
  }
  return months;
}

export function chargesForPeriod<T extends ChargeForCalculation>(
  charges: T[],
  period: DashboardPeriod,
  now = new Date(),
) {
  const currentKey = fortalezaMonthKey(now);
  if (!currentKey) return [];
  const firstKey =
    period === "all"
      ? null
      : shiftMonth(currentKey, period === "year" ? -11 : 0);
  return charges.filter((charge) => {
    const key = fortalezaMonthKey(charge.charged_at);
    return (
      key !== null &&
      key <= currentKey &&
      (firstKey === null || key >= firstKey)
    );
  });
}
