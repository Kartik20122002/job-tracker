import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:flex">
        <Sidebar userName={session?.user?.name} userEmail={session?.user?.email} />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header userName={session?.user?.name} userEmail={session?.user?.email} />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
