import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import {
  BellRing,
  AlarmClock,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  LogOut,
  Moon,
  Sun,
  Trash2,
  X,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { clearStoredValues, STORAGE_KEYS } from '../../../services/storage/storageService';
import { cancelMedicationNotifications, openAndroidAlarmPermissionSettings, reconcileScheduleNotifications } from '../../../services/notifications/notificationService';
import { clearHistory } from '../../history/services/historyService';
import { useTheme } from '../../../theme/ThemeProvider';
import type { UserAccount } from '../types/account.types';
import { useAccount } from '../hooks/useAccount';
import { getAlarmTone } from '../../../services/notifications/alarmTones';
import type { RootStackParamList } from '../../../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const SNOOZE_OPTIONS = [5, 10, 30, 60];
const SOUND_OPTIONS: { value: NonNullable<UserAccount['reminderSound']>; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'silent', label: 'Silent' },
];
const APPEARANCE_OPTIONS = [
  { value: 'system' as const, label: 'System Default', icon: CircleUserRound },
  { value: 'light' as const, label: 'Light', icon: Sun },
  { value: 'dark' as const, label: 'Dark', icon: Moon },
];

function dateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function parseDate(value?: string) {
  if (!value) return new Date(1990, 0, 1);
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return new Date(1990, 0, 1);
  }
  return parsed;
}

function ageFromDateOfBirth(value?: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) return undefined;

  const today = new Date();
  let age = today.getFullYear() - year;
  if (
    today.getMonth() < month - 1 ||
    (today.getMonth() === month - 1 && today.getDate() < day)
  ) {
    age -= 1;
  }
  return age >= 0 ? age : undefined;
}

