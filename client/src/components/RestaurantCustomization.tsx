import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import ImageUpload from "./ImageUpload";
import { Palette, Image as ImageIcon, FileText } from "lucide-react";

export default function RestaurantCustomization() {
  const { data: restaurant, isLoading } = trpc.restaurants.getMine.useQuery();
  const updateRestaurant = trpc.restaurants.update.useMutation({
    onSuccess: () => {
      toast.success("Personalização salva com sucesso!");
      utils.restaurants.getMine.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });

  const utils = trpc.useUtils();

  const [formData, setFormData] = useState({
    logoUrl: "",
    coverUrl: "",
    primaryColor: "#7c3aed",
    bio: "",
  });

  useEffect(() => {
    if (restaurant) {
      setFormData({
        logoUrl: restaurant.logoUrl || "",
        coverUrl: restaurant.coverUrl || "",
        primaryColor: restaurant.primaryColor || "#7c3aed",
        bio: restaurant.bio || "",
      });
    }
  }, [restaurant]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRestaurant.mutate(formData);
  };

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Personalização</h2>
        <p className="text-muted-foreground">
          Configure a aparência da sua página no Chamô
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Logo do Restaurante
            </CardTitle>
            <CardDescription>
              Imagem que aparece no topo da sua página e nos resultados de busca
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload
              value={formData.logoUrl}
              onChange={(url) => setFormData({ ...formData, logoUrl: url })}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Recomendado: 200x200px, formato quadrado
            </p>
          </CardContent>
        </Card>

        {/* Capa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Foto de Capa
            </CardTitle>
            <CardDescription>
              Banner grande que aparece no topo da sua página
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload
              value={formData.coverUrl}
              onChange={(url) => setFormData({ ...formData, coverUrl: url })}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Recomendado: 1200x400px, formato horizontal
            </p>
          </CardContent>
        </Card>

        {/* Cor Primária */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Cor Primária
            </CardTitle>
            <CardDescription>
              Cor principal da sua marca, usada em botões e destaques
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Input
                type="color"
                value={formData.primaryColor}
                onChange={(e) =>
                  setFormData({ ...formData, primaryColor: e.target.value })
                }
                className="w-20 h-12 cursor-pointer"
              />
              <Input
                type="text"
                value={formData.primaryColor}
                onChange={(e) =>
                  setFormData({ ...formData, primaryColor: e.target.value })
                }
                placeholder="#7c3aed"
                className="flex-1"
              />
            </div>
            <div className="mt-4 p-4 rounded-lg border" style={{ backgroundColor: formData.primaryColor }}>
              <p className="text-white font-semibold">Prévia da cor primária</p>
            </div>
          </CardContent>
        </Card>

        {/* Bio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Sobre o Restaurante
            </CardTitle>
            <CardDescription>
              Conte a história do seu restaurante, especialidades e diferenciais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              placeholder="Ex: Somos especializados em culinária japonesa autêntica, com mais de 15 anos de experiência. Nossos pratos são preparados com ingredientes frescos e selecionados..."
              rows={5}
            />
          </CardContent>
        </Card>



        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (restaurant) {
              setFormData({
                logoUrl: restaurant.logoUrl || "",
                coverUrl: restaurant.coverUrl || "",
                primaryColor: restaurant.primaryColor || "#7c3aed",
                bio: restaurant.bio || "",
              });
              }
            }}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={updateRestaurant.isPending}>
            {updateRestaurant.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}
