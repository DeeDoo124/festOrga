import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL;

export class NetworkError extends Error {}

export async function apiFetch(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  } catch {
    // fetch échoue avant même d'atteindre le serveur : pas de réseau
    throw new NetworkError('Pas de connexion internet — réessaie dans quelques instants.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erreur ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}
