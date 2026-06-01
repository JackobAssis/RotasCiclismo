import { useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { useAnalyticsStore } from '../stores/analytics.store';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Section } from '../components/ui/Section';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split('-');
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ];
  return `${months[parseInt(m, 10) - 1]}/${y}`;
}

const chartColors = {
  neon: '#22d3a0',
  neonDim: '#166b52',
  grid: '#1f2937',
  text: '#6b7280',
  tooltipBg: '#111827',
  tooltipBorder: '#374151',
};

export default function Analytics() {
  const { data, status, error, fetch } = useAnalyticsStore();

  useEffect(() => {
    if (status === 'idle') fetch();
  }, [status, fetch]);

  const weeklyChartData = useMemo(() => {
    if (!data?.weekly) return [];
    return data.weekly.map((w) => ({
      label: formatWeekLabel(w.weekStart),
      distance: w.distance,
      rides: w.rides,
      speed: w.averageSpeed,
    }));
  }, [data]);

  const monthlyChartData = useMemo(() => {
    if (!data?.monthly) return [];
    return data.monthly.map((m) => ({
      label: formatMonthLabel(m.month),
      distance: m.distance,
      rides: m.rides,
      speed: m.averageSpeed,
    }));
  }, [data]);

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" subtitle="Suas métricas e estatísticas" />
        <LoadingState />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" subtitle="Suas métricas e estatísticas" />
        <EmptyState
          title="Erro ao carregar"
          description={error ?? 'Tente novamente mais tarde'}
          action={<button onClick={() => fetch()} className="text-neon-400 text-sm underline">Tentar novamente</button>}
        />
      </div>
    );
  }

  if (!data || data.totalRides === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" subtitle="Suas métricas e estatísticas" />
        <EmptyState
          title="Nenhum dado ainda"
          description="Complete sua primeira pedalada para ver as estatísticas"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Suas métricas e estatísticas" />

      <Section title="Resumo Geral">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Pedaladas" value={data.totalRides} variant="neon" />
          <StatCard
            label="Distância Total"
            value={`${data.totalDistance.toFixed(1)} km`}
            variant="neon"
          />
          <StatCard
            label="Tempo Total"
            value={formatDuration(data.totalDuration)}
            variant="neon"
          />
          <StatCard
            label="Velocidade Média"
            value={`${data.averageSpeed.toFixed(1)} km/h`}
            variant="neon"
          />
          <StatCard
            label="Maior Velocidade"
            value={`${data.maxSpeed.toFixed(1)} km/h`}
            variant="neon"
          />
          <StatCard
            label="Distância Média"
            value={`${data.averageDistance.toFixed(1)} km`}
            variant="neon"
          />
        </div>
      </Section>

      {weeklyChartData.length > 0 && (
        <Section title="Distância por Semana">
          <Card padding="md" variant="default">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: chartColors.text, fontSize: 11 }}
                  axisLine={{ stroke: chartColors.grid }}
                />
                <YAxis
                  tick={{ fill: chartColors.text, fontSize: 11 }}
                  axisLine={{ stroke: chartColors.grid }}
                  unit=" km"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    border: `1px solid ${chartColors.tooltipBorder}`,
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => `${Number(value).toFixed(1)} km`}
                />
                <Bar
                  dataKey="distance"
                  fill={chartColors.neon}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>
      )}

      {monthlyChartData.length > 0 && (
        <Section title="Distância por Mês">
          <Card padding="md" variant="default">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: chartColors.text, fontSize: 11 }}
                  axisLine={{ stroke: chartColors.grid }}
                />
                <YAxis
                  tick={{ fill: chartColors.text, fontSize: 11 }}
                  axisLine={{ stroke: chartColors.grid }}
                  unit=" km"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    border: `1px solid ${chartColors.tooltipBorder}`,
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => `${Number(value).toFixed(1)} km`}
                />
                <Bar
                  dataKey="distance"
                  fill={chartColors.neon}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Section>
      )}

      {weeklyChartData.length > 0 && (
        <Section title="Velocidade Média por Semana">
          <Card padding="md" variant="default">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: chartColors.text, fontSize: 11 }}
                  axisLine={{ stroke: chartColors.grid }}
                />
                <YAxis
                  tick={{ fill: chartColors.text, fontSize: 11 }}
                  axisLine={{ stroke: chartColors.grid }}
                  unit=" km/h"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    border: `1px solid ${chartColors.tooltipBorder}`,
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: any) => `${Number(value).toFixed(1)} km/h`}
                />
                <Line
                  type="monotone"
                  dataKey="speed"
                  stroke={chartColors.neon}
                  strokeWidth={2}
                  dot={{ fill: chartColors.neon, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Section>
      )}
    </div>
  );
}
