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

import type {
  CreateScheduleInput,
  CustomRepeatType,
  Schedule,
} from '../types/schedule.types';
import { getRepeatSummary } from '../utils/scheduleUtils';
import { useTheme } from '../../../theme/ThemeProvider';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const REPEAT_OPTIONS = ['once', 'daily', 'weekly', 'custom'] as const;
const CUSTOM_REPEAT_OPTIONS: { value: CustomRepeatType; label: string }[] = [
  { value: 'specific_days', label: 'Specific Days' },
  { value: 'every_other_day', label: 'Every Other Day' },
];

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

function formatStoredDate(value: Date) {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

function formatDisplayDate(value: Date) {
  return value.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function parseStoredTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function parseStoredDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date();
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function ScheduleForm({
  initialSchedule,
  onSubmit,
  submitting = false,
  submitLabel = 'Create',
}: Props) {
  const { palette } = useTheme();
  const [title, setTitle] = useState(initialSchedule?.title ?? '');
  const [dose, setDose] = useState(String(initialSchedule?.dose ?? 1));
  const [selectedDate, setSelectedDate] = useState(() =>
    initialSchedule ? parseStoredDate(initialSchedule.startDate) : new Date(),
  );
  const [selectedTime, setSelectedTime] = useState(() => {
    if (initialSchedule) return parseStoredTime(initialSchedule.time);
    const value = new Date();
    value.setHours(8, 0, 0, 0);
    return value;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [repeat, setRepeat] =
    useState<CreateScheduleInput['repeat']['type']>(initialSchedule?.repeat.type ?? 'daily');
  const [customRepeatType, setCustomRepeatType] = useState<CustomRepeatType>(
    initialSchedule?.repeat.customRepeatType ?? 'specific_days',
  );
  const [customDays, setCustomDays] = useState<string[]>(
    () => [...(initialSchedule?.repeat.customDays ?? [])],
  );
  const [error, setError] = useState('');

  const isValid = useMemo(
    () =>
      title.trim().length > 0 &&
      Number.isInteger(Number(dose)) &&
      Number(dose) > 0 &&
      (repeat !== 'custom' ||
        customRepeatType === 'every_other_day' ||
        customDays.length > 0),
    [customDays.length, customRepeatType, dose, repeat, title],
  );

  const onTimeChange = (event: DateTimePickerEvent, value?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (event.type === 'set' && value) {
      setSelectedTime(value);
    }
  };

  const onDateChange = (event: DateTimePickerEvent, value?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'set' && value) {
      setSelectedDate(value);
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

    if (
      repeat === 'custom' &&
      customRepeatType === 'specific_days' &&
      customDays.length === 0
    ) {
      setError('Select at least one repeat day.');
      return;
    }

    setError('');

    await onSubmit({
      title: title.trim(),
      dose: numericDose,
      time: formatStoredTime(selectedTime),
      startDate: formatStoredDate(selectedDate),
      repeat: {
        type: repeat,
        ...(repeat === 'custom' ? { customRepeatType } : {}),
        ...(repeat === 'custom' && customRepeatType === 'specific_days'
          ? { customDays }
          : {}),
      },
      isActive: true,
    });
  };

  return (
    <View>
      <Text style={[styles.label, { color: palette.label }]}>Medicine / reminder</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Vitamin D"
        style={[styles.input, { borderColor: palette.fieldBorder, backgroundColor: palette.surface, color: palette.text }]}
        returnKeyType="done"
      />

      <Text style={[styles.label, { color: palette.label }]}>Dose</Text>
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
        style={[styles.input, { borderColor: palette.fieldBorder, backgroundColor: palette.surface, color: palette.text }]}
        maxLength={3}
      />

      <Text style={[styles.label, { color: palette.label }]}>Time</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setShowTimePicker(!showTimePicker)}
        style={[styles.input, { borderColor: palette.fieldBorder, backgroundColor: palette.surface }]}
      >
        <Text style={[styles.timeText, { color: palette.text }]}>{formatDisplayTime(selectedTime)}</Text>
      </Pressable>

      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
        />
      )}

      <Text style={[styles.label, { color: palette.label }]}>Start date</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setShowDatePicker(!showDatePicker)}
        style={[styles.input, { borderColor: palette.fieldBorder, backgroundColor: palette.surface }]}
      >
        <Text style={[styles.timeText, { color: palette.text }]}>{formatDisplayDate(selectedDate)}</Text>
      </Pressable>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}

      <Text style={[styles.label, { color: palette.label }]}>Repeat</Text>
      <View style={styles.row}>
        {REPEAT_OPTIONS.map(option => (
          <Pressable
            key={option}
            onPress={() => setRepeat(option)}
            style={[styles.option, { borderColor: palette.fieldBorder, backgroundColor: palette.surface }, repeat === option && { backgroundColor: palette.primary, borderColor: palette.primary }]}
          >
            <Text
              style={[
                styles.optionText,
                { color: repeat === option ? '#FFFFFF' : palette.label },
              ]}
            >
              {option[0].toUpperCase() + option.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {repeat === 'custom' && (
        <View>
          <Text style={[styles.subLabel, { color: palette.label }]}>Custom repeat</Text>
          <View style={styles.row}>
            {CUSTOM_REPEAT_OPTIONS.map(option => (
              <Pressable
                key={option.value}
                onPress={() => {
                  setCustomRepeatType(option.value);
                  if (option.value === 'every_other_day') {
                    setCustomDays([]);
                  }
                }}
                style={[
                  styles.option,
                  { borderColor: palette.fieldBorder, backgroundColor: palette.surface },
                  customRepeatType === option.value && { backgroundColor: palette.primary, borderColor: palette.primary },
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: customRepeatType === option.value ? '#FFFFFF' : palette.label },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {customRepeatType === 'every_other_day' && (
            <Text style={[styles.helperText, { color: palette.muted }]}>
              Takes the medicine every 2 days starting from the selected date.
            </Text>
          )}
        </View>
      )}

      {repeat === 'custom' && customRepeatType === 'specific_days' && (
        <View style={styles.daysRow}>
          {DAYS.map(day => {
            const selected = customDays.includes(day);

            return (
              <Pressable
                key={day}
                onPress={() => toggleCustomDay(day)}
                style={[styles.day, { borderColor: palette.fieldBorder, backgroundColor: palette.surface }, selected && { backgroundColor: palette.selected, borderColor: palette.primary }]}
              >
                <Text style={[styles.dayText, { color: selected ? palette.selectedText : palette.label }]}>
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {!!error && <Text style={[styles.error, { color: palette.danger }]}>{error}</Text>}

      <Text style={[styles.repeatSummary, { color: palette.label }]}>
        {getRepeatSummary({
          repeat,
          customRepeatType: repeat === 'custom' ? customRepeatType : undefined,
          customDays: repeat === 'custom' ? customDays : undefined,
          startDate: formatStoredDate(selectedDate),
          time: formatStoredTime(selectedTime),
        })}
      </Text>

      <Pressable
        disabled={submitting || !isValid}
        onPress={() => void submit()}
        style={[styles.button, { backgroundColor: palette.primary }, (!isValid || submitting) && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>
          {submitting ? 'Saving…' : submitLabel}
        </Text>
      </Pressable>
    </View>
  );
}

type Props = {
  initialSchedule?: Schedule;
  onSubmit: (input: CreateScheduleInput) => Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
};

const styles = StyleSheet.create({
  label: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  subLabel: {
    marginTop: 12,
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
  helperText: {
    marginTop: 8,
    color: '#6B7280',
    lineHeight: 20,
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
  repeatSummary: {
    marginTop: 20,
    marginBottom: 0,
    color: '#374151',
    fontSize: 15,
    lineHeight: 21,
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
