import { NextResponse } from "next/server";
import { authenticatedClient, requestJson } from "@/lib/api-auth";
import { vehicleSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const context = await authenticatedClient();
  if ("response" in context) return context.response;
  const { data, error } = await context.supabase
    .from("vehicles")
    .select(
      "id, make, model, year, battery_capacity_kwh, estimated_consumption_kwh_100km, connector_type, created_at",
    )
    .order("created_at", { ascending: false });
  if (error)
    return NextResponse.json(
      { error: "Não foi possível carregar os veículos." },
      { status: 500 },
    );
  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: Request) {
  const context = await authenticatedClient();
  if ("response" in context) return context.response;
  const parsed = vehicleSchema.safeParse(await requestJson(request));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  const { data, error } = await context.supabase
    .from("vehicles")
    .insert({ ...parsed.data, user_id: context.userId })
    .select()
    .single();
  if (error)
    return NextResponse.json(
      { error: "Não foi possível cadastrar o veículo." },
      { status: 400 },
    );
  return NextResponse.json(data, {
    status: 201,
    headers: { "Cache-Control": "private, no-store" },
  });
}
