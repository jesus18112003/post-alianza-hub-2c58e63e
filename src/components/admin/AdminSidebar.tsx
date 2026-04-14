import { LayoutDashboard, FileText, Users, DollarSign, BarChart3, Settings, LogOut, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export type AdminSection = 'dashboard' | 'policies' | 'agents' | 'commissions' | 'reports';

interface AdminSidebarProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  onNewPolicy: () => void;
}

const NAV_ITEMS: { id: AdminSection; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'policies', label: 'Pólizas', icon: FileText },
  { id: 'agents', label: 'Agentes', icon: Users },
  { id: 'commissions', label: 'Comisiones', icon: DollarSign },
  { id: 'reports', label: 'Reportes', icon: BarChart3 },
];

export function AdminSidebar({ activeSection, onSectionChange, onNewPolicy }: AdminSidebarProps) {
  const { signOut } = useAuth();

  return (
    <aside className="w-56 border-r border-border bg-sidebar-background flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-6">
        <h1 className="text-lg text-accent tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
          POSTALIANZA
        </h1>
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
          Agency Management
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all active:scale-[0.97] ${
                isActive
                  ? 'bg-sidebar-accent text-accent border border-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 pb-4 space-y-2">
        <Button
          onClick={onNewPolicy}
          className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Policy
        </Button>

        <button
          onClick={() => {}}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-all"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>

        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-all"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
