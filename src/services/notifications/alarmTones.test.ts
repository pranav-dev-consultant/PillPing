import {
  ALARM_TONES,
  DEFAULT_ALARM_TONE_ID,
  getAlarmTone,
  getAlarmToneSelectionName,
  getSelectedAlarmTone,
  getAndroidAlarmSound,
  getIOSAlarmSound,
} from './alarmTones';

describe('alarm tone catalog', () => {
  it('uses the PillPing Alert tone as a safe default', () => {
    expect(getAlarmTone().id).toBe(DEFAULT_ALARM_TONE_ID);
    expect(DEFAULT_ALARM_TONE_ID).toBe('best_reminder');
    expect(getAlarmTone('unknown-tone').id).toBe(DEFAULT_ALARM_TONE_ID);
    expect(getAlarmTone('pillping_alert').id).toBe(DEFAULT_ALARM_TONE_ID);
  });

  it('defines the available logical tones and platform resource names', () => {
    expect(ALARM_TONES.map(tone => tone.id)).toEqual([
      'best_reminder',
      'gentle_alarm',
      'classic_alarm',
      'digital_alarm',
      'soft_chime',
    ]);
    expect(ALARM_TONES[0].name).toBe('PillPing Alert');
    expect(ALARM_TONES[0].bundled).toBe(true);
    expect(ALARM_TONES[0].androidSound).toBe('best_reminder');
    expect(ALARM_TONES[0].iosSound).toBe('best_reminder.wav');
    expect(ALARM_TONES[2].androidSound).toBe('classic_alarm');
    expect(ALARM_TONES[2].iosSound).toBe('classic_alarm.wav');
  });

  it('uses the bundled resource for PillPing Alert and preserves fallbacks for other tones', () => {
    expect(getAndroidAlarmSound(ALARM_TONES[0])).toBe('best_reminder');
    expect(getIOSAlarmSound(ALARM_TONES[0])).toBe('best_reminder.wav');
    expect(getAndroidAlarmSound(ALARM_TONES[1])).toBe('default');
    expect(getIOSAlarmSound(ALARM_TONES[1])).toBe('default');
  });

  it('resolves built-in and device selections and migrates a legacy tone ID', () => {
    expect(getSelectedAlarmTone().toneId).toBe('best_reminder');
    expect(getSelectedAlarmTone(undefined, 'gentle_alarm')).toEqual({
      source: 'builtin',
      toneId: 'gentle_alarm',
    });
    const custom = {
      source: 'device' as const,
      toneId: 'custom' as const,
      fileName: 'My Alarm.mp3',
      uri: 'content://media/external/audio/media/42',
    };
    expect(getSelectedAlarmTone(custom)).toEqual(custom);
    expect(getAlarmToneSelectionName(custom)).toBe('My Alarm.mp3');
  });
});