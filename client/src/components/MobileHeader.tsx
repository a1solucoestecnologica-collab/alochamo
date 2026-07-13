import { useState } from "react";
import { MapPin, Menu, X, ShoppingCart, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useCart } from "@/contexts/CartContext";

export default function MobileHeader() {
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: user } = trpc.auth.me.useQuery();
  const { data: defaultAddress } = trpc.addresses.getDefault.useQuery(undefined, {
    enabled: !!user,
  });
  const { getItemCount } = useCart();

  return (
    <>
      {/* Header Mobile Compacto */}
      <header className="md:hidden sticky top-0 bg-white shadow-sm z-40">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo e Localização */}
          <div className="flex items-center gap-2 flex-1">
            <button onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
            
            <div className="flex flex-col">
              <h1 
                className="text-xl font-bold text-primary cursor-pointer"
                onClick={() => setLocation("/")}
              >
                Chamô
              </h1>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[180px]">
                  {defaultAddress 
                    ? `${defaultAddress.street}, ${defaultAddress.number}`
                    : "Adicionar endereço"}
                </span>
              </div>
            </div>
          </div>

          {/* Ícones de Ação */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setLocation("/notificacoes")}
            >
              <Bell className="w-5 h-5 text-gray-700" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setLocation("/carrinho")}
            >
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {getItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getItemCount()}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Menu Lateral Mobile */}
      {menuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setMenuOpen(false)}
        >
          <div 
            className="bg-white w-72 h-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-primary">Chamô</h2>
                <button onClick={() => setMenuOpen(false)}>
                  <X className="w-6 h-6 text-gray-700" />
                </button>
              </div>

              {user ? (
                <div className="mb-6 pb-6 border-b">
                  <p className="font-semibold text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.email || user.cpf}</p>
                </div>
              ) : (
                <div className="mb-6 pb-6 border-b">
                  <Button 
                    className="w-full"
                    onClick={() => {
                      setLocation("/login");
                      setMenuOpen(false);
                    }}
                  >
                    Entrar ou Cadastrar
                  </Button>
                </div>
              )}

              <nav className="space-y-4">
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                  onClick={() => {
                    setLocation("/");
                    setMenuOpen(false);
                  }}
                >
                  Início
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                  onClick={() => {
                    setLocation("/pedidos");
                    setMenuOpen(false);
                  }}
                >
                  Meus Pedidos
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                  onClick={() => {
                    setLocation("/perfil");
                    setMenuOpen(false);
                  }}
                >
                  Meu Perfil
                </button>
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
                  onClick={() => {
                    setLocation("/ajuda");
                    setMenuOpen(false);
                  }}
                >
                  Ajuda
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
