import { createContext, useContext, useState, ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";

type SidebarContextType = { collapsed: boolean; setCollapsed: (v: boolean | ((c: boolean) => boolean)) => void };
const SidebarContext = createContext<SidebarContextType>({ collapsed: false, setCollapsed: () => {} });
export const useSidebar = () => useContext(SidebarContext);

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const ml = collapsed ? 60 : 220;

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="min-h-screen bg-background">
        <AppSidebar />
        <main className="p-7 min-h-screen" style={{ marginLeft: ml, transition: "margin-left 200ms ease" }}>
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
