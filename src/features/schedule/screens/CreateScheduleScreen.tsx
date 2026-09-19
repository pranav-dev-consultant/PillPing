import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/AppNavigator';
import { ScheduleForm } from '../components/ScheduleForm';
import { useSchedule } from '../hooks/useSchedule';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateSchedule'>;

export function CreateScheduleScreen({ navigation }: Props) {
  const { addSchedule } = useSchedule();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (input: Parameters<typeof addSchedule>[0]) => {
    setSubmitting(true);
    try {
      await addSchedule(input);
      navigation.goBack();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Schedule</Text>
        <Text style={styles.subtitle}>Add a free-text reminder and choose when PillPing should notify you.</Text>
        <ScheduleForm onSubmit={handleSubmit} submitting={submitting} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FA' },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { marginTop: 8, lineHeight: 21, color: '#6B7280' },
});