export function AccountScreen() {
  const { account, loading, updateProfile, resetAccount } = useAccount();
  const { palette, appearance, setAppearance } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [name, setName] = useState(account.name);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => setName(account.name), [account.name]);

  const persist = async (changes: Partial<UserAccount>) => {
    setSaving(true);
    try {
      await updateProfile(changes);
    } catch {
      Alert.alert('Unable to save settings', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const chooseAvatar = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        maxWidth: 900,
        maxHeight: 900,
        quality: 0.8,
      });
      const asset = result.assets?.[0];
      if (result.didCancel || !asset?.uri) return;
      if (result.errorCode) {
        Alert.alert('Unable to select photo', result.errorMessage ?? 'Please try again.');
        return;
      }

      const extension = asset.fileName?.split('.').pop()?.toLowerCase() ?? 'jpg';
      const destination = `${RNFS.DocumentDirectoryPath}/pillping-avatar-${Date.now()}.${extension}`;
      const sourcePath = asset.originalPath ?? asset.uri;
      await RNFS.copyFile(sourcePath.replace(/^file:\/\//, ''), destination);
      const previousUri = account.profileImageUri;
      await updateProfile({ profileImageUri: `file://${destination}` });
      if (previousUri?.startsWith(`file://${RNFS.DocumentDirectoryPath}/`)) {
        await RNFS.unlink(previousUri.replace(/^file:\/\//, '')).catch(() => undefined);
      }
    } catch {
      Alert.alert('Unable to save photo', 'Please try selecting another image.');
    }
  };

  const removeAvatar = () => {
    Alert.alert('Remove profile picture?', 'Your default avatar will be shown instead.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const uri = account.profileImageUri;
          void (async () => {
            try {
              await updateProfile({ profileImageUri: undefined });
              if (uri?.startsWith(`file://${RNFS.DocumentDirectoryPath}/`)) {
                await RNFS.unlink(uri.replace(/^file:\/\//, '')).catch(() => undefined);
              }
            } catch {
              Alert.alert('Unable to remove photo', 'Please try again.');
            }
          })();
        },
      },
    ]);
  };

  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'set' && selected) void persist({ dateOfBirth: dateKey(selected) });
  };

  const clearLocalAccount = () => {
    Alert.alert(
      'Delete Account & Data?',
      'This will permanently remove your profile, medication history, schedules, and local settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setSaving(true);
              try {
                await cancelMedicationNotifications();
                const avatarUri = account.profileImageUri;
                await clearStoredValues([
                  STORAGE_KEYS.account,
                  STORAGE_KEYS.history,
                  STORAGE_KEYS.schedules,
                  STORAGE_KEYS.notificationPermissionAsked,
                ]);
                await clearHistory();
                await resetAccount();
                if (avatarUri?.startsWith(`file://${RNFS.DocumentDirectoryPath}/`)) {
                  await RNFS.unlink(avatarUri.replace(/^file:\/\//, '')).catch(() => undefined);
                }
                setName('');
                Alert.alert('Local data cleared', 'Your profile and medication data were removed.');
              } catch {
                Alert.alert('Unable to clear local data', 'Some reminders or data could not be removed. Please try again.');
              } finally {
                setSaving(false);
              }
            })();
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
        <ActivityIndicator color={palette.primary} />
      </SafeAreaView>
    );
  }

  const age = ageFromDateOfBirth(account.dateOfBirth);
  const controlStyle = { borderColor: palette.fieldBorder, backgroundColor: palette.surface };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: palette.text }]}>Account</Text>
        <Text style={[styles.subtitle, { color: palette.muted }]}>Your PillPing profile and preferences</Text>

        <SectionTitle title="Profile" color={palette.text} />
        <View style={styles.avatarBlock}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change profile picture"
            onPress={() => void chooseAvatar()}
            style={[styles.avatar, { backgroundColor: palette.selected, borderColor: palette.border }]}
          >
            {account.profileImageUri ? (
              <Image source={{ uri: account.profileImageUri }} style={styles.avatarImage} />
            ) : (
              <CircleUserRound size={42} color={palette.primary} />
            )}
            <View style={[styles.cameraBadge, { backgroundColor: palette.primary }]}>
              <Camera size={15} color="#FFFFFF" />
            </View>
          </Pressable>
          <View style={styles.avatarActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Choose profile picture" onPress={() => void chooseAvatar()}>
              <Text style={[styles.link, { color: palette.primary }]}>Choose picture</Text>
            </Pressable>
            {!!account.profileImageUri && (
              <Pressable accessibilityRole="button" accessibilityLabel="Remove profile picture" onPress={removeAvatar}>
                <Text style={[styles.removeLink, { color: palette.danger }]}>Remove</Text>
              </Pressable>
            )}
          </View>
        </View>

        <FieldLabel title="Name / Nickname" color={palette.label} />
        <TextInput
          accessibilityLabel="Name or nickname"
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={palette.muted}
          style={[styles.input, controlStyle, { color: palette.text }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save profile name"
          disabled={saving}
          onPress={() => void persist({ name })}
          style={[styles.primaryButton, { backgroundColor: palette.primary }, saving && styles.disabled]}
        >
          <Text style={styles.primaryButtonText}>{saving ? 'Saving…' : 'Save name'}</Text>
        </Pressable>

        <FieldLabel title="Date of Birth" color={palette.label} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Select date of birth"
          onPress={() => setShowDatePicker(current => !current)}
          style={[styles.selectField, controlStyle]}
        >
          <CalendarDays size={18} color={palette.muted} />
          <Text style={[styles.selectText, { color: account.dateOfBirth ? palette.text : palette.muted }]}>
            {account.dateOfBirth ? parseDate(account.dateOfBirth).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Optional'}
          </Text>
          {account.dateOfBirth ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear date of birth" onPress={() => void persist({ dateOfBirth: undefined })} hitSlop={10}>
              <X size={18} color={palette.muted} />
            </Pressable>
          ) : <ChevronDown size={18} color={palette.muted} />}
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={parseDate(account.dateOfBirth)}
            mode="date"
            maximumDate={new Date()}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
          />
        )}
        {age !== undefined && <Text style={[styles.helper, { color: palette.muted }]}>Age: {age}</Text>}

        <FieldLabel title="Blood Group" color={palette.label} />
        <View style={styles.wrapRow}>
          {BLOOD_GROUPS.map(group => {
            const selected = account.bloodGroup === group;
            return (
              <Pressable
                key={group}
                accessibilityRole="radio"
                accessibilityLabel={`Blood group ${group}`}
                accessibilityState={{ selected }}
                onPress={() => void persist({ bloodGroup: selected ? undefined : group })}
                style={[styles.choice, controlStyle, selected && { backgroundColor: palette.selected, borderColor: palette.primary }]}
              >
                <Text style={[styles.choiceText, { color: selected ? palette.selectedText : palette.label }]}>{group}</Text>
              </Pressable>
            );
          })}
        </View>

        <SectionTitle title="Reminder Settings" color={palette.text} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Alarm Tone, ${getAlarmTone(account.alarmTone).name}`}
          onPress={() => navigation.navigate('AlarmTone')}
          style={[styles.selectField, controlStyle, styles.alarmToneRow]}
        >
          <BellRing size={18} color={palette.primary} />
          <View style={styles.alarmToneText}>
            <Text style={[styles.choiceText, { color: palette.label }]}>Alarm Tone</Text>
            <Text style={[styles.helper, styles.alarmToneValue, { color: palette.muted }]}>{getAlarmTone(account.alarmTone).name}</Text>
          </View>
          <ChevronRight size={18} color={palette.muted} />
        </Pressable>
        <SettingHeading icon={<BellRing size={18} color={palette.primary} />} title="Reminder Sound" color={palette.label} />
        <View style={styles.wrapRow}>
          {SOUND_OPTIONS.map(option => (
            <ChoiceButton
              key={option.value}
              label={option.label}
              selected={(account.reminderSound ?? 'default') === option.value}
              onPress={() => {
                void persist({ reminderSound: option.value }).then(() => reconcileScheduleNotifications());
              }}
              palette={palette}
            />
          ))}
        </View>
        <Text style={[styles.helper, { color: palette.muted }]}>iOS supports the system default sound or silence. Android uses the sound assigned to its reminder channel.</Text>

        <SettingHeading icon={<CalendarDays size={18} color={palette.primary} />} title="Snooze Duration" color={palette.label} />
        <View style={styles.wrapRow}>
          {SNOOZE_OPTIONS.map(minutes => (
            <ChoiceButton
              key={minutes}
              label={`${minutes} min`}
              selected={(account.snoozeDurationMinutes ?? 10) === minutes}
              onPress={() => void persist({ snoozeDurationMinutes: minutes })}
              palette={palette}
              accessibilityLabel={`Snooze for ${minutes} minutes`}
            />
          ))}
        </View>
        {Platform.OS === 'android' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open exact alarm access settings"
            onPress={() => {
              openAndroidAlarmPermissionSettings().catch(() => {
                Alert.alert('Unable to open alarm settings', 'Open PillPing in Android Settings to manage exact alarms.');
              });
            }}
            style={[styles.actionRow, controlStyle, styles.alarmSettingsRow]}
          >
            <AlarmClock size={18} color={palette.primary} />
            <Text style={[styles.actionText, { color: palette.label }]}>Exact alarm access</Text>
            <ChevronRight size={18} color={palette.muted} />
          </Pressable>
        )}

        <SectionTitle title="Appearance" color={palette.text} />
        <View style={styles.wrapRow}>
          {APPEARANCE_OPTIONS.map(option => {
            const Icon = option.icon;
            const selected = appearance === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityLabel={`Appearance: ${option.label}`}
                accessibilityState={{ selected }}
                onPress={() => void setAppearance(option.value)}
                style={[styles.appearanceChoice, controlStyle, selected && { backgroundColor: palette.selected, borderColor: palette.primary }]}
              >
                <Icon size={18} color={selected ? palette.primary : palette.muted} />
                <Text style={[styles.choiceText, { color: selected ? palette.selectedText : palette.label }]}>{option.label}</Text>
                {selected && <Check size={16} color={palette.primary} />}
              </Pressable>
            );
          })}
        </View>

        <SectionTitle title="Account Actions" color={palette.text} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log out"
          onPress={() => Alert.alert('No account session', 'PillPing is currently local-only, so there is no sign-in session to log out of.')}
          style={[styles.actionRow, controlStyle]}
        >
          <LogOut size={18} color={palette.label} />
          <Text style={[styles.actionText, { color: palette.label }]}>Log Out</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete account and clear local data"
          disabled={saving}
          onPress={clearLocalAccount}
          style={[styles.actionRow, styles.destructiveRow, { borderColor: palette.danger }]}
        >
          <Trash2 size={18} color={palette.danger} />
          <Text style={[styles.actionText, { color: palette.danger }]}>Delete Account / Clear Data</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ title, color }: { title: string; color: string }) {
  return <Text style={[styles.sectionTitle, { color }]}>{title}</Text>;
}

function FieldLabel({ title, color }: { title: string; color: string }) {
  return <Text style={[styles.label, { color }]}>{title}</Text>;
}

function SettingHeading({ icon, title, color }: { icon: React.ReactNode; title: string; color: string }) {
  return (
    <View style={styles.settingHeading}>
      {icon}
      <Text style={[styles.label, styles.settingLabel, { color }]}>{title}</Text>
    </View>
  );
}

function ChoiceButton({
  label,
  selected,
  onPress,
  palette,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  palette: ReturnType<typeof useTheme>['palette'];
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.choice, { borderColor: palette.fieldBorder, backgroundColor: palette.surface }, selected && { backgroundColor: palette.selected, borderColor: palette.primary }]}
    >
      <Text style={[styles.choiceText, { color: selected ? palette.selectedText : palette.label }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 44 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { marginTop: 6, marginBottom: 8 },
  sectionTitle: { marginTop: 28, marginBottom: 12, fontSize: 18, fontWeight: '700' },
  avatarBlock: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 76, height: 76, borderRadius: 38, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 74, height: 74, borderRadius: 37 },
  cameraBadge: { position: 'absolute', right: -2, bottom: -2, width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  avatarActions: { marginLeft: 16, gap: 10 },
  link: { fontSize: 14, fontWeight: '600' },
  removeLink: { fontSize: 14, fontWeight: '600' },
  label: { marginTop: 16, marginBottom: 8, fontSize: 14, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  primaryButton: { marginTop: 12, paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  selectField: { minHeight: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectText: { flex: 1, fontSize: 15 },
  alarmToneRow: { marginTop: 8, minHeight: 62 },
  alarmToneText: { flex: 1 },
  alarmToneValue: { marginTop: 3, marginBottom: 0 },
  alarmSettingsRow: { marginTop: 10 },
  helper: { marginTop: 7, fontSize: 13, lineHeight: 18 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { minHeight: 40, paddingHorizontal: 14, borderWidth: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  choiceText: { fontSize: 14, fontWeight: '600' },
  settingHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingLabel: { marginTop: 18, marginBottom: 8 },
  appearanceChoice: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 11, borderWidth: 1, borderRadius: 9 },
  actionRow: { minHeight: 50, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  actionText: { fontSize: 15, fontWeight: '600' },
  destructiveRow: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.55 },
});
