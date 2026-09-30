import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, Circle, Play, Volume2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAccount } from '../hooks/useAccount';
import { ALARM_TONES, getAlarmTone, type AlarmToneId } from '../../../services/notifications/alarmTones';
import { previewAlarmTone, reconcileScheduleNotifications } from '../../../services/notifications/notificationService';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { useTheme } from '../../../theme/ThemeProvider';

export function AlarmToneScreen() {
  const { account, updateProfile } = useAccount();
  const { palette } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'AlarmTone'>>();
  const [previewing, setPreviewing] = useState<AlarmToneId | null>(null);
  const [saving, setSaving] = useState(false);
  const selectedTone = getAlarmTone(account.alarmTone).id;

  const preview = async (toneId: AlarmToneId) => {
    setPreviewing(toneId);
    try {
      await previewAlarmTone(toneId);
    } catch {
      Alert.alert('Unable to preview tone', 'Allow notifications in Settings, then try again.');
    } finally {
      setPreviewing(null);
    }
  };

  const select = async (toneId: AlarmToneId) => {
    if (toneId === selectedTone) {
      navigation.goBack();
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ alarmTone: toneId });
      await reconcileScheduleNotifications();
      navigation.goBack();
    } catch {
      Alert.alert('Unable to save tone', 'Please try again.');
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
          const selected = tone.id === selectedTone;
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
                onPress={() => { preview(tone.id); }}
                style={[styles.previewButton, { backgroundColor: palette.selected }]}
              >
                {isPreviewing ? <ActivityIndicator size="small" color={palette.primary} /> : <Play size={17} color={palette.primary} />}
              </Pressable>
            </View>
          );
        })}
        <Text style={[styles.note, { color: palette.muted }]}>
          Custom tone audio files are not bundled yet. Preview and reminders use the system notification sound until the tone files are added.
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
  selectButton: { flex: 1, minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12 },
  toneText: { flex: 1 },
  toneName: { fontSize: 15, fontWeight: '600' },
  recommended: { marginTop: 3, fontSize: 12, fontWeight: '600' },
  previewButton: { width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  note: { marginTop: 8, fontSize: 13, lineHeight: 19 },
  saving: { marginTop: 4 },
});