import { Search, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import { useAuth } from '@/hooks/useAuth';

interface AdminTopBarProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function AdminTopBar({ search, onSearchChange }: AdminTopBarProps) {
  const { profile } = useAuth();

  return (
    <header className="border-b border-border px-6 py-3 flex items-center justify-between bg-background/95 backdrop-blur-sm sticky top-0 z-30">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar pólizas, agentes o clientes..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 ml-4">
        <ThemeToggleButton />
        <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-primary rounded-full" />
        </button>
        <div className="flex items-center gap-2 ml-2">
          <div className="text-right">
            <p className="text-sm text-foreground leading-tight">
              {profile?.full_name || profile?.username}
            </p>
            <p className="text-[10px] text-muted-foreground">Executive Director</p>
          </div>
        </div>
      </div>
    </header>
  );
}
