import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "@/contexts/CartContext";
import { ClientIdentificationProvider } from "@/contexts/ClientIdentificationContext";

// Páginas
import Landing from "./pages/Landing";
import RestaurantsList from "./pages/RestaurantsList";
import Login from "./pages/Login";
import RegisterClient from "./pages/RegisterClient";
import RegisterRestaurant from "./pages/RegisterRestaurant";
import Restaurant from "./pages/Restaurant";
import Search from "./pages/Search";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import PersonalData from "./pages/PersonalData";
import Addresses from "./pages/Addresses";
import Favorites from "./pages/Favorites";
import Settings from "./pages/Settings";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import CrmCustomerDetail from "./components/CrmCustomerDetail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/restaurantes" component={RestaurantsList} />
      <Route path="/login" component={Login} />
      <Route path="/cadastro-cliente" component={RegisterClient} />
      <Route path="/cadastro-restaurante" component={RegisterRestaurant} />
      <Route path="/busca" component={Search} />
      <Route path="/carrinho" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/pedidos" component={Orders} />
        <Route path="/perfil" component={Profile} />
      <Route path="/perfil/dados-pessoais" component={PersonalData} />
      <Route path="/perfil/enderecos" component={Addresses} />
      <Route path="/perfil/favoritos" component={Favorites} />
      <Route path="/perfil/configuracoes" component={Settings} />
      <Route path="/painel-restaurante" component={RestaurantDashboard} />
      <Route path="/painel-restaurante/crm/clientes/:id" component={CrmCustomerDetail} />
        <Route path="/admin" component={AdminDashboard} />
      <Route path="/restaurante/:slug" component={Restaurant} />
      <Route path="/r/:slug" component={Restaurant} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <CartProvider>
          <ClientIdentificationProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </ClientIdentificationProvider>
        </CartProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
