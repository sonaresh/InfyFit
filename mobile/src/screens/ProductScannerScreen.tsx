import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { palette, spacing, typography } from '../theme';
import { productApi } from '../services/api';
import type { ProductScanResult, ProductScore } from '../services/api';
import { useOfflineQueue } from '../context/OfflineQueueContext';
import { nanoid } from 'nanoid/non-secure';

const ProductScannerScreen: React.FC = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [input, setInput] = useState('');
  const [scanResult, setScanResult] = useState<ProductScanResult | null>(null);
  const [score, setScore] = useState<ProductScore | null>(null);
  const [loading, setLoading] = useState(false);
  const { enqueue } = useOfflineQueue();

  React.useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const queueLookup = useCallback(
    (payload: Record<string, unknown>) => {
      enqueue({
        id: nanoid(),
        type: 'product',
        payload,
        createdAt: new Date().toISOString()
      });
    },
    [enqueue]
  );

  const resolveProduct = useCallback(
    async (identifier: { barcode?: string; label_text?: string }) => {
      const resolved = await productApi.resolve(
        identifier.barcode
          ? { barcode: identifier.barcode }
          : { ocr_text: identifier.label_text ?? '', dietary_flags: [] }
      );
      setScore(resolved);
    },
    []
  );

  const handleBarCodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (scanning) return;
      setScanning(true);
      setInput(data);
      await lookup({ barcode: data });
      setScanning(false);
    },
    [scanning]
  );

  const lookup = useCallback(
    async (payload: { barcode?: string; label_text?: string }) => {
      try {
        setLoading(true);
        setScore(null);
        const scan = await productApi.scan(payload);
        setScanResult(scan);
        await resolveProduct(payload);
      } catch (error) {
        console.error(error);
        queueLookup(payload);
        Alert.alert('Lookup queued', 'We will retry when you are back online.');
      } finally {
        setLoading(false);
      }
    },
    [queueLookup, resolveProduct]
  );

  const lookupByLabel = useCallback(async () => {
    if (!input.trim()) {
      Alert.alert('Missing text', 'Enter label text or barcode first.');
      return;
    }
    await lookup({ label_text: input.trim() });
  }, [input, lookup]);

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera permission is required to scan barcodes.</Text>
      </View>
    );
  }

  const candidate = scanResult?.candidate;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Scan a product</Text>
      <Text style={styles.subtitle}>Point the camera at a barcode or enter label text.</Text>
      <View style={styles.scannerContainer}>
        <BarCodeScanner
          style={StyleSheet.absoluteFillObject}
          onBarCodeScanned={handleBarCodeScanned}
          barCodeTypes={[BarCodeScanner.Constants.BarCodeType.ean13, BarCodeScanner.Constants.BarCodeType.upc_a]}
        />
        {scanning && (
          <View style={styles.overlay}>
            <ActivityIndicator color={palette.textPrimary} />
          </View>
        )}
      </View>
      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          style={styles.input}
          placeholder="Barcode or label text"
          placeholderTextColor={palette.textSecondary}
        />
        <TouchableOpacity
          style={styles.lookupButton}
          onPress={() => {
            if (!input.trim()) {
              Alert.alert('Missing barcode', 'Enter a barcode first.');
              return;
            }
            void lookup({ barcode: input.trim() });
          }}
          disabled={loading}
        >
          <Text style={styles.lookupText}>Lookup</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.secondaryButton} onPress={lookupByLabel} disabled={loading}>
        <Text style={styles.secondaryText}>Use label OCR result</Text>
      </TouchableOpacity>
      {loading ? <ActivityIndicator style={styles.loader} color={palette.primary} /> : null}
      {candidate ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>{candidate.name}</Text>
          {candidate.brand ? <Text style={styles.resultBrand}>{candidate.brand}</Text> : null}
          <Text style={styles.resultReason}>
            Confidence {scanResult?.confidence.toUpperCase()} via {scanResult?.lookup_strategy}
          </Text>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {candidate.ingredients.length ? (
            candidate.ingredients.map(ingredient => (
              <Text key={ingredient} style={styles.rowLabel}>
                • {ingredient}
              </Text>
            ))
          ) : (
            <Text style={styles.rowLabel}>No ingredients extracted.</Text>
          )}
        </View>
      ) : null}
      {score ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Health score {score.health_score} / 10</Text>
          <Text style={styles.resultReason}>{score.reason}</Text>
          <Text style={styles.sectionTitle}>Nutrients per serving</Text>
          {Object.entries(score.nutrients).map(([key, value]) => (
            <View key={key} style={styles.row}>
              <Text style={styles.rowLabel}>{key.replace('_', ' ')}</Text>
              <Text style={styles.rowValue}>{value}</Text>
            </View>
          ))}
          <Text style={styles.sectionTitle}>Better alternatives</Text>
          {score.better_alternatives.map(item => (
            <Text key={item} style={styles.rowLabel}>
              • {item}
            </Text>
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
    color: palette.textSecondary,
    marginBottom: spacing(2)
  },
  scannerContainer: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing(2),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1)
  },
  input: {
    flex: 1,
    backgroundColor: palette.card,
    borderRadius: 12,
    paddingHorizontal: spacing(1.5),
    paddingVertical: spacing(1),
    color: palette.textPrimary
  },
  lookupButton: {
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(2)
  },
  lookupText: {
    ...typography.body,
    color: palette.surface,
    fontWeight: '600'
  },
  secondaryButton: {
    marginTop: spacing(1.5)
  },
  secondaryText: {
    ...typography.body,
    color: palette.primary
  },
  loader: {
    marginTop: spacing(2)
  },
  resultCard: {
    marginTop: spacing(2),
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: spacing(2)
  },
  resultTitle: {
    ...typography.subheading,
    marginBottom: spacing(0.5)
  },
  resultBrand: {
    ...typography.body,
    color: palette.textSecondary,
    marginBottom: spacing(0.5)
  },
  resultReason: {
    ...typography.caption,
    marginBottom: spacing(1)
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '600',
    marginTop: spacing(1.5)
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing(0.5)
  },
  rowLabel: {
    ...typography.body,
    color: palette.textSecondary
  },
  rowValue: {
    ...typography.body,
    color: palette.textPrimary
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

export default ProductScannerScreen;
