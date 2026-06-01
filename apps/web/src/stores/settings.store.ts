import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useGPSStore } from './gps.store';
import { useRuntimeStore } from './runtime.store';

export interface AppSettings {
  // GPS
  highAccuracy: boolean;
  backgroundTracking: boolean;
  gpsFrequency: number;

  // Camera
  cameraMode: boolean;
  autoSnapshots: boolean;
  videoQuality: '720p' | '1080p' | '4K';

  // Sync
  autoSync: boolean;
  syncOnMobileData: boolean;
  mapCache: boolean;

  // Accessibility
  largeText: boolean;
  highContrast: boolean;
  reducedMotion: boolean;

  // Profile
  theme: 'dark' | 'light';
  language: string;
  privacy: 'public' | 'followers' | 'private';
}

interface SettingsState {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  highAccuracy: true,
  backgroundTracking: true,
  gpsFrequency: 1000,

  cameraMode: false,
  autoSnapshots: true,
  videoQuality: '1080p',

  autoSync: true,
  syncOnMobileData: false,
  mapCache: true,

  largeText: false,
  highContrast: false,
  reducedMotion: false,

  theme: 'dark',
  language: 'pt-BR',
  privacy: 'public',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: { ...DEFAULT_SETTINGS },

      updateSettings: (partial) => {
        set((state) => {
          const updated = { ...state.settings, ...partial };

          // Apply GPS settings immediately
          if (partial.gpsFrequency !== undefined) {
            useGPSStore.setState({ flushIntervalMs: partial.gpsFrequency });
          }

          // Apply accessibility settings
          if (partial.reducedMotion !== undefined) {
            document.documentElement.classList.toggle(
              'reduce-motion',
              partial.reducedMotion
            );
          }

          if (partial.highContrast !== undefined) {
            document.documentElement.classList.toggle(
              'high-contrast',
              partial.highContrast
            );
          }

          return { settings: updated };
        });
      },

      resetSettings: () => {
        set({ settings: { ...DEFAULT_SETTINGS } });
      },
    }),
    {
      name: 'cycling-settings',
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);
