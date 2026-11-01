import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Persistent key/value storage.
 * - Native: expo-secure-store (Keychain / EncryptedSharedPreferences) — per Security.md §4.2
 * - Web: localStorage fallback (SecureStore is not available on web)
 */
const isWeb = Platform.OS === 'web';

export const storage = {
  async get(key: string): Promise<string | null> {
    try {
      if (isWeb) return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async set(key: string, value: string): Promise<void> {
    try {
      if (isWeb) {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch {
      // ignore storage failures
    }
  },
  async remove(key: string): Promise<void> {
    try {
      if (isWeb) {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch {
      // ignore
    }
  },
};

export const KEYS = {
  token: 'ride.auth.token',
  user: 'ride.auth.user',
  onboarded: 'ride.onboarded',
  passes: 'ride.offline.passes',
};
