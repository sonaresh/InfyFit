import React, { useCallback } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOfflineQueue } from '../context/OfflineQueueContext';
import { palette, spacing, typography } from '../theme';

const OfflineSyncScreen: React.FC = () => {
  const { entries, flush, remove, syncing } = useOfflineQueue();

  const handleFlush = useCallback(async () => {
    try {
      await flush();
      Alert.alert('Sync complete', 'Offline entries were uploaded successfully.');
    } catch (error) {
      Alert.alert('Sync failed', error instanceof Error ? error.message : 'Try again soon.');
    }
  }, [flush]);

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={entries}
      keyExtractor={item => item.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Offline queue</Text>
          <Text style={styles.subtitle}>
            {entries.length === 0
              ? 'Everything is up to date.'
              : `${entries.length} pending entr${entries.length === 1 ? 'y' : 'ies'}.`}
          </Text>
          <TouchableOpacity style={styles.syncButton} onPress={handleFlush} disabled={entries.length === 0 || syncing}>
            <Text style={styles.syncText}>{syncing ? 'Syncing…' : 'Sync now'}</Text>
          </TouchableOpacity>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View>
            <Text style={styles.cardTitle}>{item.type.toUpperCase()}</Text>
            <Text style={styles.cardSubtitle}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
          <TouchableOpacity onPress={() => remove(item.id)}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No pending entries.</Text>}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background
  },
  content: {
    padding: spacing(2)
  },
  header: {
    marginBottom: spacing(2)
  },
  title: {
    ...typography.heading
  },
  subtitle: {
    ...typography.caption,
    marginTop: spacing(0.5)
  },
  syncButton: {
    marginTop: spacing(2),
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: spacing(1),
    alignItems: 'center'
  },
  syncText: {
    ...typography.body,
    color: palette.surface,
    fontWeight: '600'
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: spacing(2),
    marginBottom: spacing(1.5),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardTitle: {
    ...typography.subheading
  },
  cardSubtitle: {
    ...typography.caption,
    color: palette.textSecondary
  },
  removeText: {
    ...typography.body,
    color: palette.error
  },
  empty: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing(4)
  }
});

export default OfflineSyncScreen;
