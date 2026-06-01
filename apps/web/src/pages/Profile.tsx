import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../stores/auth.store';
import { useProfileStore } from '../stores/profile.store';
import { authService } from '../services/auth.service';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Section } from '../components/ui/Section';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { LoadingState } from '../components/ui/LoadingState';

type ProfileTab = 'info' | 'preferences' | 'privacy';

const tabs = [
  { id: 'info', label: 'Informações' },
  { id: 'preferences', label: 'Preferências' },
  { id: 'privacy', label: 'Privacidade' },
];

export default function Profile() {
  const user = useCurrentUser();
  const { status, error, loadProfile, updateProfile } = useProfileStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<ProfileTab>('info');
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [language, setLanguage] = useState('pt-BR');
  const [privacy, setPrivacy] = useState<'public' | 'followers' | 'private'>('public');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'idle') loadProfile();
  }, [status, loadProfile]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile({ displayName, bio });
      setEditing(false);
    } catch {
      // handled by store
    }
  };

  const handleCancel = () => {
    if (user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
    }
    setEditing(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatarUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const stats = user?.stats;

  if (status === 'loading' && !user) {
    return (
      <div className="space-y-6">
        <PageHeader title="Perfil" />
        <LoadingState message="Carregando perfil..." />
      </div>
    );
  }

  const initial = (user?.displayName || user?.username || 'U').charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      <PageHeader title="Perfil" subtitle="Suas informações" />

      <Card variant="neon" padding="lg" className="text-center">
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleAvatarClick}
            className="relative w-20 h-20 rounded-full bg-dark-800 border-2 border-neon-500/30 flex items-center justify-center overflow-hidden group hover:border-neon-500 transition-all"
          >
            {avatarUrl || user?.avatar ? (
              <img
                src={avatarUrl || user?.avatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl text-neon-400 font-bold">
                {initial}
              </span>
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-white">📷</span>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div>
            <h2 className="text-lg font-bold text-white">
              {user?.displayName || user?.username || 'Usuário'}
            </h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
      </Card>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as ProfileTab)}
      />

      {activeTab === 'info' && (
        <>
          {editing ? (
            <Card padding="md">
              <Section title="Editar Perfil">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Nome de exibição
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-3 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-neon-500/20 focus:border-neon-700 transition-all"
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2.5 bg-dark-800 border border-dark-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-neon-500/20 focus:border-neon-700 transition-all resize-none"
                      placeholder="Conte um pouco sobre você..."
                    />
                  </div>

                  {error && <p className="text-sm text-red-400">{error}</p>}

                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      isLoading={status === 'saving'}
                    >
                      Salvar
                    </Button>
                    <Button variant="ghost" onClick={handleCancel}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </Section>
            </Card>
          ) : (
            <Section title="Estatísticas">
              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  label="Pedaladas"
                  value={stats?.totalRides ?? '--'}
                />
                <StatCard
                  label="Distância"
                  value={
                    stats?.totalDistance
                      ? `${stats.totalDistance.toFixed(1)} km`
                      : '-- km'
                  }
                />
                <StatCard
                  label="Tempo"
                  value={
                    stats?.totalDuration
                      ? `${Math.floor(stats.totalDuration / 3600)}h`
                      : '--h'
                  }
                />
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditing(true)}
                >
                  Editar perfil
                </Button>
              </div>
            </Section>
          )}
        </>
      )}

      {activeTab === 'preferences' && (
        <Card padding="md">
          <Section title="Preferências">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Tema</p>
                  <p className="text-xs text-gray-500">Aparência do aplicativo</p>
                </div>
                <select
                  value={theme}
                  onChange={(e) =>
                    setTheme(e.target.value as 'dark' | 'light')
                  }
                  className="px-3 py-1.5 bg-dark-800 border border-dark-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-neon-500/20"
                >
                  <option value="dark">Escuro (Neon)</option>
                  <option value="light">Claro</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Idioma</p>
                  <p className="text-xs text-gray-500">Idioma da interface</p>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-3 py-1.5 bg-dark-800 border border-dark-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-neon-500/20"
                >
                  <option value="pt-BR">Português (BR)</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>
          </Section>
        </Card>
      )}

      {activeTab === 'privacy' && (
        <Card padding="md">
          <Section title="Privacidade">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Perfil público</p>
                  <p className="text-xs text-gray-500">
                    Quem pode ver seu perfil e atividades
                  </p>
                </div>
                <select
                  value={privacy}
                  onChange={(e) =>
                    setPrivacy(
                      e.target.value as 'public' | 'followers' | 'private'
                    )
                  }
                  className="px-3 py-1.5 bg-dark-800 border border-dark-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-neon-500/20"
                >
                  <option value="public">Público</option>
                  <option value="followers">Apenas seguidores</option>
                  <option value="private">Privado</option>
                </select>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Suas informações pessoais nunca são compartilhadas sem seu
                consentimento.
              </p>
            </div>
          </Section>
        </Card>
      )}

      <div className="pt-4">
        <Button variant="danger" onClick={handleLogout} className="w-full">
          Sair da conta
        </Button>
      </div>
    </div>
  );
}
