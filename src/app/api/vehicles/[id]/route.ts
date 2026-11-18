import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticatedClient, requestJson } from "@/lib/api-auth";
import { vehicleSchema } from "@/lib/validation";

const idSchema = z.string().uuid();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await authenticatedClient();
  if ("response" in context) return context.response;
  const { id } = await params;
  if (!idSchema.safeParse(id).success)
    return NextResponse.json({ error: "Veículo inválido." }, { status: 400 });
  const parsed = vehicleSchema.safeParse(await requestJson(request));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  const { data, error } = await context.supabase
    .from("vehicles")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error)
    return NextResponse.json(
      { error: "Não foi possível atualizar o veículo." },
      { status: 400 },
    );
  if (!data)
    return NextResponse.json(
      { error: "Veículo não encontrado." },
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
    return NextResponse.json({ error: "Veículo inválido." }, { status: 400 });
  const { data, error } = await context.supabase
    .from("vehicles")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) {
    const message =
      error.code === "23503"
        ? "Este veículo possui recargas associadas. Exclua essas recargas antes de remover o veículo."
        : "Não foi possível excluir o veículo.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  if (!data)
    return NextResponse.json(
      { error: "Veículo não encontrado." },
      { status: 404 },
    );
  return NextResponse.json({ ok: true });
}
