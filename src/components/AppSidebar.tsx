import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, DollarSign, Layers, GitMerge, FileText,
  BookOpen, TrendingUp, BarChart2, Activity, CalendarDays, History,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { useSidebar } from "./DashboardLayout";

const navItems = [
  { label: "Overview", path: "/", icon: LayoutDashboard },
  { label: "Currencies", path: "/currencies", icon: DollarSign },
  { label: "DWM", path: "/dwm", icon: Layers },
  { label: "Alignment", path: "/alignment", icon: GitMerge },
  { label: "Reports", path: "/reports", icon: FileText },
  { label: "Brief", path: "/brief", icon: BookOpen },
  { label: "Yields", path: "/yields", icon: TrendingUp },
  { label: "Macro Data", path: "/macro-data", icon: BarChart2 },
  { label: "Market", path: "/market", icon: Activity },
  { label: "Calendar", path: "/calendar", icon: CalendarDays },
  { label: "Event History", path: "/event-history", icon: History },
];

const isActiveLink = (pathname: string, itemPath: string) => {
  if (itemPath === "/") return pathname === "/" || pathname === "/overview";
  if (itemPath === "/currencies") return pathname.startsWith("/currencies");
  return pathname.startsWith(itemPath);
};

export function AppSidebar() {
  const location = useLocation();
  const { collapsed, setCollapsed } = useSidebar();
  const width = collapsed ? 60 : 220;

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-50"
      style={{
        width,
        transition: "width 200ms ease",
        background: "#0F0F0F",
        borderRight: "1px solid #2A2A2A",
      }}
    >
      {/* Logo */}
      <div className="pt-6 pb-5 flex items-center gap-2.5 overflow-hidden"
        style={{ paddingLeft: collapsed ? 0 : 16, paddingRight: collapsed ? 0 : 16, justifyContent: collapsed ? "center" : "flex-start" }}>
        <div className="w-5 h-5 rounded-sm rotate-45 flex-shrink-0" style={{ background: "#7C3AED" }} />
        {!collapsed && (
          <span className="text-[16px] font-bold tracking-tight whitespace-nowrap">
            <span style={{ color: "#F9FAFB" }}>Basha</span>
            <span style={{ color: "#7C3AED" }}>FX</span>
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto flex flex-col gap-1"
        style={{ padding: collapsed ? "4px 6px" : "4px 8px" }}>
        {navItems.map((item) => {
          const active = isActiveLink(location.pathname, item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.path === "/currencies" ? "/currencies/USD" : item.path}
              title={collapsed ? item.label : undefined}
              className="no-underline flex items-center rounded-md text-[14px] overflow-hidden whitespace-nowrap"
              style={{
                color: "#F9FAFB",
                background: active ? "#1E1433" : "transparent",
                fontWeight: active ? 500 : 400,
                padding: collapsed ? "10px 0" : "10px 16px",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: collapsed ? 0 : 10,
                transition: "background 150ms ease",
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "#1A1A1A"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Icon size={18} className="flex-shrink-0" style={{ color: "#F9FAFB" }} />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: live + toggle */}
      <div className="pb-4 flex flex-col gap-3" style={{ paddingLeft: collapsed ? 0 : 16, paddingRight: collapsed ? 0 : 16 }}>
        <div className="flex items-center gap-2" style={{ justifyContent: collapsed ? "center" : "flex-start" }}>
          <div className="w-[6px] h-[6px] rounded-full bg-live-green animate-pulse-dot" />
          {!collapsed && <span className="text-[10px]" style={{ color: "#6B7280" }}>Live</span>}
        </div>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center rounded-md border-0 cursor-pointer"
          style={{
            color: "#6B7280",
            background: "transparent",
            padding: "6px 0",
            justifyContent: collapsed ? "center" : "flex-start",
            transition: "background 150ms ease",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#1A1A1A"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}
