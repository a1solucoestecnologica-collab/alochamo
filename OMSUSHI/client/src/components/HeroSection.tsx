import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowRight, Clock, Users, Star } from "lucide-react";

export default function HeroSection() {
  const [, navigate] = useLocation();

  return (
    <section className="bg-gradient-to-br from-black via-black to-gray-900 text-white py-16 md:py-24">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Conteúdo */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-black font-serif leading-tight">
                <span className="text-primary">Sushi</span> Premium
                <br />
                na sua porta
              </h1>
              <p className="text-xl text-gray-300">
                Experiência autêntica de sushi japonês, preparado com ingredientes selecionados e entregue quente na sua casa.
              </p>
            </div>

            <Button
              size="lg"
              className="bg-primary text-white hover:bg-red-700 w-full sm:w-auto"
              onClick={() => navigate("/catalogo")}
            >
              Explorar Cardápio
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900 border-2 border-primary rounded-lg p-6 text-center">
              <div className="flex justify-center mb-3">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-black font-serif text-primary">30-60</div>
              <div className="text-sm text-gray-400 mt-2">Minutos de Entrega</div>
            </div>

            <div className="bg-gray-900 border-2 border-primary rounded-lg p-6 text-center">
              <div className="flex justify-center mb-3">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-black font-serif text-primary">2.5K+</div>
              <div className="text-sm text-gray-400 mt-2">Pedidos Realizados</div>
            </div>

            <div className="bg-gray-900 border-2 border-primary rounded-lg p-6 text-center">
              <div className="flex justify-center mb-3">
                <Star className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-black font-serif text-primary">4.9</div>
              <div className="text-sm text-gray-400 mt-2">Avaliação</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
