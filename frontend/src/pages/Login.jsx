import { useAuth } from '../lib/AuthContext';

export default function Login() {
  const { signInWithGoogle } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1.5rem' }}>
      <h1>🎪 Festorga</h1>
      <p>Gère le budget commun de ton festival</p>
      <button onClick={signInWithGoogle} style={{ fontSize: '1.1rem', padding: '0.75rem 1.5rem' }}>
        Se connecter avec Google
      </button>
    </div>
  );
}
