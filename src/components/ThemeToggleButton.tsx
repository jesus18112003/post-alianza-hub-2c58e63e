import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeToggle } from "@/components/ThemeProvider";

export function ThemeToggleButton() {
  const { theme, toggleTheme } = useThemeToggle();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="text-muted-foreground hover:text-foreground active:scale-95 transition-all"
      title={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
