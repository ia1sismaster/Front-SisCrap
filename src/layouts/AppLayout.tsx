import { Sidebar } from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 h-full space-y-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
