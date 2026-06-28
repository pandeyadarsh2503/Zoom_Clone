import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meeting Room",
};

/**
 * Room layout — fullscreen, completely isolated from the app shell.
 *
 * No sidebar, no navbar. The in-call experience owns the entire viewport.
 */
export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090d]">
      {children}
    </div>
  );
}
