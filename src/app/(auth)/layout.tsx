import Link from "next/link";
import { Zap } from "lucide-react";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="auth-shell">
      <aside className="auth-side">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <Zap size={18} fill="currentColor" />
          </span>
          Carga<span>CE</span>
        </Link>
        <div className="auth-side-copy">
          <p className="eyebrow">MOBILIDADE ELÉTRICA EM FORTALEZA</p>
          <h1>Mais clareza para cada quilômetro.</h1>
          <p>
            Registre suas recargas, entenda seus custos e encontre pontos de
            carregamento com informações de fontes identificadas.
          </p>
        </div>
        <p className="auth-footer">
          Seus dados são privados e protegidos por políticas de acesso.
        </p>
      </aside>
      <section className="auth-form-wrap">{children}</section>
    </main>
  );
}
