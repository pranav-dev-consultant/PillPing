# Notification sound assets

`alarmTones.ts` is the shared logical tone catalog. Android resource names omit file extensions and belong under `android/app/src/main/res/raw/`. iOS filenames belong in the app bundle and must be included in the PillPing target's Copy Bundle Resources build phase.

| Tone ID | Android resource | iOS resource |
| --- | --- | --- |
| `best_reminder` | `best_reminder` | `best_reminder.wav` |
| `gentle_alarm` | `gentle_alarm` | `gentle_alarm.wav` |
| `classic_alarm` | `classic_alarm` | `classic_alarm.wav` |
| `digital_alarm` | `digital_alarm` | `digital_alarm.wav` |
| `soft_chime` | `soft_chime` | `soft_chime.wav` |

`best_reminder.mp3` is bundled directly as Android's `res/raw/best_reminder.mp3`; iOS uses the PCM WAV conversion `PillPing/best_reminder.wav`, registered in the target's Copy Bundle Resources phase. Android users can also choose MP3, WAV, M4A, or AAC audio. The app imports a private copy into `Ringtones/PillPing` in MediaStore and creates one immutable channel per selected sound, not per medicine. iOS does not expose device-file selection because notification sounds must be bundled with the app.

iOS custom notification sounds must meet Apple's supported format and duration limits; iOS notification sounds play once and cannot be looped by the local notification API. Android reminders request `loopSound` and keep the notification ongoing until an action handles it.

Android sound and importance are fixed when a notification channel is first created. The channel namespace is `medicine-reminders-v1`; updating creates new channels for the bundled tone and device-selected sounds. Rebuild and install the updated app; no uninstall is needed. Android may retain old channels in system settings, but PillPing schedules against the new channel IDs.