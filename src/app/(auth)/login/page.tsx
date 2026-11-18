import { AuthForm } from "@/components/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ config?: string; error?: string }>;
}) {
  const params = await searchParams;
  const notice =
    params.config === "missing"
      ? "Configure as variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para habilitar o acesso ao banco."
      : params.error === "callback"
        ? "O link de autenticação expirou ou não pôde ser validado. Solicite um novo link."
        : undefined;
  return <AuthForm mode="login" notice={notice} />;
}
