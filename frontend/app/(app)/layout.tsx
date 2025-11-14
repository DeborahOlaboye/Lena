import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { ConnectionGuard } from "../components/ConnectionGuard";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <ConnectionGuard>{children}</ConnectionGuard>
        </main>
      </div>
    </div>
  );
}
