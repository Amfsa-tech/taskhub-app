// Universities API binding.
//
// `GET /api/universities` is public and returns every active university in one
// unpaginated, name-sorted list — there's no `?q=` search parameter, so the
// campus picker filters client-side over the full list.

import { api } from './client';

export interface University {
  _id: string;
  name: string;
  abbreviation?: string;
  state?: string;
  location?: string;
  logo?: string;
}

export interface UniversitiesResponse {
  status: string;
  count: number;
  universities: University[];
}

export function getUniversities(signal?: AbortSignal) {
  return api.get<UniversitiesResponse>('/api/universities', { signal, auth: false });
}

/** Match on name or abbreviation, e.g. "unilag" finds "University of Lagos". */
export function filterUniversities(list: University[], query: string): University[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (u) =>
      u.name.toLowerCase().includes(q) || (u.abbreviation ?? '').toLowerCase().includes(q),
  );
}
