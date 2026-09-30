# Notification sound assets

`alarmTones.ts` is the shared logical tone catalog. Android resource names omit file extensions and belong under `android/app/src/main/res/raw/`. iOS filenames belong in the app bundle and must be included in the PillPing target's Copy Bundle Resources build phase.

| Tone ID | Android resource | iOS resource |
| --- | --- | --- |
| `pillping_alert` | `pillping_alert` | `pillping_alert.wav` |
| `gentle_alarm` | `gentle_alarm` | `gentle_alarm.wav` |
| `classic_alarm` | `classic_alarm` | `classic_alarm.wav` |
| `digital_alarm` | `digital_alarm` | `digital_alarm.wav` |
| `soft_chime` | `soft_chime` | `soft_chime.wav` |

After adding all required platform assets, set each catalog entry's `bundled` value to `true`. iOS custom notification sounds must meet Apple's supported format and duration limits. Android sound and importance are fixed when a notification channel is first created, so increment the `medicine-reminders-v2` channel version in `notificationService.ts` when changing bundled sounds for an installed app. Rebuild and reinstall after native resources change.