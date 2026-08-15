import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Film,
  CheckSquare,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

import { BrandLockup } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/campanhas", label: "Campanhas", icon: Megaphone },
  { to: "/videos", label: "Vídeos", icon: Film },
  { to: "/selecoes", label: "Seleções", icon: CheckSquare },
  { to: "/materiais", label: "Materiais", icon: Package },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);
  const [userLabel, setUserLabel] = useState("Equipe SMART TAG");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      const meta = user.user_metadata as { full_name?: string } | null;
      setUserLabel(meta?.full_name || user.email || "Equipe SMART TAG");
    });
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map((item) => {
        const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "gradient-brand text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6 lg:flex">
        <BrandLockup className="mb-8 px-2" />
        {nav}
        <Button
          variant="ghost"
          onClick={signOut}
          className="mt-4 justify-start gap-3 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-border bg-sidebar px-4 py-6">
            <div className="mb-8 flex items-center justify-between px-2">
              <BrandLockup />
              <button onClick={() => setOpen(false)} aria-label="Fechar menu">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            {nav}
            <Button
              variant="ghost"
              onClick={signOut}
              className="mt-4 justify-start gap-3 text-muted-foreground"
            >
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-border bg-background/80 px-4 py-3.5 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-display text-sm font-semibold tracking-[0.18em] lg:hidden">
              SMART TAG
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium leading-tight">{userLabel}</p>
              <p className="text-[11px] text-muted-foreground">Administrador</p>
            </div>
            <div className="gradient-brand flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground">
              {userLabel.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
