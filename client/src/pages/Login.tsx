import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Utensils } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const loginEmailMutation = trpc.auth.loginEmail.useMutation();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await loginEmailMutation.mutateAsync({ email, password });

      if (result.success) {
        toast.success("Login realizado com sucesso!");

        setTimeout(() => {
          if (result.user?.userType === "restaurante") {
            window.location.href = "/painel-restaurante";
          } else {
            window.location.href = "/";
          }
        }, 500);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
              <Utensils className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-primary">ALOCHAMO</CardTitle>
          <CardDescription>Acesse sua conta para administrar sua loja</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <strong className="block">Acesso do restaurante</strong>
              <span className="text-muted-foreground">
                Login exclusivo para donos e equipes acompanharem pedidos, cardapio, clientes e configuracoes.
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-rest">E-mail</Label>
              <Input
                id="email-rest"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password-rest">Senha</Label>
              <Input
                id="password-rest"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar na minha conta"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/cadastro-restaurante")}
            >
              Cadastrar meu restaurante
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
