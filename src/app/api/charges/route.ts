import { NextResponse } from "next/server";
import { authenticatedClient, requestJson } from "@/lib/api-auth";
import { chargeSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const context = await authenticatedClient();
  if ("response" in context) return context.response;
  const rows = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await context.supabase
      .from("charging_sessions")
      .select(
        "id, vehicle_id, charged_at, charging_type, location_name, station_id, energy_kwh, total_cost_brl, distance_km, notes, vehicles(make, model)",
      )
      .order("charged_at", { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (error)
      return NextResponse.json(
        { error: "Não foi possível carregar as recargas." },
        { status: 500 },
      );
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return NextResponse.json(rows, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: Request) {
  const context = await authenticatedClient();
  if ("response" in context) return context.response;
  const parsed = chargeSchema.safeParse(await requestJson(request));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  const { data, error } = await context.supabase
    .from("charging_sessions")
    .insert({ ...parsed.data, user_id: context.userId })
    .select(
      "id, vehicle_id, charged_at, charging_type, location_name, energy_kwh, total_cost_brl, distance_km, notes",
    )
    .single();
  if (error)
    return NextResponse.json(
      {
        error:
          "Não foi possível registrar a recarga. Verifique se o veículo pertence à sua conta.",
      },
      { status: 400 },
    );
  return NextResponse.json(data, {
    status: 201,
    headers: { "Cache-Control": "private, no-store" },
  });
}
