import { Navbar } from "@/components/layout/Navbar";
import { Sidebar, BottomNav } from "@/components/layout/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F8FA]">
      {/* Keyboard skip link — first focusable element on the page. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#0E72ED] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to content
      </a>

      {/* Fixed sidebar (240px) */}
      <Sidebar />

      {/* Main column: fixed 72px navbar + scrollable content. */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto outline-none">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
}
