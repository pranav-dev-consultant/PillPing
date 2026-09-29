import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { ScheduleForm } from '../components/ScheduleForm';
import { useSchedule } from '../hooks/useSchedule';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateSchedule'>;

export function CreateScheduleScreen({ navigation, route }: Props) {
  const { addSchedule, editSchedule } = useSchedule();
  const { palette } = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const schedule = route.params?.mode === 'edit' ? route.params.schedule : undefined;
  const isEditing = Boolean(schedule);

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Schedule' : 'Create Schedule' });
  }, [isEditing, navigation]);

  const handleSubmit = async (input: Parameters<typeof addSchedule>[0]) => {
    setSubmitting(true);
    try {
      if (schedule) {
        await editSchedule(schedule.id, input);
      } else {
        await addSchedule(input);
      }
      navigation.goBack();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: palette.text }]}>{isEditing ? 'Edit Schedule' : 'Create Schedule'}</Text>
        <Text style={[styles.subtitle, { color: palette.muted }]}>Add a free-text reminder and choose when PillPing should notify you.</Text>
        <ScheduleForm
          initialSchedule={schedule}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitLabel={isEditing ? 'Update' : 'Create'}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { marginTop: 8, lineHeight: 21 },
});
