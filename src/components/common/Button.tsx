import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

type Props = { title: string; onPress: () => void; disabled?: boolean };

export function Button({ title, onPress, disabled = false }: Props) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.button, disabled && styles.disabled]}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12, backgroundColor: '#2563EB', alignItems: 'center' },
  disabled: { opacity: 0.5 },
  text: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
