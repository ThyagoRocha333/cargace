import { redirect } from "next/navigation";
import { WorkspaceNavigation } from "@/components/workspace-navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!isSupabaseConfigured()) redirect("/login?config=missing");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="workspace">
      <WorkspaceNavigation email={user.email ?? "Conta"} />
      <main className="workspace-main">
        <div className="workspace-content">{children}</div>
      </main>
    </div>
  );
}
