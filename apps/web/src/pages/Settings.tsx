import { useState, useEffect, useCallback } from 'react';
import { useSettingsStore } from '../stores/settings.store';
import { useRuntimeStore } from '../stores/runtime.store';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Section } from '../components/ui/Section';
import { Tabs } from '../components/ui/Tabs';
import { Badge } from '../components/ui/Badge';
import { storageService } from '../services/storage.service';
import { eventBus } from '../lib/eventBus';

type SettingsTab = 'sync' | 'gps' | 'camera' | 'accessibility';

const tabs = [
  { id: 'sync', label: 'Sync Offline' },
  { id: 'gps', label: 'GPS' },
  { id: 'camera', label: 'Câmera' },
  { id: 'accessibility', label: 'Acessibilidade' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('sync');

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" subtitle="Preferências do aplicativo" />

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as SettingsTab)}
      />

      {activeTab === 'sync' && <SyncSettings />}
      {activeTab === 'gps' && <GPSSettings />}
      {activeTab === 'camera' && <CameraSettings />}
      {activeTab === 'accessibility' && <AccessibilitySettings />}
    </div>
  );
}

function SyncSettings() {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <div className="space-y-4">
      <SyncStatusPanel />
      <Card padding="md">
        <Section title="Sincronização Offline">
          <div className="space-y-4">
            <ToggleRow
              label="Sync automático"
              description="Sincronizar dados automaticamente quando online"
              checked={settings.autoSync}
              onChange={(v) => updateSettings({ autoSync: v })}
            />
            <ToggleRow
              label="Sync em dados móveis"
              description="Permitir sincronização usando rede móvel"
              checked={settings.syncOnMobileData}
              onChange={(v) => updateSettings({ syncOnMobileData: v })}
            />
            <ToggleRow
              label="Cache de mapas"
              description="Manter mapas offline para consulta"
              checked={settings.mapCache}
              onChange={(v) => updateSettings({ mapCache: v })}
            />
          </div>
        </Section>
      </Card>
    </div>
  );
}

function SyncStatusPanel() {
  const [tasks, setTasks] = useState<any[]>([]);

  const loadTasks = useCallback(async () => {
    const all = await storageService.getAllSyncTasks();
    setTasks(all);
  }, []);

  useEffect(() => {
    loadTasks();

    const unsubs = [
      eventBus.on('sync:task:finished', () => loadTasks()),
      eventBus.on('sync:task:failed', () => loadTasks()),
      eventBus.on('sync:worker:status', () => loadTasks()),
    ];

    const interval = setInterval(loadTasks, 5000);

    return () => {
      unsubs.forEach((u) => u());
      clearInterval(interval);
    };
  }, [loadTasks]);

  const pending = tasks.filter((t) => t.status === 'pending').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const failed = tasks.filter((t) => t.status === 'failed').length;
  const total = tasks.length;

  const lastSync = tasks
    .filter((t) => t.status === 'completed')
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )[0]?.updatedAt;

  return (
    <Card padding="md">
      <Section title="Status da Sincronização">
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="flex flex-col items-center p-3 bg-dark-800 rounded-lg">
            <span className="text-lg font-bold text-yellow-400">{pending}</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Pendentes</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-dark-800 rounded-lg">
            <span className="text-lg font-bold text-blue-400">{inProgress}</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Processando</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-dark-800 rounded-lg">
            <span className="text-lg font-bold text-neon-400">{completed}</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Concluídas</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-dark-800 rounded-lg">
            <span className="text-lg font-bold text-red-400">{failed}</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Erro</span>
          </div>
        </div>

        {lastSync && (
          <p className="text-xs text-gray-500">
            Última sincronização:{' '}
            {new Date(lastSync).toLocaleString('pt-BR')}
          </p>
        )}

        {total === 0 && (
          <p className="text-xs text-gray-600">Nenhuma tarefa de sincronização no momento</p>
        )}
      </Section>
    </Card>
  );
}

function GPSSettings() {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <Card padding="md">
      <Section title="Configurações de GPS">
        <div className="space-y-4">
          <ToggleRow
            label="Alta precisão"
            description="Usar GPS de alta precisão (maior consumo de bateria)"
            checked={settings.highAccuracy}
            onChange={(v) => updateSettings({ highAccuracy: v })}
          />
          <ToggleRow
            label="GPS em segundo plano"
            description="Manter rastreamento mesmo com app em segundo plano"
            checked={settings.backgroundTracking}
            onChange={(v) => updateSettings({ backgroundTracking: v })}
          />
          <SelectRow
            label="Frequência de atualização"
            description="Intervalo entre leituras GPS"
            value={String(settings.gpsFrequency)}
            options={[
              { value: '500', label: '0.5s' },
              { value: '1000', label: '1s' },
              { value: '2000', label: '2s' },
              { value: '5000', label: '5s' },
              { value: '10000', label: '10s' },
            ]}
            onChange={(v) => updateSettings({ gpsFrequency: Number(v) })}
          />
        </div>
      </Section>
    </Card>
  );
}

function CameraSettings() {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <Card padding="md">
      <Section title="Configurações de Câmera">
        <div className="space-y-4">
          <ToggleRow
            label="Modo câmera"
            description="Gravar vídeo durante pedalada"
            checked={settings.cameraMode}
            onChange={(v) => updateSettings({ cameraMode: v })}
          />
          <ToggleRow
            label="Snapshots automáticos"
            description="Capturar fotos automaticamente em pontos de interesse"
            checked={settings.autoSnapshots}
            onChange={(v) => updateSettings({ autoSnapshots: v })}
          />
          <SelectRow
            label="Qualidade do vídeo"
            description="Resolução da gravação"
            value={settings.videoQuality}
            options={[
              { value: '720p', label: '720p' },
              { value: '1080p', label: '1080p' },
              { value: '4K', label: '4K' },
            ]}
            onChange={(v) =>
              updateSettings({
                videoQuality: v as '720p' | '1080p' | '4K',
              })
            }
          />
        </div>
      </Section>
    </Card>
  );
}

function AccessibilitySettings() {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <Card padding="md">
      <Section title="Acessibilidade">
        <div className="space-y-4">
          <ToggleRow
            label="Texto grande"
            description="Aumentar tamanho da fonte"
            checked={settings.largeText}
            onChange={(v) => updateSettings({ largeText: v })}
          />
          <ToggleRow
            label="Alto contraste"
            description="Aumentar contraste dos elementos"
            checked={settings.highContrast}
            onChange={(v) => updateSettings({ highContrast: v })}
          />
          <ToggleRow
            label="Animações reduzidas"
            description="Reduzir movimentos na interface"
            checked={settings.reducedMotion}
            onChange={(v) => updateSettings({ reducedMotion: v })}
          />
        </div>
      </Section>
    </Card>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-neon-500/30 ${
          checked ? 'bg-neon-500' : 'bg-dark-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function SelectRow({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 bg-dark-800 border border-dark-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-neon-500/20 focus:border-neon-700"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
