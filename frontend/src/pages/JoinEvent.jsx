import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export default function JoinEvent() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch('/api/events/join', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1>🔑 Rejoindre un événement</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Code de l'événement"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          required
          style={{ fontSize: '1.1rem', padding: '0.5rem', width: '100%', textTransform: 'uppercase' }}
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={submitting} style={{ marginTop: '1rem' }}>
          Rejoindre
        </button>
      </form>
      <button onClick={() => navigate('/')}>Annuler</button>
    </div>
  );
}
