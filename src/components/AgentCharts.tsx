import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Policy } from '@/types/policy';
import { STATUS_CONFIG, PolicyStatus } from '@/components/StatusBadge';

const COMPANY_COLORS = [
  'hsl(210, 70%, 55%)', 'hsl(160, 60%, 45%)', 'hsl(45, 80%, 55%)',
  'hsl(280, 60%, 55%)', 'hsl(350, 65%, 55%)', 'hsl(190, 60%, 50%)',
  'hsl(30, 70%, 50%)', 'hsl(120, 50%, 45%)',
];

const STATUS_COLORS: Record<string, string> = {
  emitido: 'hsl(142, 70%, 45%)',
  cobrado: 'hsl(210, 70%, 55%)',
  pendiente: 'hsl(38, 92%, 50%)',
  fondo_insuficiente: 'hsl(45, 80%, 55%)',
  descalificado: 'hsl(0, 0%, 55%)',
  cancelado: 'hsl(0, 70%, 50%)',
  chargeback: 'hsl(0, 50%, 35%)',
  aprobado: 'hsl(142, 70%, 45%)',
};

interface AgentChartsProps {
  policies: Policy[];
}

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }: any) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 18;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="hsl(var(--muted-foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11}>
      {name} {(percent * 100).toFixed(1)}%
    </text>
  );
}

export function AgentCharts({ policies }: AgentChartsProps) {
  const companyData = useMemo(() => {
    const counts: Record<string, number> = {};
    policies.forEach(p => { counts[p.company] = (counts[p.company] || 0) + 1; });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [policies]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    policies.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return Object.entries(counts)
      .map(([key, value]) => ({
        name: STATUS_CONFIG[key as PolicyStatus]?.label || key,
        value,
        key,
      }))
      .sort((a, b) => b.value - a.value);
  }, [policies]);

  if (policies.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Company Distribution */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Top Empresas</h4>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={companyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={CustomLabel}>
              {companyData.map((_, i) => (
                <Cell key={i} fill={COMPANY_COLORS[i % COMPANY_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Status Distribution */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Status</h4>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={CustomLabel}>
              {statusData.map((entry) => (
                <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || 'hsl(0,0%,50%)'} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
