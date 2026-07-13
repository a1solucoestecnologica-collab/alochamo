import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "./ImageUpload";

interface ComboFormData {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  items: { itemId: number; quantity: number }[];
}

export default function CombosManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<any>(null);
  const [formData, setFormData] = useState<ComboFormData>({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    items: [],
  });
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  const utils = trpc.useUtils();
  const { data: combos, isLoading: loadingCombos } = trpc.combos.list.useQuery();
  const { data: menuItems } = trpc.menu.items.list.useQuery();

  const createCombo = trpc.combos.create.useMutation({
    onSuccess: () => {
      toast.success("Combo criado com sucesso!");
      utils.combos.list.invalidate();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Erro ao criar combo: ${error.message}`);
    },
  });

  const updateCombo = trpc.combos.update.useMutation({
    onSuccess: () => {
      toast.success("Combo atualizado com sucesso!");
      utils.combos.list.invalidate();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar combo: ${error.message}`);
    },
  });

  const deleteCombo = trpc.combos.delete.useMutation({
    onSuccess: () => {
      toast.success("Combo deletado com sucesso!");
      utils.combos.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao deletar combo: ${error.message}`);
    },
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingCombo(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      items: [],
    });
    setSelectedItems(new Set());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      toast.error("Nome e preço são obrigatórios");
      return;
    }

    if (formData.items.length === 0) {
      toast.error("Adicione pelo menos um item ao combo");
      return;
    }

    const priceInCents = Math.round(parseFloat(formData.price) * 100);

    if (editingCombo) {
      updateCombo.mutate({
        id: editingCombo.id,
        name: formData.name,
        description: formData.description || undefined,
        price: priceInCents,
        imageUrl: formData.imageUrl || undefined,
      });
    } else {
      createCombo.mutate({
        name: formData.name,
        description: formData.description || undefined,
        price: priceInCents,
        imageUrl: formData.imageUrl || undefined,
        items: formData.items,
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja deletar este combo?")) {
      deleteCombo.mutate({ id });
    }
  };

  const handleEdit = (combo: any) => {
    setEditingCombo(combo);
    setFormData({
      name: combo.name,
      description: combo.description || "",
      price: (combo.price / 100).toFixed(2),
      imageUrl: combo.imageUrl || "",
      items: [], // Carregar itens do combo se necessário
    });
    setIsDialogOpen(true);
  };

  const toggleItemSelection = (itemId: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
      setFormData({
        ...formData,
        items: formData.items.filter((i) => i.itemId !== itemId),
      });
    } else {
      newSelected.add(itemId);
      setFormData({
        ...formData,
        items: [...formData.items, { itemId, quantity: 1 }],
      });
    }
    setSelectedItems(newSelected);
  };

  const updateItemQuantity = (itemId: number, quantity: number) => {
    setFormData({
      ...formData,
      items: formData.items.map((item) =>
        item.itemId === itemId ? { ...item, quantity } : item
      ),
    });
  };

  if (loadingCombos) {
    return <div className="p-6">Carregando combos...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Combos Promocionais</h2>
          <p className="text-muted-foreground">
            Agrupe itens em pacotes com preços especiais
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Combo
        </Button>
      </div>

      {/* Tabela de Combos */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left w-20">Imagem</th>
                <th className="p-3 text-left">Nome</th>
                <th className="p-3 text-left hidden md:table-cell">Descrição</th>
                <th className="p-3 text-left">Preço</th>
                <th className="p-3 text-right w-32">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {combos?.map((combo) => (
                <tr key={combo.id} className="hover:bg-muted/50 transition-colors">
                  <td className="p-3">
                    {combo.imageUrl ? (
                      <img
                        src={combo.imageUrl}
                        alt={combo.name}
                        className="w-14 h-14 object-cover rounded"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-muted rounded flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{combo.name}</div>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <div className="text-sm text-muted-foreground max-w-md truncate">
                      {combo.description || '-'}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-primary font-semibold">R$ {(combo.price / 100).toFixed(2)}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(combo)}
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(combo.id)}
                        title="Excluir"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!combos || combos.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum combo cadastrado. Clique em "Novo Combo" para começar.
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCombo ? "Editar Combo" : "Novo Combo"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Combo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Combo Executivo"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descreva o combo..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label>Foto do Combo</Label>
              <ImageUpload
                value={formData.imageUrl}
                onChange={(url: string) =>
                  setFormData({ ...formData, imageUrl: url })
                }
              />
            </div>

            {!editingCombo && (
              <div>
                <Label>Itens do Combo *</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Selecione os itens que fazem parte deste combo
                </p>
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                  {menuItems?.map((item) => {
                    const isSelected = selectedItems.has(item.id);
                    const comboItem = formData.items.find(
                      (i) => i.itemId === item.id
                    );

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleItemSelection(item.id)}
                          />
                          <span>{item.name}</span>
                          <span className="text-sm text-muted-foreground">
                            (R$ {(item.price / 100).toFixed(2)})
                          </span>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Qtd:</Label>
                            <Input
                              type="number"
                              min="1"
                              value={comboItem?.quantity || 1}
                              onChange={(e) =>
                                updateItemQuantity(
                                  item.id,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-20"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingCombo ? "Atualizar" : "Criar"} Combo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
