import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { CreateScheduleInput } from '../types/schedule.types';

type Props = {
  onSubmit: (input: CreateScheduleInput) => Promise<void>;
  submitting?: boolean;
};

export function ScheduleForm({ onSubmit, submitting = false }: Props) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('08:00');
  const [repeat, setRepeat] = useState<CreateScheduleInput['repeat']['type']>('daily');

  const submit = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    await onSubmit({
      title: trimmed,
      time,
      startDate: new Date().toISOString().slice(0, 10),
      repeat: { type: repeat },
      isActive: true,
    });
  };

  return (
    <View>
      <Text style={styles.label}>Medicine / reminder</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Vitamin D"
        style={styles.input}
        returnKeyType="done"
      />

      <Text style={styles.label}>Time</Text>
      <TextInput
        value={time}
        onChangeText={setTime}
        placeholder="HH:mm"
        keyboardType="numbers-and-punctuation"
        maxLength={5}
        style={styles.input}
      />

      <Text style={styles.label}>Repeat</Text>
      <View style={styles.row}>
        {(['once', 'daily', 'weekly'] as const).map(option => (
          <Pressable
            key={option}
            onPress={() => setRepeat(option)}
            style={[styles.option, repeat === option && styles.optionActive]}
          >
            <Text style={[styles.optionText, repeat === option && styles.optionTextActive]}>
              {option[0].toUpperCase() + option.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable disabled={submitting || !title.trim()} onPress={() => void submit()} style={[styles.button, (!title.trim() || submitting) && styles.buttonDisabled]}>
        <Text style={styles.buttonText}>{submitting ? 'Saving…' : 'Create Schedule'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginTop: 16, marginBottom: 8, fontSize: 14, fontWeight: '600', color: '#374151' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, backgroundColor: '#FFFFFF' },
  row: { flexDirection: 'row', gap: 8 },
  option: { flex: 1, alignItems: 'center', paddingVertical: 12, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12 },
  optionActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  optionText: { color: '#374151', fontWeight: '600' },
  optionTextActive: { color: '#FFFFFF' },
  button: { marginTop: 28, paddingVertical: 15, borderRadius: 14, alignItems: 'center', backgroundColor: '#2563EB' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
