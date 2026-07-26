import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export default function CreateEvent() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [createdEvent, setCreatedEvent] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const event = await apiFetch('/api/events', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setCreatedEvent(event);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (createdEvent) {
    return (
      <div>
        <h1>✅ Événement créé</h1>
        <p>Partage ce code avec tes amis pour qu'ils rejoignent "{createdEvent.name}" :</p>
        <p style={{ fontSize: '2rem', fontWeight: 'bold', letterSpacing: '0.2em' }}>{createdEvent.code}</p>
        <button onClick={() => navigate('/')}>Retour à mes événements</button>
      </div>
    );
  }

  return (
    <div>
      <h1>➕ Créer un événement</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nom de l'événement"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ fontSize: '1.1rem', padding: '0.5rem', width: '100%' }}
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={submitting} style={{ marginTop: '1rem' }}>
          Créer
        </button>
      </form>
      <button onClick={() => navigate('/')}>Annuler</button>
    </div>
  );
}
