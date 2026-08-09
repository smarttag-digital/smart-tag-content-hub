import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar | SMAR TAG Content Hub" },
      {
        name: "description",
        content: "Acesso da equipe SMAR TAG ao painel de gestão de conteúdos e aprovações.",
      },
      { property: "og:title", content: "Entrar | SMAR TAG Content Hub" },
      {
        property: "og:description",
        content: "Acesso da equipe SMAR TAG ao painel de gestão de conteúdos e aprovações.",
      },
    ],
  }),
  ssr: false,
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
        navigate({ to: "/dashboard" });
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Conta criada com sucesso!");
          navigate({ to: "/dashboard" });
        } else {
          toast.success("Confirme seu e-mail para ativar o acesso.");
          setMode("login");
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
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

  return (
    <main className="aurora relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark className="h-16 w-16 shadow-glow" />
          <h1 className="mt-5 font-display text-2xl font-bold tracking-[0.2em]">SMAR TAG</h1>
          <p className="mt-1 text-xs font-medium tracking-[0.42em] text-muted-foreground">
            CONTENT HUB
          </p>
        </div>

        <div className="surface-panel p-7 shadow-elevated">
          <h2 className="font-display text-lg font-semibold">
            {mode === "login"
              ? "Acesse o painel"
              : mode === "signup"
                ? "Criar conta da equipe"
                : "Recuperar senha"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "reset"
              ? "Informe seu e-mail para receber o link de redefinição."
              : "Área exclusiva da equipe SMAR TAG."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ana Souza"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@smartag.com.br"
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
              {mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"}
            </Button>
          </form>

          <div className="mt-5 flex flex-col gap-2 text-sm">
            {mode === "login" && (
              <>
                <button
                  type="button"
                  onClick={() => setMode("reset")}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Esqueci minha senha
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Primeiro acesso da equipe? Criar conta
                </button>
              </>
            )}
            {mode !== "login" && (
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
          É cliente da SMAR TAG?{" "}
          <Link to="/" className="text-foreground underline-offset-4 hover:underline">
            utilize o link privado enviado pela equipe.
          </Link>
        </p>
      </div>
    </main>
  );
}
