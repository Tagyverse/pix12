/**
 * Permission Manager - Handle browser permissions for camera, microphone, notifications, etc.
 */

interface PermissionStatus {
  camera: PermissionState | null;
  microphone: PermissionState | null;
  notification: PermissionState | null;
  geolocation: PermissionState | null;
}

export type PermissionType = 'camera' | 'microphone' | 'notification' | 'geolocation';

/**
 * Request camera permission
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    // Stop the stream after getting permission
    stream.getTracks().forEach(track => track.stop());
    console.log('[PERMISSION] Camera permission granted');
    return true;
  } catch (error) {
    console.error('[PERMISSION] Camera permission denied:', error);
    return false;
  }
}

/**
 * Request microphone permission
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream after getting permission
    stream.getTracks().forEach(track => track.stop());
    console.log('[PERMISSION] Microphone permission granted');
    return true;
  } catch (error) {
    console.error('[PERMISSION] Microphone permission denied:', error);
    return false;
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('[PERMISSION] Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('[PERMISSION] Notification permission already granted');
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      if (granted) {
        console.log('[PERMISSION] Notification permission granted');
      }
      return granted;
    } catch (error) {
      console.error('[PERMISSION] Error requesting notification permission:', error);
      return false;
    }
  }

  console.warn('[PERMISSION] Notification permission was previously denied');
  return false;
}

/**
 * Request geolocation permission
 */
export async function requestGeolocationPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('[PERMISSION] Geolocation not supported');
      resolve(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        console.log('[PERMISSION] Geolocation permission granted');
        resolve(true);
      },
      (error) => {
        console.error('[PERMISSION] Geolocation permission denied:', error);
        resolve(false);
      }
    );
  });
}

/**
 * Request popup window permission (automatic on most browsers)
 */
export function allowPopup(url: string, windowName: string = '_blank', windowFeatures: string = 'width=800,height=600'): Window | null {
  try {
    const popup = window.open(url, windowName, windowFeatures);
    if (popup) {
      console.log('[PERMISSION] Popup window opened');
      return popup;
    } else {
      console.warn('[PERMISSION] Popup blocked - user may have popup blocking enabled');
      return null;
    }
  } catch (error) {
    console.error('[PERMISSION] Error opening popup:', error);
    return null;
  }
}

/**
 * Check current permission status
 */
export async function checkPermissionStatus(): Promise<PermissionStatus> {
  const status: PermissionStatus = {
    camera: null,
    microphone: null,
    notification: null,
    geolocation: null
  };

  try {
    // Check camera
    if ('permissions' in navigator) {
      const cameraStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
      status.camera = cameraStatus.state;
    }
  } catch (error) {
    console.error('[PERMISSION] Error checking camera status:', error);
  }

  try {
    // Check microphone
    if ('permissions' in navigator) {
      const micStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      status.microphone = micStatus.state;
    }
  } catch (error) {
    console.error('[PERMISSION] Error checking microphone status:', error);
  }

  try {
    // Check notification
    if ('Notification' in window) {
      status.notification = Notification.permission as PermissionState;
    }
  } catch (error) {
    console.error('[PERMISSION] Error checking notification status:', error);
  }

  try {
    // Check geolocation
    if ('permissions' in navigator) {
      const geoStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      status.geolocation = geoStatus.state;
    }
  } catch (error) {
    console.error('[PERMISSION] Error checking geolocation status:', error);
  }

  return status;
}

/**
 * Request all permissions
 */
export async function requestAllPermissions(): Promise<Record<string, boolean>> {
  const results = {
    camera: await requestCameraPermission(),
    microphone: await requestMicrophonePermission(),
    notification: await requestNotificationPermission(),
    geolocation: await requestGeolocationPermission(),
    popup: true // Popups are typically allowed by default
  };

  return results;
}
