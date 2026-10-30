import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PlaceholderScreen({ route }) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{route.params?.title}</Text>
      <Text style={styles.subtitle}>Đang phát triển</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', color: '#111' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 6 },
});
