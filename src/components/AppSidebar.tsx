import { Link, useLocation } from "react-router-dom";

const navItems = [
  { label: "Overview", path: "/overview" },
  { label: "Currencies", path: "/currencies/USD" },
  { label: "DWM", path: "/dwm" },
  { label: "Alignment", path: "/alignment" },
  { label: "Reports", path: "/reports" },
  { label: "Brief", path: "/brief" },
  { label: "Yields", path: "/yields" },
  { label: "Macro Data", path: "/macro-data" },
  { label: "Market", path: "/market" },
  { label: "Calendar", path: "/calendar" },
];

const isActiveLink = (pathname: string, itemPath: string) => {
  if (itemPath === "/overview") return pathname === "/" || pathname === "/overview";
  if (itemPath.startsWith("/currencies")) return pathname.startsWith("/currencies");
  return pathname.startsWith(itemPath);
};

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 w-[220px] h-screen bg-sidebar-bg flex flex-col z-50"
      style={{ borderRight: "1px solid hsl(0 0% 10%)" }}>
      {/* Logo */}
      <div className="px-5 pt-6 pb-1">
        <span className="text-[15px] font-bold text-white">BashaFX</span>
      </div>
      <div className="px-5 pb-4">
        <span className="text-[9px] tracking-[0.1em] uppercase text-sidebar-text">Macro Intelligence</span>
      </div>

      {/* Divider */}
      <div className="h-px bg-sidebar-border" />

      {/* Nav */}
      <nav className="flex-1 py-2">
        {navItems.map((item) => {
          const active = isActiveLink(location.pathname, item.path);
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`block px-5 py-[10px] text-[12px] no-underline transition-colors ${
                active
                  ? "bg-sidebar-active-bg text-white font-medium border-l-[3px] border-l-purple-accent"
                  : "text-sidebar-text hover:text-sidebar-text-hover border-l-[3px] border-l-transparent"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Live indicator */}
      <div className="px-5 pb-6 flex items-center gap-2">
        <div className="w-[6px] h-[6px] rounded-full bg-live-green animate-pulse-dot" />
        <span className="text-[10px] text-sidebar-text">Live</span>
      </div>
    </aside>
  );
}
