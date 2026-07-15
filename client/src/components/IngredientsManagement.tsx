import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const units = ["g", "kg", "ml", "l", "un"];

function toAmount(value: string | number) {
  return Math.round(Number(value || 0) * 1000);
}

function fromAmount(value?: number | null) {
  return ((value || 0) / 1000).toString();
}

function moneyToCents(value: string | number) {
  return Math.round(Number(value || 0) * 100);
}

function formatMoney(cents?: number | null) {
  return `R$ ${((cents || 0) / 100).toFixed(2)}`;
}

function unitCost(ingredient: any) {
  const yieldFactor = Math.max(1, Number(ingredient.yieldPercent || 100)) / 100;
  const wasteFactor = Math.max(0, 100 - Number(ingredient.wastePercent || 0)) / 100;
  const usableQuantity = Math.max(1, Number(ingredient.packageQuantity || 0) * yieldFactor * wasteFactor);
  return Number(ingredient.packageCost || 0) / usableQuantity;
}

function IngredientForm({ ingredient, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    name: ingredient?.name || "",
    supplier: ingredient?.supplier || "",
    unit: ingredient?.unit || "g",
    packageQuantity: fromAmount(ingredient?.packageQuantity || 1000),
    packageCost: ingredient?.packageCost ? (ingredient.packageCost / 100).toFixed(2) : "",
    yieldPercent: ingredient?.yieldPercent?.toString() || "100",
    wastePercent: ingredient?.wastePercent?.toString() || "0",
    currentStockQuantity: fromAmount(ingredient?.currentStockQuantity || 0),
    minStockQuantity: fromAmount(ingredient?.minStockQuantity || 0),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      name: formData.name,
      supplier: formData.supplier || undefined,
      unit: formData.unit,
      packageQuantity: toAmount(formData.packageQuantity),
      packageCost: moneyToCents(formData.packageCost),
      yieldPercent: parseInt(formData.yieldPercent || "100", 10),
      wastePercent: parseInt(formData.wastePercent || "0", 10),
      currentStockQuantity: toAmount(formData.currentStockQuantity),
      minStockQuantity: toAmount(formData.minStockQuantity),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ingredient-name">Ingrediente *</Label>
          <Input
            id="ingredient-name"
            value={formData.name}
            onChange={(event) => setFormData({ ...formData, name: event.target.value })}
            required
            placeholder="Ex: Peito de frango"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ingredient-supplier">Fornecedor</Label>
          <Input
            id="ingredient-supplier"
            value={formData.supplier}
            onChange={(event) => setFormData({ ...formData, supplier: event.target.value })}
            placeholder="Ex: Distribuidora A1"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Unidade</Label>
          <Select value={formData.unit} onValueChange={(unit) => setFormData({ ...formData, unit })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {units.map((unit) => (
                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="package-quantity">Quantidade comprada *</Label>
          <Input
            id="package-quantity"
            type="number"
            step="0.001"
            min="0"
            value={formData.packageQuantity}
            onChange={(event) => setFormData({ ...formData, packageQuantity: event.target.value })}
            required
            placeholder="1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="package-cost">Custo da compra (R$) *</Label>
          <Input
            id="package-cost"
            type="number"
            step="0.01"
            min="0"
            value={formData.packageCost}
            onChange={(event) => setFormData({ ...formData, packageCost: event.target.value })}
            required
            placeholder="25.00"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="yield-percent">Rendimento (%)</Label>
          <Input
            id="yield-percent"
            type="number"
            min="1"
            max="100"
            value={formData.yieldPercent}
            onChange={(event) => setFormData({ ...formData, yieldPercent: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="waste-percent">Perda (%)</Label>
          <Input
            id="waste-percent"
            type="number"
            min="0"
            max="100"
            value={formData.wastePercent}
            onChange={(event) => setFormData({ ...formData, wastePercent: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="current-stock">Estoque atual</Label>
          <Input
            id="current-stock"
            type="number"
            step="0.001"
            min="0"
            value={formData.currentStockQuantity}
            onChange={(event) => setFormData({ ...formData, currentStockQuantity: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="min-stock">Estoque minimo</Label>
          <Input
            id="min-stock"
            type="number"
            step="0.001"
            min="0"
            value={formData.minStockQuantity}
            onChange={(event) => setFormData({ ...formData, minStockQuantity: event.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" className="flex-1">{ingredient ? "Atualizar" : "Cadastrar"}</Button>
      </div>
    </form>
  );
}

export default function IngredientsManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<any>(null);
  const { data: ingredients, refetch } = trpc.menu.ingredients.list.useQuery();

  const createIngredient = trpc.menu.ingredients.create.useMutation({
    onSuccess: () => {
      toast.success("Ingrediente cadastrado!");
      refetch();
      setDialogOpen(false);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const updateIngredient = trpc.menu.ingredients.update.useMutation({
    onSuccess: () => {
      toast.success("Ingrediente atualizado!");
      refetch();
      setDialogOpen(false);
      setEditingIngredient(null);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteIngredient = trpc.menu.ingredients.delete.useMutation({
    onSuccess: () => {
      toast.success("Ingrediente removido!");
      refetch();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const totalStockCost = (ingredients || []).reduce((sum: number, ingredient: any) => {
    return sum + Math.round(unitCost(ingredient) * Number(ingredient.currentStockQuantity || 0));
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Ingredientes e insumos</h3>
          <p className="text-sm text-muted-foreground">Base de custo para ficha tecnica, margem e precificacao.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingIngredient(null);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo ingrediente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingIngredient ? "Editar ingrediente" : "Novo ingrediente"}</DialogTitle>
              <DialogDescription>
                Informe quanto voce compra, quanto paga e o rendimento real desse insumo.
              </DialogDescription>
            </DialogHeader>
            <IngredientForm
              ingredient={editingIngredient}
              onSubmit={(data: any) => {
                if (editingIngredient) {
                  updateIngredient.mutate({ id: editingIngredient.id, ...data });
                } else {
                  createIngredient.mutate(data);
                }
              }}
              onCancel={() => {
                setDialogOpen(false);
                setEditingIngredient(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Insumos ativos</CardDescription>
            <CardTitle>{ingredients?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Valor estimado em estoque</CardDescription>
            <CardTitle>{formatMoney(totalStockCost)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Modo de custo</CardDescription>
            <CardTitle className="text-base">Compra + rendimento + perda</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left">Ingrediente</th>
                  <th className="p-3 text-left">Compra</th>
                  <th className="p-3 text-left">Custo unitario</th>
                  <th className="p-3 text-left">Estoque</th>
                  <th className="p-3 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ingredients?.map((ingredient: any) => {
                  const lowStock = Number(ingredient.minStockQuantity || 0) > 0
                    && Number(ingredient.currentStockQuantity || 0) <= Number(ingredient.minStockQuantity || 0);
                  return (
                    <tr key={ingredient.id} className="hover:bg-muted/50">
                      <td className="p-3">
                        <div className="font-medium">{ingredient.name}</div>
                        <div className="text-xs text-muted-foreground">{ingredient.supplier || "Sem fornecedor"}</div>
                      </td>
                      <td className="p-3 text-sm">
                        {fromAmount(ingredient.packageQuantity)} {ingredient.unit} por {formatMoney(ingredient.packageCost)}
                      </td>
                      <td className="p-3 text-sm font-medium">
                        {formatMoney(unitCost(ingredient) * 1000)} / {ingredient.unit}
                      </td>
                      <td className="p-3">
                        <span className={lowStock ? "text-destructive font-semibold" : "text-muted-foreground"}>
                          {fromAmount(ingredient.currentStockQuantity)} {ingredient.unit}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingIngredient(ingredient);
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm("Remover este ingrediente? As fichas tecnicas antigas deixam de usar este insumo.")) {
                                deleteIngredient.mutate({ id: ingredient.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {(!ingredients || ingredients.length === 0) && (
            <div className="py-12 text-center text-muted-foreground">
              Nenhum ingrediente cadastrado. Cadastre os insumos antes de montar a ficha tecnica dos produtos.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
