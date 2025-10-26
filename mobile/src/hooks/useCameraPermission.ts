import { useEffect, useState } from 'react';
import { Camera } from 'expo-camera';

type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export function useCameraPermission() {
  const [status, setStatus] = useState<PermissionStatus>('undetermined');

  useEffect(() => {
    (async () => {
      const { status: initial } = await Camera.getCameraPermissionsAsync();
      if (initial === 'granted') {
        setStatus('granted');
        return;
      }
      const { status: requested } = await Camera.requestCameraPermissionsAsync();
      setStatus(requested === 'granted' ? 'granted' : 'denied');
    })();
  }, []);

  return status;
}
