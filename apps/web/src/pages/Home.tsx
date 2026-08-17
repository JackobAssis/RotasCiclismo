import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCurrentUser } from '../stores/auth.store';
import { authService } from '../services/auth.service';
import { apiService } from '../services/api.service';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Section } from '../components/ui/Section';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import type { AnalyticsResponseDto, RideDto } from '../api/types';

const WEEKLY_GOAL_KM = 100;

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

export default function Home() {
  const navigate = useNavigate();
  const user = useCurrentUser();

  const [analytics, setAnalytics] = useState<AnalyticsResponseDto | null>(null);
  const [recentRides, setRecentRides] = useState<RideDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [analyticsData, ridesResult] = await Promise.all([
        apiService.getAnalytics(),
        apiService.listRides(1, 5),
      ]);
      setAnalytics(analyticsData);
      setRecentRides(ridesResult.data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Falha ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const displayName = user?.displayName || user?.username || 'Ciclista';

  const totalDistance = analytics?.totalDistance ?? 0;
  const totalDuration = analytics?.totalDuration ?? 0;
  const averageSpeed = analytics?.averageSpeed ?? 0;

  const currentWeekDistance = useMemo(() => {
    const weeks = analytics?.weekly ?? [];
    if (weeks.length === 0) return 0;
    const now = new Date();
    const current = weeks.find((w) => {
      const start = new Date(w.weekStart + 'T00:00:00');
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      return now >= start && now < end;
    });
    return (current ?? weeks[weeks.length - 1]).distance;
  }, [analytics]);

  const progress = Math.min((currentWeekDistance / WEEKLY_GOAL_KM) * 100, 100);
  const weekDuration = analytics?.weekly?.length
    ? analytics.weekly.reduce((s, w) => s + w.duration, 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title={`Olá, ${displayName}`} subtitle="Pronto para sua próxima pedalada" />
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Sair
        </Button>
      </div>

      {loadError && (
        <Card variant="flat" padding="md">
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-sm text-red-400">{loadError}</p>
            <Button variant="secondary" size="sm" onClick={loadData}>
              Tentar novamente
            </Button>
          </div>
        </Card>
      )}

      <Section title="Resumo">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Pedaladas" value={analytics?.totalRides ?? '--'} variant="neon" />
          <StatCard
            label="Distância"
            value={totalDistance ? `${totalDistance.toFixed(1)} km` : '-- km'}
            variant="neon"
          />
          <StatCard
            label="Tempo"
            value={totalDuration ? formatDuration(totalDuration) : '--'}
            variant="neon"
          />
          <StatCard
            label="Vel. Média"
            value={averageSpeed ? `${averageSpeed.toFixed(1)} km/h` : '-- km/h'}
            variant="neon"
          />
        </div>
      </Section>

      <Section title="Meta Semanal">
        <Card variant="neon" padding="md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">
              Distância: {currentWeekDistance.toFixed(1)} km / {WEEKLY_GOAL_KM} km
            </span>
            <span className="text-sm font-bold text-neon-400">{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 bg-dark-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-neon-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {analytics?.weekly?.length
              ? `${formatDuration(weekDuration)} de atividade esta semana`
              : 'Inicie sua primeira pedalada para bater a meta!'}
          </p>
        </Card>
      </Section>

      <Section>
        <Card variant="neon" padding="lg" className="text-center">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full bg-neon-500/10 border border-neon-500/20 flex items-center justify-center">
              <span className="text-2xl text-neon-400">▶</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Bora pedalar?</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Inicie uma nova sessão com GPS, HUD em tempo real e gravação automática de rota.
                Funciona offline.
              </p>
            </div>
            <Button size="lg" onClick={() => navigate('/ride')} className="min-w-[200px]">
              Iniciar Pedal
            </Button>
          </div>
        </Card>
      </Section>

      <Section title="Atividade Recente">
        {loading && recentRides.length === 0 ? (
          <Card variant="flat" padding="md" className="text-center py-8">
            <p className="text-sm text-gray-500">Carregando atividades...</p>
          </Card>
        ) : recentRides.length === 0 ? (
          <Card variant="flat" padding="md" className="py-8">
            <EmptyState
              icon={<span className="text-lg">☰</span>}
              title="Nenhuma atividade recente"
              description="Complete sua primeira pedalada para vê-la aqui."
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {recentRides.map((ride) => (
              <Card
                key={ride.id}
                variant="default"
                padding="md"
                className="cursor-pointer hover:border-neon-800/40 transition-all duration-200"
                onClick={() => navigate(`/history/${ride.id}`)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">{formatDate(ride.startedAt)}</span>
                    {ride.title && (
                      <span className="text-sm text-white font-medium truncate max-w-[180px]">
                        {ride.title}
                      </span>
                    )}
                  </div>
                  <Badge
                    variant={
                      ride.status === 'SYNCED' || ride.status === 'FINISHED' ? 'success' : 'default'
                    }
                  >
                    {ride.status === 'SYNCED'
                      ? 'Sincronizada'
                      : ride.status === 'FINISHED'
                        ? 'Concluída'
                        : ride.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-lg font-bold text-white">
                      {ride.distance ? ride.distance.toFixed(1) : '--'}
                    </div>
                    <div className="text-xs text-gray-600">km</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">
                      {ride.duration ? formatDuration(ride.duration) : '--'}
                    </div>
                    <div className="text-xs text-gray-600">duração</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">
                      {ride.averageSpeed ? ride.averageSpeed.toFixed(1) : '--'}
                    </div>
                    <div className="text-xs text-gray-600">km/h</div>
                  </div>
                </div>
              </Card>
            ))}
            <div className="flex justify-center pt-1">
              <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
                Ver histórico completo →
              </Button>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
