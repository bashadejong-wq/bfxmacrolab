import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X,
  LayoutDashboard, DollarSign, Layers, GitMerge, FileText,
  TrendingUp, BarChart2, CalendarDays, History, Lightbulb,
} from "lucide-react";
import { Sheet, SheetContent, SheetClose } from "./ui/sheet";

const navItems = [
  { label: "Overview", path: "/", icon: LayoutDashboard },
  { label: "Currencies", path: "/currencies", icon: DollarSign },
  { label: "Macro Analysis", path: "/dwm", icon: Layers },
  { label: "Regime & Alignment", path: "/alignment", icon: GitMerge },
  { label: "Reports", path: "/reports", icon: FileText },
  { label: "Markets & Yields", path: "/markets", icon: TrendingUp },
  { label: "Macro Data", path: "/macro-data", icon: BarChart2 },
  { label: "Calendar", path: "/calendar", icon: CalendarDays },
  { label: "Event History", path: "/event-history", icon: History },
  { label: "Trade Ideas", path: "/trade-ideas", icon: Lightbulb },
];

const isActiveLink = (pathname: string, itemPath: string) => {
  if (itemPath === "/") return pathname === "/" || pathname === "/overview";
  if (itemPath === "/currencies") return pathname.startsWith("/currencies");
  return pathname.startsWith(itemPath);
};

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14"
        style={{ background: "#0F0F0F", borderBottom: "1px solid #2A2A2A" }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-4 rounded-sm rotate-45 flex-shrink-0" style={{ background: "#7C3AED" }} />
          <span className="text-[14px] font-bold tracking-tight">
            <span style={{ color: "#F9FAFB" }}>Basha</span>
            <span style={{ color: "#7C3AED" }}>FX</span>
          </span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-md border-0 cursor-pointer"
          style={{ color: "#F9FAFB", background: "transparent" }}
        >
          <Menu size={22} />
        </button>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-[260px] border-r-0" style={{ background: "#0F0F0F" }}>
          <div className="pt-6 pb-5 px-4 flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-sm rotate-45 flex-shrink-0" style={{ background: "#7C3AED" }} />
            <span className="text-[16px] font-bold tracking-tight">
              <span style={{ color: "#F9FAFB" }}>Basha</span>
              <span style={{ color: "#7C3AED" }}>FX</span>
            </span>
          </div>
          <nav className="flex flex-col gap-1 px-2">
            {navItems.map((item) => {
              const active = isActiveLink(location.pathname, item.path);
              const Icon = item.icon;
              return (
                <SheetClose asChild key={item.label}>
                  <Link
                    to={item.path === "/currencies" ? "/currencies/USD" : item.path}
                    className="no-underline flex items-center gap-2.5 rounded-md text-[14px] px-4 py-2.5"
                    style={{
                      color: "#F9FAFB",
                      background: active ? "#1E1433" : "transparent",
                      fontWeight: active ? 500 : 400,
                    }}
                  >
                    <Icon size={18} className="flex-shrink-0" style={{ color: "#F9FAFB" }} />
                    {item.label}
                  </Link>
                </SheetClose>
              );
            })}
          </nav>
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <div className="w-[6px] h-[6px] rounded-full bg-live-green animate-pulse-dot" />
            <span className="text-[10px]" style={{ color: "#6B7280" }}>Live</span>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
