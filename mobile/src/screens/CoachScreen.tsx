import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { coachApi } from '../services/api';
import { palette, spacing, typography } from '../theme';
import { useNotifications } from '../hooks/useNotifications';

const CoachScreen: React.FC = () => {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['coach'],
    queryFn: () => coachApi.getToday()
  });
  const { scheduleLocal } = useNotifications();

  React.useEffect(() => {
    if (!data) return;
    scheduleLocal({
      title: 'Keep the streak!',
      body: data.title
    }, 2 * 60 * 60);
  }, [data, scheduleLocal]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl tintColor={palette.primary} refreshing={isRefetching} onRefresh={refetch} />}
    >
      <Text style={styles.title}>Daily coach</Text>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={palette.primary} />
      ) : data ? (
        <View style={styles.card}>
          <Text style={styles.headline}>{data.title}</Text>
          <Text style={styles.body}>{data.body}</Text>
          <Text style={styles.category}>{data.category.toUpperCase()}</Text>
          <Text style={styles.caption}>Generated for {data.generated_for}</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.headline}>You&apos;re all set</Text>
          <Text style={styles.body}>No new insights right now. Keep logging your meals for personalised tips.</Text>
        </View>
      )}
    </ScrollView>
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
  title: {
    ...typography.heading
  },
  loader: {
    marginTop: spacing(2)
  },
  card: {
    marginTop: spacing(2),
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: spacing(2)
  },
  headline: {
    ...typography.subheading,
    marginBottom: spacing(1)
  },
  body: {
    ...typography.body,
    marginBottom: spacing(1)
  },
  category: {
    ...typography.caption,
    color: palette.primary,
    marginBottom: spacing(0.5)
  },
  caption: {
    ...typography.caption,
    color: palette.textSecondary
  }
});

export default CoachScreen;
