import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="auth-form-wrap">
      <section className="auth-form">
        <span className="empty-icon">
          <WifiOff size={20} />
        </span>
        <h1>Você está sem conexão</h1>
        <p>
          O CargaCE precisa de internet para acessar e atualizar seus dados
          privados. Tente novamente quando estiver online.
        </p>
        <Link className="button button-primary" href="/">
          Voltar ao início
        </Link>
      </section>
    </main>
  );
}
