import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, LogOut, LogIn, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Header() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const { getTotal } = useCart();
  const [address, setAddress] = useState("");

  const handleLogout = async () => {
    await logout();
  };

  const handleCartClick = () => {
    navigate("/carrinho");
  };

  return (
    <header className="bg-black text-white border-b-2 border-primary sticky top-0 z-50">
      <div className="container py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="text-2xl font-black font-serif">
              <span className="text-white">OM</span>
              <span className="text-primary ml-2">SUSHI</span>
            </div>
          </div>

          {/* Endereço */}
          <div className="hidden md:flex flex-1 max-w-xs">
            <div className="flex items-center gap-2 w-full">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <Input
                type="text"
                placeholder="Seu endereço"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 h-10"
              />
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-3">
            {/* Carrinho */}
            <button
              onClick={handleCartClick}
              className="relative p-2 hover:bg-gray-900 rounded-lg transition"
              title="Carrinho"
            >
              <ShoppingCart className="w-6 h-6 text-primary" />
              {getTotal() > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {getTotal()}
                </span>
              )}
            </button>

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300 hidden sm:inline">{user.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-primary text-primary hover:bg-primary hover:text-white"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Sair
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                className="bg-primary text-white hover:bg-red-700"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                <LogIn className="w-4 h-4 mr-1" />
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
