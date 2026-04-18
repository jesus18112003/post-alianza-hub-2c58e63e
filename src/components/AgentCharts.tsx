import { useMemo } from 'react';
// 1. Importamos Legend de recharts
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
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
  no_seguimiento: 'hsl(220, 10%, 40%)',
};

interface AgentChartsProps {
  policies: Policy[];
}

// Eliminamos el CustomLabel si vas a usar Leyendas para que no se amontone el texto,
// pero si lo quieres dejar, te recomiendo reducir el outerRadius del Pie.

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Company Distribution */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h4 className="text-base text-accent tracking-tight mb-3" style={{ fontFamily: "'Georgia', serif" }}>Top Empresas por Volumen</h4>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie 
              data={companyData} 
              dataKey="value" 
              nameKey="name" 
              cx="35%" // Movemos el centro a la izquierda para dejar espacio a la leyenda
              cy="50%" 
              innerRadius={50} // Lo hacemos tipo "Donut" para que se vea más moderno
              outerRadius={70} 
            >
              {companyData.map((_, i) => (
                <Cell key={i} fill={COMPANY_COLORS[i % COMPANY_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            {/* Leyenda lateral */}
            <Legend 
              layout="vertical" 
              verticalAlign="middle" 
              align="right" 
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', paddingLeft: '10px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Status Distribution */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h4 className="text-base text-accent tracking-tight mb-3" style={{ fontFamily: "'Georgia', serif" }}>Estatus de Cartera</h4>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie 
              data={statusData} 
              dataKey="value" 
              nameKey="name" 
              cx="35%" 
              cy="50%" 
              innerRadius={50}
              outerRadius={70} 
            >
              {statusData.map((entry) => (
                <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || 'hsl(0,0%,50%)'} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            <Legend 
              layout="vertical" 
              verticalAlign="middle" 
              align="right" 
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', paddingLeft: '10px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
