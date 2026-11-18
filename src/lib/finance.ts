export type ChargeForCalculation = {
  energy_kwh: number;
  total_cost_brl: number;
  distance_km: number | null;
  charged_at: string;
};

export function averageCostPerKwh(charges: ChargeForCalculation[]) {
  const energy = charges.reduce((sum, item) => sum + item.energy_kwh, 0);
  if (energy <= 0) return null;
  return charges.reduce((sum, item) => sum + item.total_cost_brl, 0) / energy;
}

export function costPerKm(charges: ChargeForCalculation[]) {
  const comparable = charges.filter(
    (item) => item.distance_km !== null && item.distance_km > 0,
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
    (item) => item.distance_km !== null && item.distance_km > 0,
  );
  const distance = comparable.reduce(
    (sum, item) => sum + (item.distance_km ?? 0),
    0,
  );
  if (
    distance <= 0 ||
    gasolinePrice === null ||
    gasolinePrice < 0 ||
    gasolineEfficiency === null ||
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
  numberOfMonths = 6,
) {
  const months = Array.from({ length: numberOfMonths }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (numberOfMonths - index - 1));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return {
      month: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date),
      key,
      cost: 0,
      energy: 0,
    };
  });
  const byKey = new Map(months.map((month) => [month.key, month]));
  for (const charge of charges) {
    const month = byKey.get(charge.charged_at.slice(0, 7));
    if (month) {
      month.cost += charge.total_cost_brl;
      month.energy += charge.energy_kwh;
    }
  }
  return months;
}
