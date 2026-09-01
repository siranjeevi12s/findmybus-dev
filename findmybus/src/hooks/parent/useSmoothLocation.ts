import { useState, useEffect, useRef } from 'react';

export function useSmoothLocation(
  targetLat?: number,
  targetLng?: number,
  durationMs = 1000
) {
  const [current, setCurrent] = useState<{lat: number, lng: number} | null>(null);
  const currentRef = useRef(current);
  currentRef.current = current;

  useEffect(() => {
    if (targetLat == null || targetLng == null) return;

    if (!currentRef.current) {
      setCurrent({ lat: targetLat, lng: targetLng });
      return;
    }

    let startTime = Date.now();
    const startLat = currentRef.current.lat;
    const startLng = currentRef.current.lng;
    
    const latDiff = Math.abs(targetLat - startLat);
    const lngDiff = Math.abs(targetLng - startLng);
    // If it jumped a lot (e.g. > ~5km), don't animate, just snap
    if (latDiff > 0.05 || lngDiff > 0.05) {
      setCurrent({ lat: targetLat, lng: targetLng });
      return;
    }

    let animationFrameId: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      
      // easeOutCubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      setCurrent({
        lat: startLat + (targetLat - startLat) * easeProgress,
        lng: startLng + (targetLng - startLng) * easeProgress,
      });

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [targetLat, targetLng, durationMs]);

  return current;
}
