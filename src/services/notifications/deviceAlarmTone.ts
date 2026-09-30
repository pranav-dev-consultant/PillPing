import { NativeModules, Platform } from 'react-native';

export type ImportedAlarmAudio = {
  fileName: string;
  uri: string;
};

type NativeAlarmToneModule = {
  isSupported: () => Promise<boolean>;
  pickAudio: () => Promise<ImportedAlarmAudio | null>;
  isAudioAvailable: (uri: string) => Promise<boolean>;
  createSoundChannel: (uri: string, fileName: string, soundEnabled: boolean) => Promise<string>;
  deleteImportedAudio: (uri: string) => Promise<boolean>;
};

const nativeAlarmTone = NativeModules.PillPingAlarmTone as NativeAlarmToneModule | undefined;

export async function isDeviceAlarmToneSupported(): Promise<boolean> {
  if (Platform.OS !== 'android' || !nativeAlarmTone) return false;
  return nativeAlarmTone.isSupported();
}

export async function pickDeviceAlarmTone(): Promise<ImportedAlarmAudio | null> {
  if (!(await isDeviceAlarmToneSupported()) || !nativeAlarmTone) {
    throw new Error('Device alarm sounds are supported on Android 8 and later.');
  }
  return nativeAlarmTone.pickAudio();
}

export async function isDeviceAlarmToneAvailable(uri: string): Promise<boolean> {
  if (Platform.OS !== 'android' || !nativeAlarmTone) return false;
  return nativeAlarmTone.isAudioAvailable(uri);
}

export async function createDeviceAlarmToneChannel(
  uri: string,
  fileName: string,
  soundEnabled: boolean,
): Promise<string> {
  if (Platform.OS !== 'android' || !nativeAlarmTone) {
    throw new Error('Device alarm sounds are not supported on this platform.');
  }
  return nativeAlarmTone.createSoundChannel(uri, fileName, soundEnabled);
}

export async function deleteDeviceAlarmTone(uri: string): Promise<void> {
  if (Platform.OS === 'android' && nativeAlarmTone) {
    await nativeAlarmTone.deleteImportedAudio(uri);
  }
}