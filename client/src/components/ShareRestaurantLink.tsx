import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy, MessageCircle, QrCode } from "lucide-react";
import { toast } from "sonner";

interface ShareRestaurantLinkProps {
  restaurantSlug: string;
  restaurantName: string;
}

export default function ShareRestaurantLink({
  restaurantSlug,
  restaurantName,
}: ShareRestaurantLinkProps) {
  const baseUrl = window.location.origin;
  const shareLink = `${baseUrl}/loja/${restaurantSlug}/catalogo`;
  const whatsappMessage = `Peça seu delivery no ${restaurantName}! ${shareLink}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copiado para a área de transferência!");
  };

  const handleShareWhatsApp = () => {
    window.open(whatsappUrl, "_blank");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Compartilhe seu Restaurante
        </CardTitle>
        <CardDescription>
          Envie este link para seus clientes via WhatsApp, redes sociais ou qualquer lugar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Link do seu catalogo</label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={shareLink}
              readOnly
              className="bg-gray-50"
            />
            <Button
              onClick={handleCopyLink}
              variant="outline"
              size="icon"
              title="Copiar link"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Clientes podem acessar seu catalogo direto pelo navegador
          </p>
        </div>

        {/* WhatsApp Button */}
        <div>
          <Button
            onClick={handleShareWhatsApp}
            className="w-full bg-green-600 hover:bg-green-700 gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Compartilhar no WhatsApp
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Clique para abrir WhatsApp e enviar o link para seus clientes
          </p>
        </div>

        {/* QR Code Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <QrCode className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Dica: Use QR Codes</p>
              <p className="text-blue-700 mt-1">
                Você pode gerar um QR Code deste link e colocar nas mesas do seu restaurante para que os clientes escaneiem com a câmera do celular.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
