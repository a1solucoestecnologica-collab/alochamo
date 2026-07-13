import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClientIdentification } from "@/contexts/ClientIdentificationContext";
import { toast } from "sonner";

interface ClientIdentificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantName?: string;
}

export default function ClientIdentificationModal({
  open,
  onOpenChange,
  restaurantName = "Chamô",
}: ClientIdentificationModalProps) {
  const { setClient } = useClientIdentification();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "");
    
    // Formatar como (XX) XXXXX-XXXX
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Digite seu nome");
      return;
    }

    const phoneNumbers = phone.replace(/\D/g, "");
    if (phoneNumbers.length < 10) {
      toast.error("Digite um telefone válido");
      return;
    }

    setIsLoading(true);
    try {
      // Armazenar dados do cliente
      setClient({
        name: name.trim(),
        phone: phoneNumbers,
      });

      toast.success(`Bem-vindo, ${name}! 👋`);
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao identificar cliente");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bem-vindo ao {restaurantName}!</DialogTitle>
          <DialogDescription>
            Informe seus dados para começar a fazer seu pedido
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              type="text"
              placeholder="Seu nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={handlePhoneChange}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Seu telefone será usado para identificar seus pedidos
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Identificando..." : "Começar a Pedir"}
          </Button>

          <p className="text-xs text-center text-gray-500">
            Sem senha, sem cadastro complicado. Apenas seu nome e telefone.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
