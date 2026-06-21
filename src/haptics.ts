/**
 * Haptic feedback — native Taptic Engine on iOS, vibration on Android,
 * navigator.vibrate() fallback on web. Safari on iOS is silent (no-op).
 */

import { Capacitor } from '@capacitor/core';

const intensities = { light: 10, medium: 20, heavy: 40 } as const;
type Intensity = keyof typeof intensities;

export async function impact(intensity: Intensity): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      const Haptics = await import('@capacitor/haptics');
      const style = (Haptics.ImpactStyle as any)[capitalize(intensity)];
      await Haptics.Haptics.impact({ style });
    } else if (navigator.vibrate) {
      navigator.vibrate(intensities[intensity]);
    }
  } catch {
    /* haptics unavailable — fail silently */
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
