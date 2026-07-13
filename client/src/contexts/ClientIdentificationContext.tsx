import { createContext, useContext, useState, useEffect } from "react";

interface ClientIdentification {
  name: string;
  phone: string;
}

interface ClientIdentificationContextType {
  client: ClientIdentification | null;
  setClient: (client: ClientIdentification) => void;
  clearClient: () => void;
  isIdentified: boolean;
}

const ClientIdentificationContext = createContext<ClientIdentificationContextType | undefined>(undefined);

export function ClientIdentificationProvider({ children }: { children: React.ReactNode }) {
  const [client, setClientState] = useState<ClientIdentification | null>(null);

  // Carregar dados do localStorage ao montar
  useEffect(() => {
    const stored = localStorage.getItem("chamô_client");
    if (stored) {
      try {
        setClientState(JSON.parse(stored));
      } catch (error) {
        console.error("Erro ao carregar dados do cliente:", error);
      }
    }
  }, []);

  const setClient = (newClient: ClientIdentification) => {
    setClientState(newClient);
    localStorage.setItem("chamô_client", JSON.stringify(newClient));
  };

  const clearClient = () => {
    setClientState(null);
    localStorage.removeItem("chamô_client");
  };

  return (
    <ClientIdentificationContext.Provider
      value={{
        client,
        setClient,
        clearClient,
        isIdentified: !!client,
      }}
    >
      {children}
    </ClientIdentificationContext.Provider>
  );
}

export function useClientIdentification() {
  const context = useContext(ClientIdentificationContext);
  if (context === undefined) {
    throw new Error("useClientIdentification deve ser usado dentro de ClientIdentificationProvider");
  }
  return context;
}
