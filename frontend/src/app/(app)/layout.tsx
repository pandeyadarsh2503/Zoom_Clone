import { Navbar } from "@/components/layout/Navbar";
import { Sidebar, BottomNav } from "@/components/layout/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F8FA]">
      {/* Fixed sidebar (240px) */}
      <Sidebar />

      {/* Main column: fixed 72px navbar + scrollable content. */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
}
