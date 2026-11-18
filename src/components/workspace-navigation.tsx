"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BatteryCharging,
  CarFront,
  ChartNoAxesCombined,
  CircleUserRound,
  LogOut,
  MapPin,
  Settings,
  Zap,
} from "lucide-react";
import { signOut } from "@/lib/supabase/actions";

const links = [
  { href: "/dashboard", label: "Visão geral", icon: ChartNoAxesCombined },
  { href: "/recargas", label: "Minhas recargas", icon: BatteryCharging },
  { href: "/veiculos", label: "Meus veículos", icon: CarFront },
  { href: "/mapa", label: "Eletropostos", icon: MapPin },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function WorkspaceNavigation({ email }: { email: string }) {
  const pathname = usePathname();
  const initials = email.slice(0, 1).toUpperCase();
  return (
    <>
      <aside className="sidebar">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark">
            <Zap size={17} fill="currentColor" />
          </span>
          Carga<span>CE</span>
        </Link>
        <p className="nav-caption">MENU PRINCIPAL</p>
        <nav className="side-links" aria-label="Navegação do aplicativo">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              className={`side-link ${pathname === href ? "active" : ""}`}
              href={href}
              key={href}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <p className="nav-caption">CONTA</p>
          <form action={signOut}>
            <button
              type="submit"
              className="side-link"
              style={{
                width: "100%",
                border: 0,
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <LogOut size={16} /> Sair
            </button>
          </form>
        </div>
      </aside>
      <header className="workspace-top">
        <span className="breadcrumb">
          CargaCE <span aria-hidden="true">/</span>{" "}
          {links.find((item) => item.href === pathname)?.label ?? "Aplicativo"}
        </span>
        <div className="user-chip">
          <CircleUserRound size={15} />
          <span>{email}</span>
          <span className="user-avatar">{initials}</span>
        </div>
      </header>
      <nav className="bottom-nav" aria-label="Navegação móvel">
        {links.slice(0, 5).map(({ href, label, icon: Icon }) => (
          <Link
            className={pathname === href ? "active" : ""}
            href={href}
            key={href}
          >
            <Icon size={17} />
            <span>
              {label === "Visão geral"
                ? "Início"
                : label === "Minhas recargas"
                  ? "Recargas"
                  : label === "Meus veículos"
                    ? "Veículos"
                    : label === "Eletropostos"
                      ? "Mapa"
                      : "Ajustes"}
            </span>
          </Link>
        ))}
      </nav>
    </>
  );
}
