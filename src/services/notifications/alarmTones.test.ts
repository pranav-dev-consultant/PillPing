import {
  ALARM_TONES,
  DEFAULT_ALARM_TONE_ID,
  getAlarmTone,
  getAndroidAlarmSound,
  getIOSAlarmSound,
} from './alarmTones';

describe('alarm tone catalog', () => {
  it('uses the PillPing Alert tone as a safe default', () => {
    expect(getAlarmTone().id).toBe(DEFAULT_ALARM_TONE_ID);
    expect(getAlarmTone('unknown-tone').id).toBe(DEFAULT_ALARM_TONE_ID);
  });

  it('defines the available logical tones and platform resource names', () => {
    expect(ALARM_TONES.map(tone => tone.id)).toEqual([
      'pillping_alert',
      'gentle_alarm',
      'classic_alarm',
      'digital_alarm',
      'soft_chime',
    ]);
    expect(ALARM_TONES[2].androidSound).toBe('classic_alarm');
    expect(ALARM_TONES[2].iosSound).toBe('classic_alarm.wav');
  });

  it('falls back to the system sound while custom assets are not bundled', () => {
    for (const tone of ALARM_TONES) {
      expect(getAndroidAlarmSound(tone)).toBe('default');
      expect(getIOSAlarmSound(tone)).toBe('default');
    }
  });
});