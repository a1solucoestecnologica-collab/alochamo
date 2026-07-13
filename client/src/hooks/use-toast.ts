// Simple toast hook - can be replaced with a proper toast library like sonner
export function useToast() {
  return {
    toast: ({ title, description, variant }: { title: string; description?: string; variant?: "default" | "destructive" }) => {
      // Simple alert for now - can be replaced with a proper toast component
      if (variant === "destructive") {
        alert(`❌ ${title}${description ? `\n${description}` : ""}`);
      } else {
        alert(`✅ ${title}${description ? `\n${description}` : ""}`);
      }
    },
  };
}
