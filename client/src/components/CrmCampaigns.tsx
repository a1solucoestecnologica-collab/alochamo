import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { Plus, Mail, Calendar } from "lucide-react";

export default function CrmCampaigns() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [messageText, setMessageText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [targetSegment, setTargetSegment] = useState<"ALL" | "NEW" | "RECURRING" | "INACTIVE" | "VIP">("ALL");

  const { data: campaigns, isLoading, refetch } = trpc.restaurant.crm.campaigns.list.useQuery();
  const createMutation = trpc.restaurant.crm.campaigns.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Campanha criada",
        description: "A campanha foi criada com sucesso.",
      });
      setIsDialogOpen(false);
      setTitle("");
      setMessageText("");
      setImageUrl("");
      setTargetSegment("ALL");
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar campanha",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title,
      messageText,
      imageUrl: imageUrl || undefined,
      targetSegment,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campanhas</h1>
          <p className="text-muted-foreground">Crie e gerencie campanhas de marketing</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Campanha</DialogTitle>
              <DialogDescription>
                Crie uma nova campanha de marketing para seus clientes
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Promoção de Verão"
                  required
                />
              </div>
              <div>
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Digite a mensagem da campanha..."
                  rows={5}
                  required
                />
              </div>
              <div>
                <Label htmlFor="imageUrl">URL da Imagem (opcional)</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
              <div>
                <Label htmlFor="segment">Segmento Alvo</Label>
                <Select value={targetSegment} onValueChange={(v: any) => setTargetSegment(v)}>
                  <SelectTrigger id="segment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos os Clientes</SelectItem>
                    <SelectItem value="NEW">Novos Clientes</SelectItem>
                    <SelectItem value="RECURRING">Clientes Recorrentes</SelectItem>
                    <SelectItem value="INACTIVE">Clientes Inativos</SelectItem>
                    <SelectItem value="VIP">Clientes VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar Campanha"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Campanhas */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : !campaigns || campaigns.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma campanha criada ainda</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Campanha
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{campaign.title}</CardTitle>
                    <CardDescription className="mt-2">{campaign.messageText}</CardDescription>
                  </div>
                  <Badge
                    variant={campaign.sentAt ? "default" : "secondary"}
                    className="ml-2"
                  >
                    {campaign.sentAt ? "Enviada" : "Rascunho"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {campaign.imageUrl && (
                  <img
                    src={campaign.imageUrl}
                    alt={campaign.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(campaign.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <span>
                    Segmento:{" "}
                    {campaign.targetSegment === "ALL"
                      ? "Todos"
                      : campaign.targetSegment === "NEW"
                      ? "Novos"
                      : campaign.targetSegment === "RECURRING"
                      ? "Recorrentes"
                      : campaign.targetSegment === "INACTIVE"
                      ? "Inativos"
                      : "VIP"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
