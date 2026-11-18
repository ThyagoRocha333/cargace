import { NextResponse } from "next/server";
import { authenticatedClient, requestJson } from "@/lib/api-auth";
import { settingsSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const context = await authenticatedClient();
  if ("response" in context) return context.response;
  const [tariff, comparison] = await Promise.all([
    context.supabase
      .from("home_energy_tariffs")
      .select("price_brl_kwh")
      .maybeSingle(),
    context.supabase
      .from("fuel_comparison_settings")
      .select("gasoline_price_brl_liter, gasoline_efficiency_km_liter")
      .maybeSingle(),
  ]);
  if (tariff.error || comparison.error)
    return NextResponse.json(
      { error: "Não foi possível carregar as configurações." },
      { status: 500 },
    );
  return NextResponse.json(
    {
      home_tariff_brl_kwh: tariff.data?.price_brl_kwh ?? null,
      gasoline_price_brl_liter:
        comparison.data?.gasoline_price_brl_liter ?? null,
      gasoline_efficiency_km_liter:
        comparison.data?.gasoline_efficiency_km_liter ?? null,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function PUT(request: Request) {
  const context = await authenticatedClient();
  if ("response" in context) return context.response;
  const parsed = settingsSchema.safeParse(await requestJson(request));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  const {
    home_tariff_brl_kwh,
    gasoline_price_brl_liter,
    gasoline_efficiency_km_liter,
  } = parsed.data;
  const tariffPromise = context.supabase.from("home_energy_tariffs").upsert(
    {
      user_id: context.userId,
      price_brl_kwh: home_tariff_brl_kwh,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  const comparisonPromise =
    gasoline_price_brl_liter !== null && gasoline_efficiency_km_liter !== null
      ? context.supabase.from("fuel_comparison_settings").upsert(
          {
            user_id: context.userId,
            gasoline_price_brl_liter,
            gasoline_efficiency_km_liter,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        )
      : context.supabase
          .from("fuel_comparison_settings")
          .delete()
          .eq("user_id", context.userId);
  const [tariff, comparison] = await Promise.all([
    tariffPromise,
    comparisonPromise,
  ]);
  if (tariff.error || comparison.error)
    return NextResponse.json(
      {
        error:
          "Não foi possível salvar todas as configurações. Tente novamente.",
      },
      { status: 400 },
    );
  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
