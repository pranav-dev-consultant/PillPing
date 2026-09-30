import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, ChevronRight, Circle, FolderOpen, Play, Volume2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAccount } from '../hooks/useAccount';
import {
  ALARM_TONES,
  DEFAULT_ALARM_TONE_ID,
  getSelectedAlarmTone,
  type AlarmToneId,
  type AlarmToneSelection,
} from '../../../services/notifications/alarmTones';
import {
  previewAlarmTone,
  reconcileScheduleNotifications,
  stopAlarmTonePreview,
} from '../../../services/notifications/notificationService';
import {
  createDeviceAlarmToneChannel,
  deleteDeviceAlarmTone,
  isDeviceAlarmToneSupported,
  pickDeviceAlarmTone,
} from '../../../services/notifications/deviceAlarmTone';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { useTheme } from '../../../theme/ThemeProvider';

export function AlarmToneScreen() {
  const { account, updateProfile } = useAccount();
  const { palette } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'AlarmTone'>>();
  const [previewing, setPreviewing] = useState<AlarmToneId | 'device' | null>(null);
  const [saving, setSaving] = useState(false);
  const [deviceSupported, setDeviceSupported] = useState(false);
  const selectedTone = getSelectedAlarmTone(account.alarmToneSelection, account.alarmTone);
  const selectedBuiltinTone = selectedTone.source === 'builtin' ? selectedTone.toneId : null;
  const selectedDeviceTone = selectedTone.source === 'device' ? selectedTone : null;

  useEffect(() => {
    isDeviceAlarmToneSupported().then(setDeviceSupported).catch(() => setDeviceSupported(false));
    return navigation.addListener('blur', () => {
      stopAlarmTonePreview().catch(() => undefined);
    });
  }, [navigation]);

  const preview = async (selection: AlarmToneSelection, previewId: AlarmToneId | 'device') => {
    setPreviewing(previewId);
    try {
      await previewAlarmTone(selection);
    } catch {
      Alert.alert('Unable to preview tone', 'Allow notifications in Settings, then try again.');
    } finally {
      setPreviewing(null);
    }
  };

  const select = async (toneId: AlarmToneId) => {
    if (selectedTone.source === 'builtin' && toneId === selectedTone.toneId) {
      navigation.goBack();
      return;
    }

    await stopAlarmTonePreview();
    setSaving(true);
    try {
      await updateProfile({
        alarmTone: toneId,
        alarmToneSelection: { source: 'builtin', toneId },
      });
      await reconcileScheduleNotifications();
      if (selectedDeviceTone) {
        await deleteDeviceAlarmTone(selectedDeviceTone.uri).catch(() => undefined);
      }
      navigation.goBack();
    } catch {
      Alert.alert('Unable to save tone', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const chooseDeviceTone = async () => {
    if (!deviceSupported) {
      Alert.alert(
        'Device tones unavailable',
        Platform.OS === 'ios'
          ? 'iOS notification sounds must be bundled with the app. Device audio can’t be used for medicine alarms.'
          : 'Custom notification sounds require Android 8 or later.',
      );
      return;
    }

    await stopAlarmTonePreview();
    setSaving(true);
    let importedUri: string | undefined;
    let selectionSaved = false;
    try {
      const imported = await pickDeviceAlarmTone();
      if (!imported) return;
      importedUri = imported.uri;
      const selection: AlarmToneSelection = {
        source: 'device',
        toneId: 'custom',
        fileName: imported.fileName,
        uri: imported.uri,
      };
      await createDeviceAlarmToneChannel(imported.uri, imported.fileName, true);
      await updateProfile({
        alarmTone: DEFAULT_ALARM_TONE_ID,
        alarmToneSelection: selection,
      });
      selectionSaved = true;
      await reconcileScheduleNotifications();
      if (selectedDeviceTone && selectedDeviceTone.uri !== imported.uri) {
        await deleteDeviceAlarmTone(selectedDeviceTone.uri).catch(() => undefined);
      }
    } catch (error) {
      if (importedUri && !selectionSaved) {
        await deleteDeviceAlarmTone(importedUri).catch(() => undefined);
      }
      const message = error instanceof Error ? error.message : 'Please choose another audio file.';
      Alert.alert('Unable to use this audio file', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.intro}>
          <Volume2 size={20} color={palette.primary} />
          <Text style={[styles.introTitle, { color: palette.text }]}>Choose a reminder tone</Text>
        </View>
        {ALARM_TONES.map(tone => {
          const selected = tone.id === selectedBuiltinTone;
          const isPreviewing = previewing === tone.id;
          return (
            <View
              key={tone.id}
              style={[styles.toneRow, { borderColor: selected ? palette.primary : palette.border, backgroundColor: palette.surface }]}
            >
              <Pressable
                accessibilityRole="radio"
                accessibilityLabel={tone.name}
                accessibilityState={{ selected }}
                disabled={saving}
                onPress={() => { select(tone.id); }}
                style={styles.selectButton}
              >
                {selected ? <Check size={19} color={palette.primary} /> : <Circle size={19} color={palette.muted} />}
                <View style={styles.toneText}>
                  <Text style={[styles.toneName, { color: palette.text }]}>{tone.name}</Text>
                  {tone.recommended && <Text style={[styles.recommended, { color: palette.primary }]}>Recommended</Text>}
                </View>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Preview ${tone.name}`}
                disabled={previewing !== null || saving}
                onPress={() => {
                  preview({ source: 'builtin', toneId: tone.id }, tone.id);
                }}
                style={[styles.previewButton, { backgroundColor: palette.selected }]}
              >
                {isPreviewing ? <ActivityIndicator size="small" color={palette.primary} /> : <Play size={17} color={palette.primary} />}
              </Pressable>
            </View>
          );
        })}
        {selectedDeviceTone && (
          <View style={[styles.toneRow, { borderColor: palette.primary, backgroundColor: palette.surface }]}>
            <View style={styles.selectButton}>
              <Check size={19} color={palette.primary} />
              <View style={styles.toneText}>
                <Text style={[styles.toneName, { color: palette.text }]} numberOfLines={1}>{selectedDeviceTone.fileName}</Text>
                <Text style={[styles.recommended, { color: palette.primary }]}>Selected from device</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Preview ${selectedDeviceTone.fileName}`}
              disabled={previewing !== null || saving}
              onPress={() => { preview(selectedDeviceTone, 'device'); }}
              style={[styles.previewButton, { backgroundColor: palette.selected }]}
            >
              {previewing === 'device' ? <ActivityIndicator size="small" color={palette.primary} /> : <Play size={17} color={palette.primary} />}
            </Pressable>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose alarm tone from device"
          disabled={saving || !deviceSupported}
          onPress={() => { chooseDeviceTone(); }}
          style={[
            styles.deviceRow,
            { borderColor: palette.border, backgroundColor: palette.surface },
            !deviceSupported && styles.disabledDeviceRow,
          ]}
        >
          <FolderOpen size={20} color={palette.primary} />
          <View style={styles.toneText}>
            <Text style={[styles.toneName, { color: palette.text }]}>Choose from device</Text>
            <Text style={[styles.recommended, { color: palette.muted }]}>Select your own alarm sound</Text>
          </View>
          <ChevronRight size={18} color={palette.muted} />
        </Pressable>
        <Text style={[styles.note, { color: palette.muted }]}>
          {Platform.OS === 'ios'
            ? 'iOS allows notification sounds bundled with PillPing only. Device audio selection is unavailable for medicine alarms.'
            : deviceSupported
              ? 'MP3, WAV, M4A, and AAC files are imported as device notification sounds for future reminders.'
              : 'Device notification sounds require Android 8 or later.'}
        </Text>
        {saving && <ActivityIndicator style={styles.saving} color={palette.primary} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 32, gap: 10 },
  intro: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 6 },
  introTitle: { fontSize: 16, fontWeight: '700' },
  toneRow: { minHeight: 66, borderWidth: 1, borderRadius: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  deviceRow: { minHeight: 66, borderWidth: 1, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12 },
  disabledDeviceRow: { opacity: 0.62 },
  selectButton: { flex: 1, minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12 },
  toneText: { flex: 1 },
  toneName: { fontSize: 15, fontWeight: '600' },
  recommended: { marginTop: 3, fontSize: 12, fontWeight: '600' },
  previewButton: { width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  note: { marginTop: 8, fontSize: 13, lineHeight: 19 },
  saving: { marginTop: 4 },
});