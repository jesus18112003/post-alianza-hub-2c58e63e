import { LayoutDashboard, DollarSign, FileText, HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export type AgentSection = 'overview';

interface AgentSidebarProps {
  activeSection: AgentSection;
  onSectionChange: (section: AgentSection) => void;
}

const NAV_ITEMS: { id: AgentSection; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'OVERVIEW', icon: LayoutDashboard },
];

const BOTTOM_ITEMS = [
  { id: 'commission', label: 'COMMISSION', icon: DollarSign, disabled: true },
  { id: 'documents', label: 'DOCUMENTS', icon: FileText, disabled: true },
];

export function AgentSidebar({ activeSection, onSectionChange }: AgentSidebarProps) {
  const { signOut } = useAuth();

  return (
    <aside className="w-56 border-r border-border bg-sidebar-background flex flex-col h-screen sticky top-0">
      <div className="px-5 py-6">
        <h1 className="text-lg text-accent tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
          POSTALIANZA
        </h1>
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
          Agent Portal
        </p>
      </div>

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

        {BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              disabled
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground/50 cursor-not-allowed"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-4 space-y-2">
        <button
          onClick={() => {}}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-all"
        >
          <HelpCircle className="h-4 w-4" />
          HELP CENTER
        </button>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-all"
        >
          <LogOut className="h-4 w-4" />
          LOGOUT
        </button>
      </div>
    </aside>
  );
}
