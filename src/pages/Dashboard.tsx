import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function Dashboard() {
  const { profile, role, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1
            className="text-xl text-accent tracking-tight"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
          >
            Post Alianza
          </h1>
          <span className="text-xs uppercase tracking-widest text-muted-foreground border border-border rounded px-2 py-0.5">
            {role ?? 'agent'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {profile?.full_name || profile?.email}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Content placeholder */}
      <main className="p-6">
        <div className="rounded-lg border border-border bg-card p-12 text-center space-y-3">
          <h2 className="text-2xl text-card-foreground" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
            Welcome, {profile?.full_name || 'Agent'}
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Your dashboard is being built. Policy management, performance charts, and Discord parsing are coming next.
          </p>
        </div>
      </main>
    </div>
  );
}