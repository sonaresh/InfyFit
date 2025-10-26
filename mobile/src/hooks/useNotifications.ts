import { useCallback, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export function useNotifications() {
  const [token, setToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    (async () => {
      const settings = await Notifications.getPermissionsAsync();
      if (!settings.granted) {
        const requested = await Notifications.requestPermissionsAsync();
        setPermissionGranted(requested.granted);
      } else {
        setPermissionGranted(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!permissionGranted) return;

    (async () => {
      const easProjectId = Constants?.expoConfig?.extra?.eas?.projectId as string | undefined;
      const pushTokenResponse = await Notifications.getExpoPushTokenAsync({ projectId: easProjectId });
      setToken(pushTokenResponse.data ?? null);
    })();
  }, [permissionGranted]);

  const scheduleLocal = useCallback(async (content: Notifications.NotificationContentInput, secondsFromNow = 5) => {
    if (!permissionGranted) {
      return null;
    }
    return Notifications.scheduleNotificationAsync({
      content,
      trigger: { seconds: secondsFromNow }
    });
  }, [permissionGranted]);

  return { token, permissionGranted, scheduleLocal };
}
