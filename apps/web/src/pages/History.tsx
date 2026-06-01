import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHistoryStore } from '../stores/history.store';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { Section } from '../components/ui/Section';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/ui/LoadingState';
import type { RideDto } from '../api/types';

const statusFilterOptions = [
  { value: '', label: 'Todas' },
  { value: 'FINISHED', label: 'Concluídas' },
  { value: 'SYNCED', label: 'Sincronizadas' },
  { value: 'ACTIVE', label: 'Ativas' },
] as const;

export default function History() {
  const navigate = useNavigate();
  const { rides, status, error, hasMore, fetchRides, loadMore } = useHistoryStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateSort, setDateSort] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    if (status === 'idle') fetchRides();
  }, [status, fetchRides]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const filteredRides = useMemo(() => {
    let result = [...rides];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (statusFilter) {
      result = result.filter((r) => r.status === statusFilter);
    }

    result.sort((a, b) =>
      dateSort === 'desc'
        ? new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        : new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
    );

    return result;
  }, [rides, search, statusFilter, dateSort]);

  const handleRefresh = useCallback(() => fetchRides(), [fetchRides]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Histórico"
        subtitle="Todas as suas pedaladas"
        actions={
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            Atualizar
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, descrição ou tags..."
            className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-neon-500/20 focus:border-neon-700 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-dark-800 border border-dark-700 rounded-xl text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-neon-500/20"
          >
            {statusFilterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setDateSort((s) => (s === 'desc' ? 'asc' : 'desc'))}
            className="px-3 py-2 bg-dark-800 border border-dark-700 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
            title="Ordenar por data"
          >
            {dateSort === 'desc' ? '↓' : '↑'}
          </button>
        </div>
      </div>

      {status === 'loading' && rides.length === 0 && (
        <LoadingState message="Carregando histórico..." />
      )}

      {status === 'error' && (
        <Card variant="flat" padding="md">
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <Button variant="secondary" size="sm" onClick={() => fetchRides()}>
              Tentar novamente
            </Button>
          </div>
        </Card>
      )}

      {status === 'loaded' && rides.length === 0 && (
        <EmptyState
          icon={<span className="text-lg">☰</span>}
          title="Nenhuma pedalada registrada"
          description="Suas pedaladas aparecerão aqui após finalizar uma sessão."
        />
      )}

      {filteredRides.length === 0 && rides.length > 0 && (
        <Card variant="flat" padding="md" className="text-center py-6">
          <p className="text-sm text-gray-500">
            Nenhuma pedalada corresponde aos filtros.
          </p>
        </Card>
      )}

      {filteredRides.length > 0 && (
        <Section>
          <div className="space-y-3">
            {filteredRides.map((ride: RideDto) => (
              <Card
                key={ride.id}
                variant="default"
                padding="md"
                className="cursor-pointer hover:border-neon-800/40 transition-all duration-200"
                onClick={() => navigate(`/history/${ride.id}`)}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">
                    {formatDate(ride.startedAt)}
                  </span>
                  <div className="flex items-center gap-2">
                    {ride.tags?.map((tag) => (
                      <Badge key={tag} variant="default">
                        {tag}
                      </Badge>
                    ))}
                    <Badge
                      variant={
                        ride.status === 'FINISHED' || ride.status === 'SYNCED'
                          ? 'success'
                          : 'default'
                      }
                    >
                      {ride.status === 'FINISHED'
                        ? 'Concluída'
                        : ride.status === 'SYNCED'
                          ? 'Sincronizada'
                          : ride.status}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-lg font-bold text-white">
                      {ride.distance ? `${ride.distance.toFixed(1)}` : '--'}
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
                      {ride.averageSpeed
                        ? `${ride.averageSpeed.toFixed(1)}`
                        : '--'}
                    </div>
                    <div className="text-xs text-gray-600">km/h</div>
                  </div>
                </div>
                {ride.title && (
                  <div className="mt-2 text-xs text-gray-500 truncate">
                    {ride.title}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="secondary"
                onClick={loadMore}
                isLoading={status === 'loading'}
              >
                Carregar mais
              </Button>
            </div>
          )}
        </Section>
      )}
    </div>
  );
}
