import React, { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAccount } from '../hooks/useAccount';

export function AccountScreen() {
  const { account, loading, updateName } = useAccount();
  const [name, setName] = useState('');

  if (loading) return <SafeAreaView style={styles.safeArea} />;

  const initialName = name || account.name;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.subtitle}>Your local PillPing profile</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput value={initialName} onChangeText={setName} style={styles.input} placeholder="Your name" />

        <Pressable onPress={() => void updateName(name || account.name)} style={styles.button}>
          <Text style={styles.buttonText}>Save</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FA' },
  container: { padding: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: { marginTop: 6, color: '#6B7280' },
  label: { marginTop: 28, marginBottom: 8, fontSize: 14, fontWeight: '600', color: '#374151' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, backgroundColor: '#FFFFFF' },
  button: { marginTop: 16, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: '#2563EB' },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
