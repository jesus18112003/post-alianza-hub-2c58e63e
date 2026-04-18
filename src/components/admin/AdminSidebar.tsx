import { LayoutDashboard, FileText, Users, Settings, LogOut, PanelLeftClose, PanelLeft, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export type AdminSection = 'dashboard' | 'policies' | 'agents' | 'carrier-totals';

interface AdminSidebarProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
}

const NAV_ITEMS: { id: AdminSection; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'policies', label: 'Pólizas', icon: FileText },
  { id: 'agents', label: 'Agentes', icon: Users },
  { id: 'carrier-totals', label: 'Total de Carrier', icon: Building2 },
];

export function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`${collapsed ? 'w-14' : 'w-56'} border-r border-border bg-sidebar-background flex flex-col h-screen sticky top-0 transition-all duration-200`}>
      <div className={`flex items-center justify-between ${collapsed ? 'px-2 py-4' : 'px-5 py-6'}`}>
        {!collapsed && (
          <div>
            <h1 className="text-lg text-accent tracking-tight" style={{ fontFamily: "'Georgia', serif" }}>
              POSTALIANZA
            </h1>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
              Agency Management
            </p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
          title={collapsed ? 'Expandir' : 'Minimizar'}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-3 py-2.5 rounded-lg text-sm transition-all active:scale-[0.97] ${
                isActive
                  ? 'bg-sidebar-accent text-accent border border-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-2 pb-4 space-y-2">
        <button
          onClick={() => {}}
          title={collapsed ? 'Settings' : undefined}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-all`}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && 'Settings'}
        </button>
        <button
          onClick={signOut}
          title={collapsed ? 'Logout' : undefined}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-all`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  );
}
