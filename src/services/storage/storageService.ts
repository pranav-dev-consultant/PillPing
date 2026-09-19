import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  schedules: '@pillping/schedules',
  history: '@pillping/history',
  account: '@pillping/account',
} as const;

export async function getStoredValue<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (error) {
    console.warn(`[Storage] Failed to read ${key}`, error);
    return fallback;
  }
}

export async function setStoredValue<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[Storage] Failed to write ${key}`, error);
    throw error;
  }
}

export async function removeStoredValue(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export { STORAGE_KEYS };
