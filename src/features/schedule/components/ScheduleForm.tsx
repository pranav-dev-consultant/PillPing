import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import type { CreateScheduleInput } from '../types/schedule.types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const REPEAT_OPTIONS = ['once', 'daily', 'weekly', 'custom'] as const;

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatStoredTime(value: Date) {
  return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function formatDisplayTime(value: Date) {
  return value.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function ScheduleForm({ onSubmit, submitting = false }: Props) {
  const [title, setTitle] = useState('');
  const [dose, setDose] = useState('1');
  const [selectedTime, setSelectedTime] = useState(() => {
    const value = new Date();
    value.setHours(8, 0, 0, 0);
    return value;
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [repeat, setRepeat] =
    useState<CreateScheduleInput['repeat']['type']>('daily');
  const [customDays, setCustomDays] = useState<string[]>([]);
  const [error, setError] = useState('');

  const isValid = useMemo(
    () =>
      title.trim().length > 0 &&
      Number.isInteger(Number(dose)) &&
      Number(dose) > 0 &&
      (repeat !== 'custom' || customDays.length > 0),
    [customDays.length, dose, repeat, title],
  );

  const onTimeChange = (event: DateTimePickerEvent, value?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (event.type === 'set' && value) {
      setSelectedTime(value);
    }
  };

  const toggleCustomDay = (day: string) => {
    setCustomDays(current =>
      current.includes(day)
        ? current.filter(item => item !== day)
        : [...current, day],
    );
  };

  const submit = async () => {
    if (!title.trim()) {
      setError('Enter a medicine or reminder name.');
      return;
    }

    const numericDose = Number(dose);
    if (!Number.isInteger(numericDose) || numericDose <= 0) {
      setError('Dose must be a positive whole number.');
      return;
    }

    if (repeat === 'custom' && customDays.length === 0) {
      setError('Select at least one repeat day.');
      return;
    }

    setError('');

    await onSubmit({
      title: title.trim(),
      dose: numericDose,
      time: formatStoredTime(selectedTime),
      startDate: new Date().toISOString().slice(0, 10),
      repeat: {
        type: repeat,
        ...(repeat === 'custom' ? { customDays } : {}),
      },
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

      <Text style={styles.label}>Dose</Text>
      <TextInput
        value={dose}
        onChangeText={value => {
          // Allows only numbers and a single decimal point
          const cleaned = value.replace(/[^0-9.]/g, '');
          // Prevents multiple decimals (e.g., 1.2.3 becomes 1.23)
          const parts = cleaned.split('.');
          const finalValue = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;

          setDose(finalValue);
        }}
        placeholder="1"
        keyboardType="decimal-pad"
        style={styles.input}
        maxLength={3}
      />

      <Text style={styles.label}>Time</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setShowTimePicker(!showTimePicker)}
        style={styles.input}
      >
        <Text style={styles.timeText}>{formatDisplayTime(selectedTime)}</Text>
      </Pressable>

      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
        />
      )}

      <Text style={styles.label}>Repeat</Text>
      <View style={styles.row}>
        {REPEAT_OPTIONS.map(option => (
          <Pressable
            key={option}
            onPress={() => setRepeat(option)}
            style={[styles.option, repeat === option && styles.optionActive]}
          >
            <Text
              style={[
                styles.optionText,
                repeat === option && styles.optionTextActive,
              ]}
            >
              {option[0].toUpperCase() + option.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {repeat === 'custom' && (
        <View style={styles.daysRow}>
          {DAYS.map(day => {
            const selected = customDays.includes(day);

            return (
              <Pressable
                key={day}
                onPress={() => toggleCustomDay(day)}
                style={[styles.day, selected && styles.dayActive]}
              >
                <Text style={[styles.dayText, selected && styles.dayTextActive]}>
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        disabled={submitting || !isValid}
        onPress={() => void submit()}
        style={[styles.button, (!isValid || submitting) && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>
          {submitting ? 'Saving…' : 'Create Schedule'}
        </Text>
      </Pressable>
    </View>
  );
}

type Props = {
  onSubmit: (input: CreateScheduleInput) => Promise<void>;
  submitting?: boolean;
};

const styles = StyleSheet.create({
  label: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  timeText: {
    fontSize: 16,
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
  },
  optionActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  optionText: {
    color: '#374151',
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  day: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  dayActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  dayText: {
    color: '#374151',
    fontWeight: '600',
  },
  dayTextActive: {
    color: '#1D4ED8',
  },
  error: {
    marginTop: 12,
    color: '#DC2626',
  },
  button: {
    marginTop: 28,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#2563EB',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
