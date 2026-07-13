import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import CrmOverview from "./CrmOverview";
import CrmCustomersList from "./CrmCustomersList";
import CrmCampaigns from "./CrmCampaigns";
import { LayoutDashboard, Users, Mail } from "lucide-react";

type CrmView = "overview" | "customers" | "campaigns";

export default function CrmWrapper() {
  const [, setLocation] = useLocation();
  const [view, setView] = useState<CrmView>("overview");

  return (
    <div className="space-y-6">
      {/* Navegação */}
      <div className="flex gap-2 border-b">
        <Button
          variant={view === "overview" ? "default" : "ghost"}
          onClick={() => setView("overview")}
          className="rounded-b-none"
        >
          <LayoutDashboard className="w-4 h-4 mr-2" />
          Overview
        </Button>
        <Button
          variant={view === "customers" ? "default" : "ghost"}
          onClick={() => setView("customers")}
          className="rounded-b-none"
        >
          <Users className="w-4 h-4 mr-2" />
          Clientes
        </Button>
        <Button
          variant={view === "campaigns" ? "default" : "ghost"}
          onClick={() => setView("campaigns")}
          className="rounded-b-none"
        >
          <Mail className="w-4 h-4 mr-2" />
          Campanhas
        </Button>
      </div>

      {/* Conteúdo */}
      {view === "overview" && <CrmOverview />}
      {view === "customers" && <CrmCustomersList />}
      {view === "campaigns" && <CrmCampaigns />}
    </div>
  );
}
