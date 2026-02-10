/**
 * Permission Manager - Handle browser permissions for camera, microphone, notifications, etc.
 * All functions are safe to call in sandboxed/non-HTTPS environments and will gracefully degrade.
 */

interface PermissionStatusResult {
  camera: PermissionState | null;
  microphone: PermissionState | null;
  notification: PermissionState | null;
  geolocation: PermissionState | null;
}

export type PermissionType = 'camera' | 'microphone' | 'notification' | 'geolocation';

/**
 * Check if mediaDevices API is available (requires HTTPS or localhost)
 */
function isMediaDevicesAvailable(): boolean {
  return typeof navigator !== 'undefined' && 
    'mediaDevices' in navigator && 
    typeof navigator.mediaDevices.getUserMedia === 'function';
}

/**
 * Request camera permission
 */
export async function requestCameraPermission(): Promise<boolean> {
  if (!isMediaDevicesAvailable()) {
    console.warn('[PERMISSION] Camera API not available (requires HTTPS or localhost)');
    return false;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.warn('[PERMISSION] Camera permission denied or unavailable:', (error as Error).message);
    return false;
  }
}

/**
 * Request microphone permission
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  if (!isMediaDevicesAvailable()) {
    console.warn('[PERMISSION] Microphone API not available (requires HTTPS or localhost)');
    return false;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.warn('[PERMISSION] Microphone permission denied or unavailable:', (error as Error).message);
    return false;
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('[PERMISSION] Notifications not supported in this environment');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('[PERMISSION] Notification permission was previously denied');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.warn('[PERMISSION] Error requesting notification permission:', (error as Error).message);
    return false;
  }
}

/**
 * Request geolocation permission
 */
export async function requestGeolocationPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      console.warn('[PERMISSION] Geolocation not supported');
      resolve(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      () => resolve(false),
      { timeout: 10000 }
    );
  });
}

/**
 * Open a popup window (safe with popup blockers)
 */
export function allowPopup(url: string, windowName = '_blank', windowFeatures = 'width=800,height=600'): Window | null {
  try {
    const popup = window.open(url, windowName, windowFeatures);
    if (!popup || popup.closed) {
      console.warn('[PERMISSION] Popup was blocked by the browser');
      return null;
    }
    return popup;
  } catch (error) {
    console.warn('[PERMISSION] Error opening popup:', (error as Error).message);
    return null;
  }
}

/**
 * Check current permission status (non-throwing)
 */
export async function checkPermissionStatus(): Promise<PermissionStatusResult> {
  const status: PermissionStatusResult = {
    camera: null,
    microphone: null,
    notification: null,
    geolocation: null
  };

  // Check camera
  try {
    if ('permissions' in navigator) {
      const cameraStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
      status.camera = cameraStatus.state;
    }
  } catch { /* not supported in this browser */ }

  // Check microphone
  try {
    if ('permissions' in navigator) {
      const micStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      status.microphone = micStatus.state;
    }
  } catch { /* not supported in this browser */ }

  // Check notification
  try {
    if ('Notification' in window) {
      status.notification = Notification.permission as PermissionState;
    }
  } catch { /* not supported in this browser */ }

  // Check geolocation
  try {
    if ('permissions' in navigator) {
      const geoStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      status.geolocation = geoStatus.state;
    }
  } catch { /* not supported in this browser */ }

  return status;
}

/**
 * Request all permissions (gracefully handles failures)
 */
export async function requestAllPermissions(): Promise<Record<string, boolean>> {
  const [camera, microphone, notification, geolocation] = await Promise.allSettled([
    requestCameraPermission(),
    requestMicrophonePermission(),
    requestNotificationPermission(),
    requestGeolocationPermission(),
  ]);

  return {
    camera: camera.status === 'fulfilled' ? camera.value : false,
    microphone: microphone.status === 'fulfilled' ? microphone.value : false,
    notification: notification.status === 'fulfilled' ? notification.value : false,
    geolocation: geolocation.status === 'fulfilled' ? geolocation.value : false,
    popup: true,
  };
}
