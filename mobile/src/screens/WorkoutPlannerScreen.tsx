import React, { useCallback } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { palette, spacing, typography } from '../theme';
import { workoutApi } from '../services/api';
import { useOfflineQueue } from '../context/OfflineQueueContext';
import { nanoid } from 'nanoid/non-secure';

const WorkoutPlannerScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['workout'],
    queryFn: () => workoutApi.getPlan()
  });

  const { enqueue } = useOfflineQueue();

  const mutation = useMutation({
    mutationFn: (variantId: string) => workoutApi.completeWorkout(variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout'] });
      Alert.alert('Workout logged', 'Great job completing your session!');
    },
    onError: (error, variables) => {
      enqueue({
        id: nanoid(),
        type: 'workout',
        payload: { variant: variables },
        createdAt: new Date().toISOString()
      });
      Alert.alert('Queued for sync', error instanceof Error ? error.message : 'We will retry later.');
    }
  });

  const handleComplete = useCallback(
    (variantId: string) => {
      mutation.mutate(variantId);
    },
    [mutation]
  );

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={data?.options ?? []}
      keyExtractor={item => item.label}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Today&apos;s plan</Text>
          <Text style={styles.subtitle}>Personalised from your recent activity.</Text>
        </View>
      }
      refreshControl={<RefreshControl tintColor={palette.primary} refreshing={isRefetching} onRefresh={refetch} />}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{item.label}</Text>
          <Text style={styles.cardMeta}>
            {item.duration_minutes} min • {item.intensity} • {item.estimated_burn_calories} kcal
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleComplete(item.label)}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator color={palette.surface} />
            ) : (
              <Text style={styles.buttonText}>Mark complete</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Rest day</Text>
          <Text style={styles.emptySubtitle}>No workouts scheduled today. Enjoy your recovery!</Text>
        </View>
      }
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
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background
  },
  header: {
    marginBottom: spacing(2)
  },
  title: {
    ...typography.heading
  },
  subtitle: {
    ...typography.body,
    color: palette.textSecondary
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: spacing(2),
    marginBottom: spacing(2)
  },
  cardTitle: {
    ...typography.subheading
  },
  cardMeta: {
    ...typography.caption,
    marginTop: spacing(0.5)
  },
  button: {
    marginTop: spacing(1.5),
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: spacing(1),
    alignItems: 'center'
  },
  buttonText: {
    ...typography.body,
    color: palette.surface,
    fontWeight: '600'
  },
  emptyState: {
    padding: spacing(4),
    alignItems: 'center'
  },
  emptyTitle: {
    ...typography.subheading
  },
  emptySubtitle: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing(1)
  }
});

export default WorkoutPlannerScreen;
