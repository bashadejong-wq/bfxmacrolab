import { createContext, useContext, useState, ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { MobileHeader } from "./MobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";

type SidebarContextType = { collapsed: boolean; setCollapsed: (v: boolean | ((c: boolean) => boolean)) => void };
const SidebarContext = createContext<SidebarContextType>({ collapsed: false, setCollapsed: () => {} });
export const useSidebar = () => useContext(SidebarContext);

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const ml = isMobile ? 0 : collapsed ? 60 : 220;

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="min-h-screen bg-background">
        {isMobile ? <MobileHeader /> : <AppSidebar />}
        <main
          className={isMobile ? "p-4 pt-16 min-h-screen" : "p-7 min-h-screen"}
          style={isMobile ? undefined : { marginLeft: ml, transition: "margin-left 200ms ease" }}
        >
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
