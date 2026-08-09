import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { BrandMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({
    meta: [
      { title: "Redefinir senha | SMAR TAG Content Hub" },
      { name: "description", content: "Defina uma nova senha para acessar o painel SMAR TAG." },
      { property: "og:title", content: "Redefinir senha | SMAR TAG Content Hub" },
      { property: "og:description", content: "Defina uma nova senha para acessar o painel SMAR TAG." },
    ],
  }),
  ssr: false,
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada com sucesso!");
      navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a senha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="aurora flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <BrandMark className="h-14 w-14" />
          <h1 className="mt-4 font-display text-xl font-bold tracking-[0.2em]">SMAR TAG</h1>
        </div>
        <form onSubmit={handleSubmit} className="surface-panel space-y-4 p-7 shadow-elevated">
          <h2 className="font-display text-lg font-semibold">Definir nova senha</h2>
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <Input
              id="password"
              type="password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full gradient-brand h-11">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar nova senha
          </Button>
        </form>
      </div>
    </main>
  );
}
