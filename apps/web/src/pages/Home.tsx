import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../stores/auth.store';
import { authService } from '../services/auth.service';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Section } from '../components/ui/Section';

export default function Home() {
  const navigate = useNavigate();
  const user = useCurrentUser();

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const displayName = user?.displayName || user?.username || 'Ciclista';
  const stats = user?.stats;

  const weeklyGoal = 100;
  const totalDistance = stats?.totalDistance ?? 0;
  const progress = weeklyGoal > 0 ? Math.min((totalDistance / weeklyGoal) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={`Olá, ${displayName}`}
          subtitle="Pronto para sua próxima pedalada"
        />
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Sair
        </Button>
      </div>

      <Section title="Resumo">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Pedaladas"
            value={stats?.totalRides ?? '--'}
            variant="neon"
          />
          <StatCard
            label="Distância"
            value={
              stats?.totalDistance
                ? `${stats.totalDistance.toFixed(1)} km`
                : '-- km'
            }
            variant="neon"
          />
          <StatCard
            label="Tempo"
            value={
              stats?.totalDuration
                ? `${Math.floor(stats.totalDuration / 3600)}h ${Math.floor((stats.totalDuration % 3600) / 60)}m`
                : '--h'
            }
            variant="neon"
          />
          <StatCard
            label="Vel. Média"
            value="-- km/h"
            variant="neon"
          />
        </div>
      </Section>

      <Section title="Meta Semanal">
        <Card variant="neon" padding="md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">
              Distância: {totalDistance.toFixed(1)} km / {weeklyGoal} km
            </span>
            <span className="text-sm font-bold text-neon-400">
              {progress.toFixed(0)}%
            </span>
          </div>
          <div className="w-full h-2 bg-dark-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-neon-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </Card>
      </Section>

      <Section>
        <Card variant="neon" padding="lg" className="text-center">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full bg-neon-500/10 border border-neon-500/20 flex items-center justify-center">
              <span className="text-2xl text-neon-400">▶</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                Bora pedalar?
              </h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Inicie uma nova sessão com GPS, HUD em tempo real e gravação
                automática de rota. Funciona offline.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => navigate('/ride')}
              className="min-w-[200px]"
            >
              Iniciar Pedal
            </Button>
          </div>
        </Card>
      </Section>

      <Section title="Atividade Recente">
        <Card variant="flat" padding="md" className="text-center py-8">
          <p className="text-sm text-gray-600">
            Nenhuma atividade recente. Complete sua primeira pedalada!
          </p>
        </Card>
      </Section>
    </div>
  );
}
