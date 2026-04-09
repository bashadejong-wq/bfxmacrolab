import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Overview from "./pages/Overview";
import Currencies from "./pages/Currencies";
import DWM from "./pages/DWM";
import Alignment from "./pages/Alignment";
import Reports from "./pages/Reports";
import Markets from "./pages/Markets";
import MacroData from "./pages/MacroData";
import Calendar from "./pages/Calendar";
import EventHistory from "./pages/EventHistory";
import TradeIdeas from "./pages/TradeIdeas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/overview" element={<Navigate to="/" replace />} />
          <Route path="/currencies/:code" element={<Currencies />} />
          <Route path="/currencies" element={<Navigate to="/currencies/USD" replace />} />
          <Route path="/dwm" element={<DWM />} />
          <Route path="/brief" element={<Navigate to="/dwm" replace />} />
          <Route path="/alignment" element={<Alignment />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/yields" element={<Navigate to="/markets" replace />} />
          <Route path="/market" element={<Navigate to="/markets" replace />} />
          <Route path="/macro-data" element={<MacroData />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/event-history" element={<EventHistory />} />
          <Route path="/trade-ideas" element={<TradeIdeas />} />
          <Route path="/regime-timeline" element={<Navigate to="/alignment" replace />} />
          <Route path="/correlations" element={<Navigate to="/currencies/USD" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
