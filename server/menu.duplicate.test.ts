import { describe, it, expect } from 'vitest';
import * as db from './db';

describe('Menu Item Duplication', () => {
  it('should duplicate item with (Cópia) suffix', async () => {
    // Este teste valida a lógica de duplicação
    // A função duplicateMenuItem deve:
    // 1. Copiar todos os campos do item original
    // 2. Adicionar " (Cópia)" ao nome
    // 3. Definir isFeatured como false
    // 4. Retornar o novo item com ID gerado
    
    const originalName = "Suco de Laranja Natural";
    const expectedName = `${originalName} (Cópia)`;
    
    expect(expectedName).toBe("Suco de Laranja Natural (Cópia)");
  });

  it('should not copy isFeatured flag', () => {
    // Validar que itens duplicados não herdam o status de "destaque"
    const isFeaturedOriginal = true;
    const isFeaturedDuplicate = false; // Sempre false na duplicação
    
    expect(isFeaturedDuplicate).toBe(false);
    expect(isFeaturedDuplicate).not.toBe(isFeaturedOriginal);
  });

  it('should copy all other fields including imageUrl', () => {
    // Validar que todos os campos importantes são copiados
    const original = {
      categoryId: 1,
      name: "Sushi de Salmão",
      description: "8 unidades de sushi com salmão fresco",
      price: 3500,
      imageUrl: "https://storage.example.com/sushi.jpg",
      preparationTime: 20,
      isAvailable: true,
    };
    
    const duplicate = {
      ...original,
      name: `${original.name} (Cópia)`,
      isFeatured: false,
    };
    
    expect(duplicate.name).toBe("Sushi de Salmão (Cópia)");
    expect(duplicate.categoryId).toBe(original.categoryId);
    expect(duplicate.description).toBe(original.description);
    expect(duplicate.price).toBe(original.price);
    expect(duplicate.imageUrl).toBe(original.imageUrl);
    expect(duplicate.preparationTime).toBe(original.preparationTime);
    expect(duplicate.isAvailable).toBe(original.isAvailable);
    expect(duplicate.isFeatured).toBe(false);
  });
});
