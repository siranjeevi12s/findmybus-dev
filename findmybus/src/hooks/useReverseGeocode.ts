import { useQuery } from '@tanstack/react-query';

/**
 * Free keyless reverse-geocoding (BigDataCloud client API) so the map page
 * can show Google-Maps-style place names like "Connaught Place, New Delhi".
 * Coordinates are rounded to ~100m so the cache stays small while moving.
 */
export function useReverseGeocode(lat?: number, lng?: number) {
  const rLat = lat != null ? Number(lat.toFixed(3)) : undefined;
  const rLng = lng != null ? Number(lng.toFixed(3)) : undefined;

  return useQuery({
    queryKey: ['reverseGeocode', rLat, rLng],
    queryFn: async (): Promise<string | null> => {
      if (rLat == null || rLng == null) return null;
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${rLat}&longitude=${rLng}&localityLanguage=en`
      );
      if (!res.ok) throw new Error('geocode failed');
      const j = await res.json();
      const parts = [j.city || j.locality, j.principalSubdivision, j.countryName].filter(Boolean);
      return parts.length ? parts.join(', ') : null;
    },
    enabled: rLat != null && rLng != null,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}
