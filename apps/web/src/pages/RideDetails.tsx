import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Polyline,
  useMap,
} from 'react-leaflet';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { apiService } from '../services/api.service';
import type { RideDetailDto, RoutePointDto } from '../api/types';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Section } from '../components/ui/Section';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/LoadingState';
import { Tabs } from '../components/ui/Tabs';

type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

function MapBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions, { padding: [40, 40] });
    }
  }, [map, positions]);
  return null;
}

function SpeedChart({ route }: { route: RoutePointDto[] }) {
  const data = useMemo(
    () =>
      route
        .filter((p) => p.speed != null)
        .map((p, i) => ({
          index: i,
          speed: p.speed ?? 0,
          time: new Date(p.timestamp).toLocaleTimeString('pt-BR', {
            minute: '2-digit',
            second: '2-digit',
          }),
        })),
    [route]
  );

  if (data.length === 0) {
    return (
      <Card variant="flat" padding="md" className="text-center py-8">
        <p className="text-sm text-gray-600">Dados de velocidade indisponíveis</p>
      </Card>
    );
  }

  return (
    <Card padding="md">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
            <XAxis
              dataKey="index"
              tick={false}
              axisLine={{ stroke: '#1a1a1a' }}
            />
            <YAxis
              stroke="#4f4f4f"
              tick={{ fill: '#6d6d6d', fontSize: 11 }}
              tickFormatter={(v) => `${v} km/h`}
            />
            <Tooltip
              contentStyle={{
                background: '#111',
                border: '1px solid #1a1a1a',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: '#888' }}
              formatter={(value: any) => [`${Number(value).toFixed(1)} km/h`, 'Velocidade']}
            />
            <Line
              type="monotone"
              dataKey="speed"
              stroke="#39ff14"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: '#39ff14' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function AltitudeChart({ route }: { route: RoutePointDto[] }) {
  const data = useMemo(
    () =>
      route
        .filter((p) => p.altitude != null)
        .map((p, i) => ({
          index: i,
          altitude: p.altitude ?? 0,
          time: new Date(p.timestamp).toLocaleTimeString('pt-BR', {
            minute: '2-digit',
            second: '2-digit',
          }),
        })),
    [route]
  );

  if (data.length === 0) {
    return (
      <Card variant="flat" padding="md" className="text-center py-8">
        <p className="text-sm text-gray-600">Dados de altitude indisponíveis</p>
      </Card>
    );
  }

  return (
    <Card padding="md">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
            <XAxis
              dataKey="index"
              tick={false}
              axisLine={{ stroke: '#1a1a1a' }}
            />
            <YAxis
              stroke="#4f4f4f"
              tick={{ fill: '#6d6d6d', fontSize: 11 }}
              tickFormatter={(v) => `${v}m`}
            />
            <Tooltip
              contentStyle={{
                background: '#111',
                border: '1px solid #1a1a1a',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: '#888' }}
              formatter={(value: any) => [`${Number(value).toFixed(0)}m`, 'Altitude']}
            />
            <Line
              type="monotone"
              dataKey="altitude"
              stroke="#f59e0b"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: '#f59e0b' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

const chartTabs = [
  { id: 'speed', label: 'Velocidade' },
  { id: 'altitude', label: 'Altitude' },
];

export default function RideDetails() {
  const { rideId } = useParams<{ rideId: string }>();
  const navigate = useNavigate();

  const [ride, setRide] = useState<RideDetailDto | null>(null);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [chartTab, setChartTab] = useState('speed');
  const [mapFullscreen, setMapFullscreen] = useState(false);

  useEffect(() => {
    if (!rideId) return;
    const fetchRide = async () => {
      setLoadStatus('loading');
      setError(null);
      try {
        const data = await apiService.getRideWithRoute(rideId);
        setRide(data);
        setLoadStatus('loaded');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Falha ao carregar pedalada';
        setError(message);
        setLoadStatus('error');
      }
    };
    fetchRide();
  }, [rideId]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const routePositions: [number, number][] =
    ride?.route?.map((p) => [p.latitude, p.longitude]) ?? [];

  const center: [number, number] =
    routePositions.length > 0 ? routePositions[0] : [-23.5505, -46.6333];

  if (loadStatus === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Detalhes da Pedalada"
          subtitle="Carregando..."
          actions={
            <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
              Voltar
            </Button>
          }
        />
        <LoadingState message="Carregando pedalada..." />
      </div>
    );
  }

  if (loadStatus === 'error') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Detalhes da Pedalada"
          actions={
            <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
              Voltar
            </Button>
          }
        />
        <Card variant="flat" padding="md">
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Tentar novamente
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Detalhes da Pedalada"
          actions={
            <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
              Voltar
            </Button>
          }
        />
        <EmptyState
          icon={<span className="text-lg">◉</span>}
          title="Pedalada não encontrada"
          description="Esta pedalada pode ter sido removida ou o link é inválido."
        />
      </div>
    );
  }

  const mapHeight = mapFullscreen ? 'h-[70vh]' : 'h-72';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detalhes da Pedalada"
        subtitle={`${formatDate(ride.startedAt)} às ${formatTime(ride.startedAt)}`}
        actions={
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMapFullscreen((v) => !v)}
            >
              {mapFullscreen ? 'Minimizar' : 'Expandir'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/history')}
            >
              Voltar
            </Button>
          </div>
        }
      />

      <Card
        variant="neon"
        padding="none"
        className={`${mapHeight} overflow-hidden relative`}
      >
        {routePositions.length > 0 ? (
          <MapContainer
            center={center}
            zoom={13}
            className="w-full h-full"
            zoomControl={true}
            scrollWheelZoom={true}
            dragging={true}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polyline
              positions={routePositions}
              pathOptions={{
                color: '#39ff14',
                weight: 3,
                opacity: 0.8,
              }}
            />
            <MapBounds positions={routePositions} />
          </MapContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center p-6">
              <span className="text-3xl text-neon-400">◉</span>
              <p className="text-sm text-gray-600 mt-2">Rota não disponível</p>
            </div>
          </div>
        )}
      </Card>

      <Section title="Métricas">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Distância"
            value={ride.distance ? `${ride.distance.toFixed(1)} km` : '-- km'}
          />
          <StatCard
            label="Duração"
            value={ride.duration ? formatDuration(ride.duration) : '--'}
          />
          <StatCard
            label="Vel. Média"
            value={
              ride.averageSpeed
                ? `${ride.averageSpeed.toFixed(1)} km/h`
                : '-- km/h'
            }
          />
          <StatCard
            label="Vel. Máx"
            value={
              ride.maxSpeed ? `${ride.maxSpeed.toFixed(1)} km/h` : '-- km/h'
            }
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <StatCard
            label="Elevação"
            value={ride.elevationGain ? `${ride.elevationGain}m` : '--'}
          />
          <StatCard
            label="Calorias"
            value={ride.calories ? `${ride.calories}` : '--'}
          />
          <StatCard
            label="Modo"
            value={ride.mode === 'GPS_ONLY' ? 'GPS' : 'GPS + Câmera'}
          />
          <StatCard label="Status" value={ride.status === 'FINISHED' ? 'Concluída' : ride.status} />
        </div>
      </Section>

      <Section title="Gráficos">
        <Tabs
          tabs={chartTabs}
          activeTab={chartTab}
          onChange={setChartTab}
        />
        <div className="mt-3">
          {chartTab === 'speed' && <SpeedChart route={ride.route ?? []} />}
          {chartTab === 'altitude' && (
            <AltitudeChart route={ride.route ?? []} />
          )}
        </div>
      </Section>

      {ride.title && (
        <Section title="Informações">
          <Card padding="md">
            <div className="space-y-2">
              {ride.title && (
                <div>
                  <span className="text-xs text-gray-600">Título</span>
                  <p className="text-sm text-white">{ride.title}</p>
                </div>
              )}
              {ride.description && (
                <div>
                  <span className="text-xs text-gray-600">Descrição</span>
                  <p className="text-sm text-gray-300">{ride.description}</p>
                </div>
              )}
              {ride.tags && ride.tags.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  {ride.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </Section>
      )}

      <Section title="Snapshots">
        {ride.snapshots && ride.snapshots.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ride.snapshots.map((snap) => (
              <Card
                key={snap.id}
                variant="flat"
                padding="none"
                className="overflow-hidden"
              >
                <div className="aspect-video bg-dark-850 flex items-center justify-center">
                  {snap.thumbnailUrl || snap.imageUrl ? (
                    <img
                      src={snap.thumbnailUrl || snap.imageUrl}
                      alt="Snapshot"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl text-gray-700">◎</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="flat" padding="md" className="text-center py-8">
            <p className="text-sm text-gray-600">
              Nenhum snapshot registrado nesta pedalada.
            </p>
          </Card>
        )}
      </Section>
    </div>
  );
}
