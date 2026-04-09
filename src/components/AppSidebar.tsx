import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, DollarSign, Layers, GitMerge, FileText,
  BookOpen, TrendingUp, BarChart2, Activity, CalendarDays, History,
} from "lucide-react";

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

  return (
    <aside className="fixed left-0 top-0 w-[220px] h-screen flex flex-col z-50"
      style={{ background: "#0F0F0F", borderRight: "1px solid #2A2A2A" }}>
      {/* Logo */}
      <div className="px-4 pt-6 pb-5 flex items-center gap-2.5">
        <div className="w-5 h-5 rounded-sm rotate-45" style={{ background: "#7C3AED" }} />
        <span className="text-[16px] font-bold tracking-tight">
          <span style={{ color: "#F9FAFB" }}>Basha</span>
          <span style={{ color: "#7C3AED" }}>FX</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-1 overflow-y-auto flex flex-col gap-1">
        {navItems.map((item) => {
          const active = isActiveLink(location.pathname, item.path);
          const Icon = item.icon;
          return (
            <Link key={item.label} to={item.path === "/currencies" ? "/currencies/USD" : item.path}
              className="no-underline transition-colors flex items-center gap-2.5 px-4 py-[10px] rounded-md text-[14px]"
              style={{
                color: "#F9FAFB",
                background: active ? "#1E1433" : "transparent",
                fontWeight: active ? 500 : 400,
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "#1A1A1A"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Icon size={18} style={{ color: "#F9FAFB" }} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Live indicator */}
      <div className="px-4 pb-6 flex items-center gap-2">
        <div className="w-[6px] h-[6px] rounded-full bg-live-green animate-pulse-dot" />
        <span className="text-[10px]" style={{ color: "#6B7280" }}>Live</span>
      </div>
    </aside>
  );
}
