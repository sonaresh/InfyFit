import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { spacing, palette, typography } from '../theme';
import { mealScanApi, MealScanResponse } from '../services/api';
import { useCameraPermission } from '../hooks/useCameraPermission';
import { usePreferences } from '../context/PreferencesContext';
import { useOfflineQueue } from '../context/OfflineQueueContext';
import { nanoid } from 'nanoid/non-secure';

const MealScanScreen: React.FC = () => {
  const cameraRef = useRef<Camera | null>(null);
  const [previewUri, setPreviewUri] = useState<string | undefined>();
  const [analysis, setAnalysis] = useState<MealScanResponse | undefined>();
  const [loading, setLoading] = useState(false);
  const permission = useCameraPermission();
  const { autoDeleteImages } = usePreferences();
  const { enqueue } = useOfflineQueue();

  const handleAnalyse = useCallback(async () => {
    if (!cameraRef.current) {
      return;
    }

    let captured: { base64?: string; uri?: string } | undefined;

    try {
      setLoading(true);
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7, skipProcessing: true });
      captured = photo;
      setPreviewUri(photo.uri);

      if (!photo.base64) {
        throw new Error('Failed to capture image data');
      }

      const result = await mealScanApi.analyseImage(photo.base64);
      setAnalysis(result);

      if (autoDeleteImages) {
        setPreviewUri(undefined);
      }
    } catch (error) {
      console.error(error);
      enqueue({
        id: nanoid(),
        type: 'meal',
        payload: { image: captured?.base64, uri: captured?.uri },
        createdAt: new Date().toISOString()
      });
      Alert.alert(
        'Scan queued',
        error instanceof Error
          ? `${error.message}. We stored the meal to sync when you reconnect.`
          : 'We queued the meal for upload once you are back online.'
      );
    } finally {
      setLoading(false);
    }
  }, [autoDeleteImages]);

  if (permission === 'denied') {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Camera permission is required to scan meals. Enable it in your device settings.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Scan your meal</Text>
      <Text style={styles.subtitle}>Capture a plate photo to estimate calories instantly.</Text>
      <View style={styles.cameraContainer}>
        <Camera ref={cameraRef} style={styles.camera} ratio="16:9" type={CameraType.back} />
      </View>
      <TouchableOpacity style={styles.button} onPress={handleAnalyse} disabled={loading}>
        {loading ? <ActivityIndicator color={palette.textPrimary} /> : <Text style={styles.buttonText}>Analyse Meal</Text>}
      </TouchableOpacity>
      {previewUri && !autoDeleteImages ? (
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Last capture</Text>
          <Image source={{ uri: previewUri }} style={styles.previewImage} />
        </View>
      ) : null}
      {analysis ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Estimated {analysis.total_calories.toFixed(0)} kcal</Text>
          <Text style={styles.resultSubtitle}>Confidence {Math.round(analysis.confidence * 100)}%</Text>
          {analysis.items.map(item => (
            <View key={item.name} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDetails}>
                {item.quantity.toFixed(1)} {item.unit} • {item.calories.toFixed(0)} kcal •{' '}
                {Math.round(item.confidence * 100)}% conf.
              </Text>
            </View>
          ))}
        </View>
      ) : null}
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
  subtitle: {
    ...typography.body,
    marginTop: spacing(0.5),
    color: palette.textSecondary
  },
  cameraContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: spacing(2),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border
  },
  camera: {
    height: 260
  },
  button: {
    backgroundColor: palette.primary,
    paddingVertical: spacing(1.5),
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing(2)
  },
  buttonText: {
    ...typography.subheading,
    color: palette.surface
  },
  previewContainer: {
    marginTop: spacing(2)
  },
  previewTitle: {
    ...typography.subheading,
    marginBottom: spacing(1)
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12
  },
  resultCard: {
    marginTop: spacing(2),
    padding: spacing(2),
    backgroundColor: palette.card,
    borderRadius: 16
  },
  resultTitle: {
    ...typography.subheading,
    color: palette.primary
  },
  resultSubtitle: {
    ...typography.caption,
    marginBottom: spacing(1)
  },
  itemRow: {
    marginTop: spacing(1)
  },
  itemName: {
    ...typography.body,
    fontWeight: '600'
  },
  itemDetails: {
    ...typography.caption
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing(3),
    backgroundColor: palette.background
  },
  permissionText: {
    ...typography.body,
    textAlign: 'center'
  }
});

export default MealScanScreen;
