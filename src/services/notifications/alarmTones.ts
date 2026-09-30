export const DEFAULT_ALARM_TONE_ID = 'best_reminder' as const;

export const ALARM_TONES = [
  {
    id: 'best_reminder',
    name: 'PillPing Alert',
    androidSound: 'best_reminder',
    iosSound: 'best_reminder.wav',
    recommended: true,
    bundled: true,
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
export type AlarmToneSelection =
  | { source: 'builtin'; toneId: AlarmToneId }
  | { source: 'device'; toneId: 'custom'; fileName: string; uri: string };

export function getSelectedAlarmTone(
  selection?: AlarmToneSelection,
  legacyToneId?: string,
): AlarmToneSelection {
  if (selection?.source === 'device' && selection.uri && selection.fileName) {
    return selection;
  }
  if (selection?.source === 'builtin') {
    return { source: 'builtin', toneId: getAlarmTone(selection.toneId).id };
  }
  return { source: 'builtin', toneId: getAlarmTone(legacyToneId).id };
}

export function getAlarmToneSelectionName(selection: AlarmToneSelection): string {
  return selection.source === 'device'
    ? selection.fileName
    : getAlarmTone(selection.toneId).name;
}

export function getAlarmTone(value?: string): AlarmTone {
  if (value === 'pillping_alert') return ALARM_TONES[0];
  return ALARM_TONES.find(tone => tone.id === value) ?? ALARM_TONES[0];
}

export function getAndroidAlarmSound(tone: AlarmTone): string {
  return tone.bundled ? tone.androidSound : 'default';
}

export function getIOSAlarmSound(tone: AlarmTone): string {
  return tone.bundled ? tone.iosSound : 'default';
}