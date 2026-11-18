import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedClient, requestJson } from "@/lib/api-auth";
import { chargeSchema } from "@/lib/validation";

const idSchema = z.string().uuid();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await authenticatedClient();
  if ("response" in context) return context.response;
  const { id } = await params;
  if (!idSchema.safeParse(id).success)
    return NextResponse.json({ error: "Recarga inválida." }, { status: 400 });
  const { data, error } = await context.supabase
    .from("charging_sessions")
    .select(
      "id, vehicle_id, charged_at, charging_type, location_name, station_id, energy_kwh, total_cost_brl, distance_km, notes",
    )
    .eq("id", id)
    .maybeSingle();
  if (error)
    return NextResponse.json(
      { error: "Não foi possível carregar a recarga." },
      { status: 500 },
    );
  if (!data)
    return NextResponse.json(
      { error: "Recarga não encontrada." },
      { status: 404 },
    );
  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await authenticatedClient();
  if ("response" in context) return context.response;
  const { id } = await params;
  if (!idSchema.safeParse(id).success)
    return NextResponse.json({ error: "Recarga inválida." }, { status: 400 });
  const parsed = chargeSchema.safeParse(await requestJson(request));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  const { data, error } = await context.supabase
    .from("charging_sessions")
    .update(parsed.data)
    .eq("id", id)
    .select(
      "id, vehicle_id, charged_at, charging_type, location_name, energy_kwh, total_cost_brl, distance_km, notes",
    )
    .maybeSingle();
  if (error)
    return NextResponse.json(
      { error: "Não foi possível atualizar a recarga." },
      { status: 400 },
    );
  if (!data)
    return NextResponse.json(
      { error: "Recarga não encontrada." },
      { status: 404 },
    );
  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await authenticatedClient();
  if ("response" in context) return context.response;
  const { id } = await params;
  if (!idSchema.safeParse(id).success)
    return NextResponse.json({ error: "Recarga inválida." }, { status: 400 });
  const { data, error } = await context.supabase
    .from("charging_sessions")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error)
    return NextResponse.json(
      { error: "Não foi possível excluir a recarga." },
      { status: 400 },
    );
  if (!data)
    return NextResponse.json(
      { error: "Recarga não encontrada." },
      { status: 404 },
    );
  return NextResponse.json({ ok: true });
}
