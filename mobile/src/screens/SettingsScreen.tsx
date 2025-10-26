import React from 'react';
import { Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePreferences } from '../context/PreferencesContext';
import { palette, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    dietaryPreference,
    setDietaryPreference,
    healthDataConsent,
    toggleHealthDataConsent,
    autoDeleteImages,
    toggleAutoDeleteImages
  } = usePreferences();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Diet profile</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Dietary preference</Text>
          <View style={styles.chipContainer}>
            {(['omnivore', 'vegetarian', 'vegan'] as const).map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.chip, dietaryPreference === option && styles.chipActive]}
                onPress={() => setDietaryPreference(option)}
              >
                <Text style={[styles.chipText, dietaryPreference === option && styles.chipTextActive]}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.label}>Health data sync</Text>
            <Text style={styles.caption}>Required for workout personalisation.</Text>
          </View>
          <Switch value={healthDataConsent} onValueChange={toggleHealthDataConsent} />
        </View>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.label}>Auto delete meal photos</Text>
            <Text style={styles.caption}>Images removed after analysis completes.</Text>
          </View>
          <Switch value={autoDeleteImages} onValueChange={toggleAutoDeleteImages} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Data controls</Text>
        <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('OfflineSync')}>
          <Text style={styles.label}>Offline queue</Text>
          <Text style={styles.link}>Open</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('mailto:privacy@infyfit.app')}>
          <Text style={styles.label}>Request data export</Text>
          <Text style={styles.link}>Email</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL('mailto:support@infyfit.app')}>
          <Text style={styles.label}>Contact support</Text>
          <Text style={styles.link}>Email</Text>
        </TouchableOpacity>
      </View>
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
  card: {
    marginTop: spacing(2),
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: spacing(2)
  },
  sectionTitle: {
    ...typography.subheading,
    marginBottom: spacing(1)
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing(1.5)
  },
  rowText: {
    flex: 1,
    marginRight: spacing(1)
  },
  label: {
    ...typography.body
  },
  caption: {
    ...typography.caption
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(1),
    marginTop: spacing(1)
  },
  chip: {
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(0.75),
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.textSecondary
  },
  chipActive: {
    backgroundColor: palette.primary
  },
  chipText: {
    ...typography.body,
    color: palette.textSecondary
  },
  chipTextActive: {
    color: palette.surface
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing(1)
  },
  link: {
    ...typography.body,
    color: palette.primary
  }
});

export default SettingsScreen;
