export const DEFAULT_ALARM_TONE_ID = 'pillping_alert' as const;

export const ALARM_TONES = [
  {
    id: 'pillping_alert',
    name: 'PillPing Alert',
    androidSound: 'pillping_alert',
    iosSound: 'pillping_alert.wav',
    recommended: true,
    bundled: false,
  },
  {
    id: 'gentle_alarm',
    name: 'Gentle Alarm',
    androidSound: 'gentle_alarm',
    iosSound: 'gentle_alarm.wav',
    recommended: false,
    bundled: false,
  },
  {
    id: 'classic_alarm',
    name: 'Classic Alarm',
    androidSound: 'classic_alarm',
    iosSound: 'classic_alarm.wav',
    recommended: false,
    bundled: false,
  },
  {
    id: 'digital_alarm',
    name: 'Digital Alarm',
    androidSound: 'digital_alarm',
    iosSound: 'digital_alarm.wav',
    recommended: false,
    bundled: false,
  },
  {
    id: 'soft_chime',
    name: 'Soft Chime',
    androidSound: 'soft_chime',
    iosSound: 'soft_chime.wav',
    recommended: false,
    bundled: false,
  },
] as const;

export type AlarmToneId = (typeof ALARM_TONES)[number]['id'];
export type AlarmTone = (typeof ALARM_TONES)[number];

export function getAlarmTone(value?: string): AlarmTone {
  return ALARM_TONES.find(tone => tone.id === value) ?? ALARM_TONES[0];
}

export function getAndroidAlarmSound(tone: AlarmTone): string {
  return tone.bundled ? tone.androidSound : 'default';
}

export function getIOSAlarmSound(tone: AlarmTone): string {
  return tone.bundled ? tone.iosSound : 'default';
}