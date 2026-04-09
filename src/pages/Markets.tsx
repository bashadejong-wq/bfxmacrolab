import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Activity, TrendingUp } from "lucide-react";

// Lazy inline imports to avoid circular deps
import MarketContent from "./Market";
import YieldsContent from "./Yields";

const TABS = [
  { key: "prices", label: "Live Prices", icon: Activity },
  { key: "yields", label: "Yields", icon: TrendingUp },
];

export default function Markets() {
  const [tab, setTab] = useState("prices");

  // Market and Yields already render DashboardLayout, so we render them directly
  if (tab === "yields") return <YieldsContent />;
  return <MarketContent />;
}
