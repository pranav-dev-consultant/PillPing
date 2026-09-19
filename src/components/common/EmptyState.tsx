import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = { title: string; message: string };

export function EmptyState({ title, message }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  message: { marginTop: 8, color: '#6B7280', textAlign: 'center' },
});
