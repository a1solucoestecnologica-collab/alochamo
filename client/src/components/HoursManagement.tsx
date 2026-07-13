import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Clock } from "lucide-react";

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

export function HoursManagement() {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Query para buscar horários
  const { data: hours = [], isLoading } = trpc.hours.list.useQuery();

  // Mutation para upsert horário
  const upsertHour = trpc.hours.upsert.useMutation({
    onSuccess: () => {
      utils.hours.list.invalidate();
      toast({
        title: "Horário atualizado",
        description: "O horário de funcionamento foi salvo com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar horário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Estado local para cada dia da semana
  const [dayStates, setDayStates] = useState<Record<number, {
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }>>({});

  // Inicializar estados com dados do servidor
  const getDayState = (dayOfWeek: number) => {
    if (dayStates[dayOfWeek]) {
      return dayStates[dayOfWeek];
    }
    
    const existing = hours.find(h => h.dayOfWeek === dayOfWeek);
    return {
      openTime: existing?.openTime || "08:00",
      closeTime: existing?.closeTime || "22:00",
      isClosed: existing?.isClosed || false,
    };
  };

  const handleSave = (dayOfWeek: number) => {
    const state = getDayState(dayOfWeek);
    upsertHour.mutate({
      dayOfWeek,
      openTime: state.isClosed ? undefined : state.openTime,
      closeTime: state.isClosed ? undefined : state.closeTime,
      isClosed: state.isClosed,
    });
  };

  const handleToggleClosed = (dayOfWeek: number, isClosed: boolean) => {
    setDayStates(prev => ({
      ...prev,
      [dayOfWeek]: {
        ...getDayState(dayOfWeek),
        isClosed,
      },
    }));
  };

  const handleTimeChange = (dayOfWeek: number, field: "openTime" | "closeTime", value: string) => {
    setDayStates(prev => ({
      ...prev,
      [dayOfWeek]: {
        ...getDayState(dayOfWeek),
        [field]: value,
      },
    }));
  };

  if (isLoading) {
    return <div className="p-6">Carregando horários...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Horários de Funcionamento</h2>
        <p className="text-muted-foreground">
          Configure os horários de abertura e fechamento do seu restaurante
        </p>
      </div>

      <div className="grid gap-4">
        {DAYS_OF_WEEK.map((day) => {
          const state = getDayState(day.value);
          
          return (
            <Card key={day.value}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{day.label}</CardTitle>
                    <CardDescription>
                      {state.isClosed ? "Fechado" : `${state.openTime} - ${state.closeTime}`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`closed-${day.value}`} className="text-sm">
                      Fechado
                    </Label>
                    <Switch
                      id={`closed-${day.value}`}
                      checked={state.isClosed}
                      onCheckedChange={(checked) => handleToggleClosed(day.value, checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              
              {!state.isClosed && (
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`open-${day.value}`}>
                        <Clock className="inline-block w-4 h-4 mr-1" />
                        Abertura
                      </Label>
                      <Input
                        id={`open-${day.value}`}
                        type="time"
                        value={state.openTime}
                        onChange={(e) => handleTimeChange(day.value, "openTime", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`close-${day.value}`}>
                        <Clock className="inline-block w-4 h-4 mr-1" />
                        Fechamento
                      </Label>
                      <Input
                        id={`close-${day.value}`}
                        type="time"
                        value={state.closeTime}
                        onChange={(e) => handleTimeChange(day.value, "closeTime", e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    className="mt-4 w-full"
                    onClick={() => handleSave(day.value)}
                    disabled={upsertHour.isPending}
                  >
                    Salvar Horário
                  </Button>
                </CardContent>
              )}
              
              {state.isClosed && (
                <CardContent>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleSave(day.value)}
                    disabled={upsertHour.isPending}
                  >
                    Confirmar Fechamento
                  </Button>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
