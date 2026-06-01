import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from './settings.store';

describe('SettingsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.getState().resetSettings();
  });

  it('has default settings', async () => {
    const { settings } = useSettingsStore.getState();
    expect(settings).toBeDefined();
    expect(settings).toHaveProperty('highAccuracy', true);
    expect(settings).toHaveProperty('autoSync', true);
    expect(settings).toHaveProperty('theme', 'dark');
    expect(settings).toHaveProperty('language', 'pt-BR');
    expect(settings).toHaveProperty('privacy', 'public');
  });

  it('updateSettings merges partial settings', () => {
    useSettingsStore.getState().updateSettings({
      highAccuracy: false,
      backgroundTracking: true,
    });

    const { settings } = useSettingsStore.getState();
    expect(settings.highAccuracy).toBe(false);
    expect(settings.backgroundTracking).toBe(true);
  });

  it('updateSettings merges deeply nested values', () => {
    useSettingsStore.getState().updateSettings({
      reducedMotion: true,
      highContrast: true,
    });

    const { settings } = useSettingsStore.getState();
    expect(settings.reducedMotion).toBe(true);
    expect(settings.highContrast).toBe(true);
  });

  it('resetSettings restores defaults', () => {
    useSettingsStore.getState().updateSettings({
      autoSync: false,
      privacy: 'private',
    });
    expect(useSettingsStore.getState().settings.autoSync).toBe(false);
    expect(useSettingsStore.getState().settings.privacy).toBe('private');

    useSettingsStore.getState().resetSettings();
    const { settings } = useSettingsStore.getState();
    expect(settings.autoSync).toBe(true);
    expect(settings.privacy).toBe('public');
  });
});
