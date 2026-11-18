import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

type UserClient = Awaited<ReturnType<typeof createClient>>;

export async function authenticatedClient(): Promise<
  { supabase: UserClient; userId: string } | { response: NextResponse }
> {
  if (!isSupabaseConfigured()) {
    return {
      response: NextResponse.json(
        { error: "Serviço de dados não configurado." },
        { status: 503 },
      ),
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return {
      response: NextResponse.json(
        { error: "Autenticação necessária." },
        { status: 401 },
      ),
    };
  }
  return { supabase, userId: user.id };
}

export async function requestJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
