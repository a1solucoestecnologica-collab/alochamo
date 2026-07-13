import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface CategoryBarProps {
  onSelectCategory?: (categoryId: number | null) => void;
  selectedCategoryId?: number | null;
}

export default function CategoryBar({ onSelectCategory, selectedCategoryId }: CategoryBarProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const { data: categories = [] } = trpc.categories.list.useQuery();

  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById("category-scroll");
    if (container) {
      const scrollAmount = 200;
      const newPosition =
        direction === "left"
          ? Math.max(0, scrollPosition - scrollAmount)
          : scrollPosition + scrollAmount;
      container.scrollLeft = newPosition;
      setScrollPosition(newPosition);
    }
  };

  return (
    <section className="bg-black border-b border-gray-800 sticky top-16 z-40">
      <div className="container py-4">
        <div className="flex items-center gap-4">
          {/* Botão Esquerda */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("left")}
            className="text-primary hover:bg-gray-900 flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          {/* Categorias */}
          <div
            id="category-scroll"
            className="flex gap-3 overflow-x-auto scrollbar-hide flex-1"
            style={{ scrollBehavior: "smooth" }}
          >
            {/* Todos */}
            <Button
              variant={selectedCategoryId === null ? "default" : "outline"}
              className={`flex-shrink-0 ${
                selectedCategoryId === null
                  ? "bg-primary text-white hover:bg-red-700"
                  : "border-gray-700 text-gray-300 hover:bg-gray-900"
              }`}
              onClick={() => onSelectCategory?.(null)}
            >
              Todos
            </Button>

            {/* Categorias */}
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategoryId === category.id ? "default" : "outline"}
                className={`flex-shrink-0 gap-2 ${
                  selectedCategoryId === category.id
                    ? "bg-primary text-white hover:bg-red-700"
                    : "border-gray-700 text-gray-300 hover:bg-gray-900"
                }`}
                onClick={() => onSelectCategory?.(category.id)}
              >
                <span>{category.emoji}</span>
                <span>{category.name}</span>
              </Button>
            ))}
          </div>

          {/* Botão Direita */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll("right")}
            className="text-primary hover:bg-gray-900 flex-shrink-0"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
