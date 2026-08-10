import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/admin-shell";
import { supabase } from "@/integrations/supabase/client";

const ALLOWED_EMAIL = "smart.tag14@gmail.com";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    if (data.user.email?.toLowerCase() !== ALLOWED_EMAIL) {
      await supabase.auth.signOut();
      throw redirect({ to: "/login" });
    }
    return { user: data.user };
  },
  component: () => (
    <AdminShell>
      <Outlet />
    </AdminShell>
  ),
});
