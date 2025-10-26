import Constants from 'expo-constants';

const { manifest, expoConfig } = Constants;

const extra = (manifest?.extra ?? expoConfig?.extra ?? {}) as Record<string, unknown>;

export const API_BASE_URL = (extra?.apiBaseUrl as string) ?? 'http://localhost:8000';

export const CAMERA_PREVIEW_RATIO = '16:9';
