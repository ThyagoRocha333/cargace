"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup" | "reset" | "update";

const friendlyAuthError = (message: string) => {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials"))
    return "E-mail ou senha incorretos.";
  if (normalized.includes("already registered"))
    return "Este e-mail já possui uma conta.";
  if (normalized.includes("password"))
    return "A senha precisa ter pelo menos 6 caracteres.";
  if (normalized.includes("rate limit"))
    return "Muitas tentativas. Aguarde um pouco e tente novamente.";
  return "Não foi possível concluir. Verifique os dados e tente novamente.";
};

export function AuthForm({
  mode,
  notice,
}: {
  mode: AuthMode;
  notice?: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const titles = {
    login: [
      "Bem-vindo de volta",
      "Entre para acompanhar seus custos e recargas.",
    ],
    signup: ["Crie sua conta", "Comece a organizar sua mobilidade elétrica."],
    reset: ["Recuperar acesso", "Enviaremos um link para redefinir sua senha."],
    update: ["Nova senha", "Escolha uma senha segura para sua conta."],
  } as const;

  async function submit(formData: FormData) {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const email = String(formData.get("email") ?? "").trim();
      const password = String(formData.get("password") ?? "");
      if (mode === "update") {
        if (
          password.length < 6 ||
          password !== String(formData.get("confirmPassword") ?? "")
        ) {
          setError("As senhas devem ser iguais e ter pelo menos 6 caracteres.");
          return;
        }
        const supabase = createClient();
        const { error: authError } = await supabase.auth.updateUser({
          password,
        });
        if (authError) throw authError;
        router.replace("/dashboard");
        router.refresh();
        return;
      }
      if (!email || (mode !== "reset" && password.length < 6)) {
        setError(
          "Informe um e-mail válido e uma senha com pelo menos 6 caracteres.",
        );
        return;
      }
      const supabase = createClient();
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
        router.replace("/dashboard");
        router.refresh();
      } else if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          },
        });
        if (authError) throw authError;
        if (data.session) {
          router.replace("/dashboard");
          router.refresh();
        } else {
          setMessage(
            "Cadastro iniciado. Confira seu e-mail para confirmar a conta e entrar.",
          );
        }
      } else {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha`,
          },
        );
        if (authError) throw authError;
        setMessage(
          "Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.",
        );
      }
    } catch (cause) {
      setError(
        cause instanceof Error &&
          cause.message === "Supabase não está configurado."
          ? "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para habilitar a autenticação."
          : friendlyAuthError(cause instanceof Error ? cause.message : ""),
      );
    } finally {
      setLoading(false);
    }
  }

  const [title, description] = titles[mode];

  return (
    <div className="auth-form">
      <p className="eyebrow">CARGACE · SUA MOBILIDADE, COM CONTROLE</p>
      <h2>{title}</h2>
      <p>{description}</p>
      {notice && (
        <p className="alert alert-info" role="status">
          {notice}
        </p>
      )}
      <form
        className="form-grid"
        action={(formData) => {
          void submit(formData);
        }}
      >
        <div className="field field-full">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="voce@email.com"
            required
            disabled={mode === "update"}
          />
        </div>
        {mode !== "reset" && (
          <div className="field field-full">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={6}
              placeholder="Mínimo de 6 caracteres"
              required
            />
          </div>
        )}
        {mode === "update" && (
          <div className="field field-full">
            <label htmlFor="confirmPassword">Confirmar nova senha</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
        )}
        {error && (
          <div className="alert alert-error field-full" role="alert">
            {error}
          </div>
        )}
        {message && (
          <div className="alert alert-success field-full" role="status">
            {message}
          </div>
        )}
        <button
          className="button button-primary field-full"
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Aguarde..."
            : mode === "login"
              ? "Entrar"
              : mode === "signup"
                ? "Criar conta"
                : mode === "update"
                  ? "Atualizar senha"
                  : "Enviar link de recuperação"}
        </button>
      </form>
      <div className="auth-links">
        {mode === "login" ? (
          <>
            <Link href="/recuperar-senha">Esqueci minha senha</Link>
            <span>
              Não tem conta? <Link href="/cadastro">Criar conta</Link>
            </span>
          </>
        ) : mode === "signup" ? (
          <span>
            Já tem conta? <Link href="/login">Entrar</Link>
          </span>
        ) : mode === "update" ? null : (
          <Link href="/login">Voltar para entrar</Link>
        )}
      </div>
    </div>
  );
}
