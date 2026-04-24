import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/utils/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth en Node Runtime (server component).
  // Sustituye al middleware, que fallaba en Edge Runtime por __dirname.
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="h-screen flex bg-bg overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
