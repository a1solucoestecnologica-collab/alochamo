import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Image as ImageIcon, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";
import CombosManagement from "@/components/CombosManagement";

// Componente para gerenciar variações de tamanho
function VariationsManager({ itemId }: { itemId: number }) {
  const [newVariation, setNewVariation] = useState({ size: "", price: "" });
  const [editingVariation, setEditingVariation] = useState<any>(null);

  const { data: variations, refetch } = trpc.menu.variations.listByItem.useQuery({ itemId });

  const createVariation = trpc.menu.variations.create.useMutation({
    onSuccess: () => {
      toast.success("Variação adicionada!");
      refetch();
      setNewVariation({ size: "", price: "" });
    },
    onError: (error: any) => toast.error(error.message),
  });

  const updateVariation = trpc.menu.variations.update.useMutation({
    onSuccess: () => {
      toast.success("Variação atualizada!");
      refetch();
      setEditingVariation(null);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteVariation = trpc.menu.variations.delete.useMutation({
    onSuccess: () => {
      toast.success("Variação removida!");
      refetch();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const handleAddVariation = () => {
    if (!newVariation.size || !newVariation.price) {
      toast.error("Preencha tamanho e preço");
      return;
    }
    createVariation.mutate({
      itemId,
      size: newVariation.size,
      price: Math.round(parseFloat(newVariation.price) * 100),
    });
  };

  return (
    <div className="space-y-3">
      {/* Lista de variações existentes */}
      <div className="space-y-2">
        {variations?.map((variation: any) => (
          <div key={variation.id} className="flex items-center gap-2 p-2 border rounded">
            {editingVariation?.id === variation.id ? (
              <>
                <Input
                  value={editingVariation.size}
                  onChange={(e) => setEditingVariation({ ...editingVariation, size: e.target.value })}
                  placeholder="Tamanho"
                  className="w-24"
                />
                <Input
                  type="number"
                  step="0.01"
                  value={editingVariation.price}
                  onChange={(e) => setEditingVariation({ ...editingVariation, price: e.target.value })}
                  placeholder="Preço"
                  className="w-28"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    updateVariation.mutate({
                      id: editingVariation.id,
                      size: editingVariation.size,
                      price: Math.round(parseFloat(editingVariation.price) * 100),
                    });
                  }}
                >
                  Salvar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingVariation(null)}
                >
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                <span className="font-medium w-24">{variation.size}</span>
                <span className="w-28">R$ {(variation.price / 100).toFixed(2)}</span>
                <span className={`text-xs px-2 py-1 rounded ${variation.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {variation.isAvailable ? 'Disponível' : 'Indisponível'}
                </span>
                <div className="flex gap-1 ml-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingVariation({ ...variation, price: (variation.price / 100).toFixed(2) })}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateVariation.mutate({ id: variation.id, isAvailable: !variation.isAvailable })}
                    title={variation.isAvailable ? 'Desativar' : 'Ativar'}
                  >
                    {variation.isAvailable ? '❌' : '✅'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Remover esta variação?")) {
                        deleteVariation.mutate({ id: variation.id });
                      }
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Formulário para adicionar nova variação */}
      <div className="flex gap-2 items-end">
        <div className="space-y-1 flex-1">
          <Label className="text-xs">Tamanho</Label>
          <Input
            value={newVariation.size}
            onChange={(e) => setNewVariation({ ...newVariation, size: e.target.value })}
            placeholder="Ex: P, M, G"
          />
        </div>
        <div className="space-y-1 flex-1">
          <Label className="text-xs">Preço (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={newVariation.price}
            onChange={(e) => setNewVariation({ ...newVariation, price: e.target.value })}
            placeholder="0.00"
          />
        </div>
        <Button onClick={handleAddVariation} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Adicionar
        </Button>
      </div>
    </div>
  );
}

export default function MenuManagement() {
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [additionalDialogOpen, setAdditionalDialogOpen] = useState(false);
  
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingAdditional, setEditingAdditional] = useState<any>(null);
  
  // Bulk selection
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  // Sorting
  const [sortColumn, setSortColumn] = useState<'name' | 'price' | 'status' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Queries
  const { data: categories, refetch: refetchCategories } = trpc.menu.categories.list.useQuery();
  const { data: items, refetch: refetchItems } = trpc.menu.items.list.useQuery();
  const { data: additionals, refetch: refetchAdditionals } = trpc.menu.additionals.list.useQuery();

  // Mutations - Categories
  const createCategory = trpc.menu.categories.create.useMutation({
    onSuccess: () => {
      toast.success("Categoria criada com sucesso!");
      refetchCategories();
      setCategoryDialogOpen(false);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const updateCategory = trpc.menu.categories.update.useMutation({
    onSuccess: () => {
      toast.success("Categoria atualizada!");
      refetchCategories();
      setCategoryDialogOpen(false);
      setEditingCategory(null);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteCategory = trpc.menu.categories.delete.useMutation({
    onSuccess: () => {
      toast.success("Categoria removida!");
      refetchCategories();
    },
    onError: (error: any) => toast.error(error.message),
  });

  // Mutations - Items
  const createItem = trpc.menu.items.create.useMutation({
    onSuccess: () => {
      toast.success("Item criado com sucesso!");
      refetchItems();
      setItemDialogOpen(false);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const updateItem = trpc.menu.items.update.useMutation({
    onSuccess: () => {
      toast.success("Item atualizado!");
      refetchItems();
      setItemDialogOpen(false);
      setEditingItem(null);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteItem = trpc.menu.items.delete.useMutation({
    onSuccess: () => {
      toast.success("Item removido!");
      refetchItems();
    },
    onError: (error: any) => toast.error(error.message),
  });

  const duplicateItem = trpc.menu.items.duplicate.useMutation({
    onSuccess: (data) => {
      toast.success("Item duplicado com sucesso!");
      refetchItems();
      // Abrir modal de edição com o novo item
      if (data.item) {
        setEditingItem(data.item);
        setItemDialogOpen(true);
      }
    },
    onError: (error: any) => toast.error(error.message),
  });

  const bulkUpdateItems = trpc.menu.items.bulkUpdate.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} itens atualizados com sucesso!`);
      refetchItems();
      setSelectedItems([]);
      setBulkMode(false);
    },
    onError: (error: any) => toast.error(error.message),
  });

  // Mutations - Additionals
  const createAdditional = trpc.menu.additionals.create.useMutation({
    onSuccess: () => {
      toast.success("Adicional criado com sucesso!");
      refetchAdditionals();
      setAdditionalDialogOpen(false);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const updateAdditional = trpc.menu.additionals.update.useMutation({
    onSuccess: () => {
      toast.success("Adicional atualizado!");
      refetchAdditionals();
      setAdditionalDialogOpen(false);
      setEditingAdditional(null);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteAdditional = trpc.menu.additionals.delete.useMutation({
    onSuccess: () => {
      toast.success("Adicional removido!");
      refetchAdditionals();
    },
    onError: (error: any) => toast.error(error.message),
  });

  // Função para alternar ordenação
  const handleSort = (column: 'name' | 'price' | 'status') => {
    if (sortColumn === column) {
      // Se já está ordenando por essa coluna, inverte a direção
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Nova coluna, começa com ascendente
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Aplicar ordenação aos itens
  const sortedItems = React.useMemo(() => {
    if (!items || !sortColumn) return items;

    const sorted = [...items].sort((a: any, b: any) => {
      let compareA, compareB;

      switch (sortColumn) {
        case 'name':
          compareA = a.name.toLowerCase();
          compareB = b.name.toLowerCase();
          break;
        case 'price':
          compareA = a.price;
          compareB = b.price;
          break;
        case 'status':
          // Disponível (true) vem antes de Indisponível (false) em asc
          compareA = a.isAvailable ? 1 : 0;
          compareB = b.isAvailable ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [items, sortColumn, sortDirection]);

  // Ícone de ordenação
  const SortIcon = ({ column }: { column: 'name' | 'price' | 'status' }) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1" />
      : <ArrowDown className="w-4 h-4 ml-1" />;
  };

  return (
    <Tabs defaultValue="items" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="items">Itens do Cardápio</TabsTrigger>
        <TabsTrigger value="categories">Categorias</TabsTrigger>
        <TabsTrigger value="additionals">Adicionais</TabsTrigger>
        <TabsTrigger value="combos">Combos</TabsTrigger>
      </TabsList>

      {/* ITENS DO CARDÁPIO */}
      <TabsContent value="items" className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Itens do Cardápio</h3>
            <p className="text-sm text-muted-foreground">Gerencie os pratos do seu restaurante</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={bulkMode ? "default" : "outline"}
              onClick={() => {
                setBulkMode(!bulkMode);
                setSelectedItems([]);
              }}
            >
              {bulkMode ? "Cancelar Seleção" : "Selecionar Múltiplos"}
            </Button>
            <Dialog open={itemDialogOpen} onOpenChange={(open) => {
              setItemDialogOpen(open);
              if (!open) setEditingItem(null);
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Editar Item" : "Novo Item"}</DialogTitle>
                <DialogDescription>
                  {editingItem ? "Atualize as informações do item" : "Adicione um novo item ao cardápio"}
                </DialogDescription>
              </DialogHeader>
              <ItemForm
                item={editingItem}
                categories={categories || []}
                onSubmit={(data: any) => {
                  if (editingItem) {
                    updateItem.mutate({ id: editingItem.id, ...data });
                  } else {
                    createItem.mutate(data);
                  }
                }}
                onCancel={() => {
                  setItemDialogOpen(false);
                  setEditingItem(null);
                }}
              />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Barra de ações em massa */}
        {bulkMode && selectedItems.length > 0 && (
          <Card className="p-4 bg-purple-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-semibold">{selectedItems.length} {selectedItems.length === 1 ? 'item selecionado' : 'itens selecionados'}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (items) {
                      const allIds = items.map((item: any) => item.id);
                      setSelectedItems(allIds);
                    }
                  }}
                >
                  Selecionar Todos
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedItems([])}
                >
                  Limpar Seleção
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => bulkUpdateItems.mutate({ ids: selectedItems, isAvailable: true })}
                >
                  Marcar Disponível
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => bulkUpdateItems.mutate({ ids: selectedItems, isAvailable: false })}
                >
                  Marcar Indisponível
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Tabela de Itens */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  {bulkMode && (
                    <th className="p-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={items && selectedItems.length === items.length}
                        onChange={(e) => {
                          if (e.target.checked && items) {
                            setSelectedItems(items.map((item: any) => item.id));
                          } else {
                            setSelectedItems([]);
                          }
                        }}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="p-3 text-left w-20">Imagem</th>
                  <th className="p-3 text-left">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center hover:text-primary transition-colors font-semibold"
                    >
                      Nome
                      <SortIcon column="name" />
                    </button>
                  </th>
                  <th className="p-3 text-left hidden md:table-cell">Categoria</th>
                  <th className="p-3 text-left">
                    <button
                      onClick={() => handleSort('price')}
                      className="flex items-center hover:text-primary transition-colors font-semibold"
                    >
                      Preço
                      <SortIcon column="price" />
                    </button>
                  </th>
                  <th className="p-3 text-left">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center hover:text-primary transition-colors font-semibold"
                    >
                      Status
                      <SortIcon column="status" />
                    </button>
                  </th>
                  <th className="p-3 text-right w-40">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedItems?.map((item: any) => {
                  const category = categories?.find((c: any) => c.id === item.categoryId);
                  return (
                    <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                      {bulkMode && (
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems([...selectedItems, item.id]);
                              } else {
                                setSelectedItems(selectedItems.filter(id => id !== item.id));
                              }
                            }}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="p-3">
                        <div className="w-14 h-14 bg-muted rounded-md overflow-hidden flex items-center justify-center">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">{item.description}</div>
                        </div>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">{category?.name || '-'}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-primary">R$ {(item.price / 100).toFixed(2)}</span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => {
                            updateItem.mutate({ id: item.id, isAvailable: !item.isAvailable });
                          }}
                          className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${
                            item.isAvailable 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {item.isAvailable ? 'Disponível' : 'Indisponível'}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingItem(item);
                              setItemDialogOpen(true);
                            }}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => duplicateItem.mutate({ id: item.id })}
                            title="Duplicar"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Tem certeza que deseja remover este item?")) {
                                deleteItem.mutate({ id: item.id });
                              }
                            }}
                            title="Excluir"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {(!sortedItems || sortedItems.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum item cadastrado. Clique em "Novo Item" para começar.
            </div>
          )}
        </div>
      </TabsContent>

      {/* CATEGORIAS */}
      <TabsContent value="categories" className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Categorias do Cardápio</h3>
            <p className="text-sm text-muted-foreground">Organize seu cardápio em seções</p>
          </div>
          <Dialog open={categoryDialogOpen} onOpenChange={(open) => {
            setCategoryDialogOpen(open);
            if (!open) setEditingCategory(null);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
                <DialogDescription>
                  {editingCategory ? "Atualize as informações da categoria" : "Crie uma nova categoria para organizar seu cardápio"}
                </DialogDescription>
              </DialogHeader>
              <CategoryForm
                category={editingCategory}
                onSubmit={(data: any) => {
                  if (editingCategory) {
                    updateCategory.mutate({ id: editingCategory.id, ...data });
                  } else {
                    createCategory.mutate(data);
                  }
                }}
                onCancel={() => {
                  setCategoryDialogOpen(false);
                  setEditingCategory(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabela de Categorias */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left">Nome</th>
                  <th className="p-3 text-left hidden md:table-cell">Descrição</th>
                  <th className="p-3 text-left">Nº Itens</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-right w-32">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {categories?.map((category: any) => {
                  const itemCount = items?.filter((item: any) => item.categoryId === category.id).length || 0;
                  return (
                    <tr key={category.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-3">
                        <div className="font-medium">{category.name}</div>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <div className="text-sm text-muted-foreground max-w-md truncate">
                          {category.description || '-'}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{itemCount}</span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => {
                            updateCategory.mutate({ 
                              id: category.id, 
                              isActive: !category.isActive 
                            });
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            category.isActive
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {category.isActive ? 'Ativa' : 'Inativa'}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingCategory(category);
                              setCategoryDialogOpen(true);
                            }}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (itemCount > 0) {
                                if (!confirm(`Esta categoria tem ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}. Os itens não serão removidos. Deseja continuar?`)) {
                                  return;
                                }
                              }
                              if (confirm("Tem certeza que deseja remover esta categoria?")) {
                                deleteCategory.mutate({ id: category.id });
                              }
                            }}
                            title="Excluir"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {(!categories || categories.length === 0) && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Nenhuma categoria cadastrada. Clique em "Nova Categoria" para começar.
            </div>
          )}
        </div>
      </TabsContent>

      {/* ADICIONAIS */}
      <TabsContent value="additionals" className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Adicionais</h3>
            <p className="text-sm text-muted-foreground">Complementos que podem ser adicionados aos pratos</p>
          </div>
          <Dialog open={additionalDialogOpen} onOpenChange={(open) => {
            setAdditionalDialogOpen(open);
            if (!open) setEditingAdditional(null);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Adicional
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingAdditional ? "Editar Adicional" : "Novo Adicional"}</DialogTitle>
                <DialogDescription>
                  {editingAdditional ? "Atualize as informações do adicional" : "Crie um novo adicional para seus pratos"}
                </DialogDescription>
              </DialogHeader>
              <AdditionalForm
                additional={editingAdditional}
                onSubmit={(data: any) => {
                  if (editingAdditional) {
                    updateAdditional.mutate({ id: editingAdditional.id, ...data });
                  } else {
                    createAdditional.mutate(data);
                  }
                }}
                onCancel={() => {
                  setAdditionalDialogOpen(false);
                  setEditingAdditional(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabela de Adicionais */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left">Nome</th>
                  <th className="p-3 text-left">Preço</th>
                  <th className="p-3 text-right w-32">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {additionals?.map((additional: any) => (
                  <tr key={additional.id} className="hover:bg-muted/50 transition-colors">
                    <td className="p-3">
                      <div className="font-medium">{additional.name}</div>
                    </td>
                    <td className="p-3">
                      <span className="text-primary font-semibold">+ R$ {(additional.price / 100).toFixed(2)}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingAdditional(additional);
                            setAdditionalDialogOpen(true);
                          }}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Tem certeza que deseja remover este adicional?")) {
                              deleteAdditional.mutate({ id: additional.id });
                            }
                          }}
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
          {(!additionals || additionals.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum adicional cadastrado. Clique em "Novo Adicional" para começar.
            </div>
          )}
        </div>
      </TabsContent>

      {/* COMBOS */}
      <TabsContent value="combos">
        <CombosManagement />
      </TabsContent>
    </Tabs>
  );
}

// Formulário de Categoria
function CategoryForm({ category, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || "",
    order: category?.order || 0,
    isActive: category?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Ex: Sushis, Bebidas, Sobremesas"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descrição opcional da categoria"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="order">Ordem de Exibição</Label>
        <Input
          id="order"
          type="number"
          value={formData.order}
          onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
          placeholder="0"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="rounded"
        />
        <Label htmlFor="isActive" className="cursor-pointer">Categoria ativa</Label>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" className="flex-1">
          {category ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}

// Formulário de Item
function ItemForm({ item, categories, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    categoryId: item?.categoryId || "",
    name: item?.name || "",
    description: item?.description || "",
    price: item?.price ? (item.price / 100).toFixed(2) : "",
    imageUrl: item?.imageUrl || "",
    isAvailable: item?.isAvailable ?? true,
    isFeatured: item?.isFeatured ?? false,
    preparationTime: item?.preparationTime || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      categoryId: parseInt(formData.categoryId),
      name: formData.name,
      description: formData.description,
      price: Math.round(parseFloat(formData.price) * 100),
      imageUrl: formData.imageUrl || undefined,
      isAvailable: formData.isAvailable,
      isFeatured: formData.isFeatured,
      preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="categoryId">Categoria *</Label>
        <Select
          value={formData.categoryId.toString()}
          onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat: any) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Ex: Sushi de Salmão"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descreva o prato"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Preço (R$) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
            placeholder="35.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="preparationTime">Tempo de Preparo (min)</Label>
          <Input
            id="preparationTime"
            type="number"
            min="0"
            value={formData.preparationTime}
            onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
            placeholder="20"
          />
        </div>
      </div>

      <ImageUpload
        label="Foto do Prato"
        value={formData.imageUrl}
        onChange={(url) => setFormData({ ...formData, imageUrl: url })}
        maxSizeMB={5}
      />

      {item?.id && (
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Variações de Tamanho</h4>
              <p className="text-sm text-muted-foreground">Adicione opções de tamanho (P/M/G) com preços diferentes</p>
            </div>
          </div>
          <VariationsManager itemId={item.id} />
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isAvailable"
            checked={formData.isAvailable}
            onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="isAvailable" className="cursor-pointer">Disponível</Label>
        </div>

        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id="isFeatured"
            checked={formData.isFeatured}
            onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
            className="mt-1 rounded"
          />
          <div className="space-y-1">
            <Label htmlFor="isFeatured" className="cursor-pointer">{"Aparecer em promo\u00e7\u00f5es e mais pedidos"}</Label>
            <p className="text-xs text-muted-foreground">Controla as vitrines principais do site do restaurante.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" className="flex-1">
          {item ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}

// Formulário de Adicional
function AdditionalForm({ additional, onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    name: additional?.name || "",
    price: additional?.price ? (additional.price / 100).toFixed(2) : "",
    isAvailable: additional?.isAvailable ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      price: Math.round(parseFloat(formData.price) * 100),
      isAvailable: formData.isAvailable,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Ex: Queijo Extra, Bacon"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Preço (R$) *</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          min="0"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          required
          placeholder="3.00"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isAvailable"
          checked={formData.isAvailable}
          onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
          className="rounded"
        />
        <Label htmlFor="isAvailable" className="cursor-pointer">Disponível</Label>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" className="flex-1">
          {additional ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}
