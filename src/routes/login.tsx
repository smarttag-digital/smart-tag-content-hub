import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const ALLOWED_EMAIL = "smart.tag14@gmail.com";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar | SMART TAG Content Hub" },
      {
        name: "description",
        content: "Acesso da equipe SMART TAG ao painel de gestão de conteúdos e aprovações.",
      },
      { property: "og:title", content: "Entrar | SMART TAG Content Hub" },
      {
        property: "og:description",
        content: "Acesso da equipe SMART TAG ao painel de gestão de conteúdos e aprovações.",
      },
    ],
  }),
  ssr: false,
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      const sessionEmail = data.session.user.email?.toLowerCase();
      if (sessionEmail === ALLOWED_EMAIL) {
        navigate({ to: "/dashboard" });
      } else {
        supabase.auth.signOut();
      }
    });
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (normalized !== ALLOWED_EMAIL) {
      toast.error("Este e-mail não tem permissão de acesso ao painel.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalized,
          password,
        });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
          redirectTo: `${window.location.origin}/redefinir-senha`,
        });
        if (error) throw error;
        toast.success("Enviamos um link de redefinição para seu e-mail.");
        setMode("login");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível concluir a ação");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao entrar com Google");
      setGoogleLoading(false);
    }
  }

  return (
    <main className="aurora relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark className="h-16 w-16 shadow-glow" />
          <h1 className="mt-5 font-display text-2xl font-bold tracking-[0.2em]">SMART TAG</h1>
          <p className="mt-1 text-xs font-medium tracking-[0.42em] text-muted-foreground">
            CONTENT HUB
          </p>
        </div>

        <div className="surface-panel p-7 shadow-elevated">
          <h2 className="font-display text-lg font-semibold">
            {mode === "login" ? "Acesse o painel" : "Recuperar senha"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "reset"
              ? "Informe seu e-mail para receber o link de redefinição."
              : "Área exclusiva da equipe SMART TAG."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={ALLOWED_EMAIL}
                required
              />
            </div>
            {mode !== "reset" && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full gradient-brand h-11 text-base">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "login" ? "Entrar" : "Enviar link"}
            </Button>
          </form>

          {mode === "login" && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
              </div>
              <Button
                type="button"
                variant="secondary"
                className="h-11 w-full text-base"
                disabled={googleLoading}
                onClick={handleGoogle}
              >
                {googleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entrar com Google
              </Button>
            </>
          )}

          <div className="mt-5 flex flex-col gap-2 text-sm">
            {mode === "login" ? (
              <button
                type="button"
                onClick={() => setMode("reset")}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Esqueci minha senha
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Voltar para o login
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          É cliente da SMART TAG?{" "}
          <Link to="/" className="text-foreground underline-offset-4 hover:underline">
            utilize o link privado enviado pela equipe.
          </Link>
        </p>
      </div>
    </main>
  );
}
