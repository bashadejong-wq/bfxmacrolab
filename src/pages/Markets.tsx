import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MarketContent from "@/components/content/MarketContent";
import YieldsContent from "@/components/content/YieldsContent";

export default function Markets() {
  return (
    <DashboardLayout>
      <Tabs defaultValue="prices" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="prices">Live Prices</TabsTrigger>
          <TabsTrigger value="yields">Yields & Curve</TabsTrigger>
        </TabsList>
        <TabsContent value="prices">
          <MarketContent />
        </TabsContent>
        <TabsContent value="yields">
          <YieldsContent />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
