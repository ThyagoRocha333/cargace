import Link from "next/link";
import {
  ArrowRight,
  BatteryCharging,
  ChartNoAxesCombined,
  CircleDollarSign,
  MapPin,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: BatteryCharging,
    title: "Recargas organizadas",
    description:
      "Registre sessões em casa ou na rua e acompanhe energia, custo e distância.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Números que fazem sentido",
    description:
      "Entenda seu gasto por kWh e por quilômetro com base nos seus próprios dados.",
  },
  {
    icon: MapPin,
    title: "Estações reais por perto",
    description:
      "Consulte eletropostos reportados pela Open Charge Map, com origem e limites claros.",
  },
];

export default function Home() {
  return (
    <main className="landing">
      <header className="landing-header">
        <Link className="brand" href="/" aria-label="CargaCE, início">
          <span className="brand-mark">
            <Zap size={19} fill="currentColor" />
          </span>
          Carga<span>CE</span>
        </Link>
        <nav className="landing-nav" aria-label="Navegação principal">
          <a href="#recursos">Recursos</a>
          <a href="#sobre">Sobre o projeto</a>
        </nav>
        <div className="landing-actions">
          <Link className="button button-quiet" href="/login">
            Entrar
          </Link>
          <Link className="button button-primary" href="/cadastro">
            Criar conta
          </Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="status-dot" /> MOBILIDADE ELÉTRICA, COM CLAREZA
          </p>
          <h1>
            Sua energia, seus gastos, <span>seu controle.</span>
          </h1>
          <p className="hero-description">
            Acompanhe recargas, descubra seu custo por quilômetro e encontre
            pontos de carregamento em Fortaleza — tudo em um só lugar.
          </p>
          <div className="hero-actions">
            <Link
              className="button button-primary button-large"
              href="/cadastro"
            >
              Começar agora <ArrowRight size={17} />
            </Link>
            <Link className="text-link" href="/login">
              Já tenho uma conta
            </Link>
          </div>
          <div className="trust-line">
            <span className="trust-check">✓</span> Seus dados são privados e
            protegidos
          </div>
        </div>

        <div
          className="preview-wrap"
          aria-label="Prévia ilustrativa da aplicação"
        >
          <div className="preview-card">
            <div className="preview-top">
              <div>
                <p className="preview-label">RESUMO DO MÊS</p>
                <p className="preview-date">Seus dados, no seu ritmo</p>
              </div>
              <span className="preview-icon">
                <Zap size={19} />
              </span>
            </div>
            <div className="preview-empty">
              <span className="preview-battery">
                <BatteryCharging size={27} />
              </span>
              <p>Seu próximo passo começa aqui.</p>
              <span>Registre uma recarga para ver seus indicadores.</span>
            </div>
            <div className="preview-footer">
              <span>
                <i className="legend-green" /> Energia
              </span>
              <span>
                <i className="legend-blue" /> Gastos
              </span>
              <span>Dados pessoais</span>
            </div>
          </div>
          <div className="floating-note">
            <span className="floating-icon">
              <CircleDollarSign size={17} />
            </span>
            <span>
              <b>Custos transparentes</b>
              <small>Sem números inventados</small>
            </span>
          </div>
        </div>
      </section>

      <section className="feature-section" id="recursos">
        <div className="section-heading">
          <p className="eyebrow">FEITO PARA A SUA ROTINA</p>
          <h2>Mais autonomia para seguir em frente.</h2>
          <p>
            Uma visão prática da sua mobilidade elétrica, com dados que você
            registra e fontes identificadas.
          </p>
        </div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, description }, index) => (
            <article className="feature-card" key={title}>
              <span className="feature-icon">
                <Icon size={20} />
              </span>
              <span className="feature-index">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-strip" id="sobre">
        <div>
          <p className="eyebrow">PROJETO INDEPENDENTE</p>
          <h2>
            Tecnologia aberta.
            <br />
            Mobilidade mais consciente.
          </h2>
        </div>
        <div>
          <p>
            Construído com tecnologias abertas e fontes identificadas. Os
            indicadores financeiros são calculados a partir dos seus registros,
            não de estimativas ocultas.
          </p>
          <div className="tech-chips">
            <span>Next.js</span>
            <span>TypeScript</span>
            <span>Supabase</span>
            <span>PostgreSQL</span>
            <span>OpenStreetMap</span>
          </div>
        </div>
        <Link className="button button-outline" href="/cadastro">
          Conheça o CargaCE <ArrowRight size={16} />
        </Link>
      </section>

      <footer className="landing-footer">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <Zap size={16} fill="currentColor" />
          </span>
          Carga<span>CE</span>
        </Link>
        <p>
          Projeto de portfólio para mobilidade elétrica em Fortaleza, Ceará.
        </p>
        <span>© {new Date().getFullYear()} CargaCE</span>
      </footer>
    </main>
  );
}
