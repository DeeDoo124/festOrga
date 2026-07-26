import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { apiFetch } from '../lib/api';

export default function Events() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEvents = () => {
    setLoading(true);
    apiFetch('/api/events')
      .then(setEvents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(loadEvents, []);

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet événement ?')) return;
    try {
      await apiFetch(`/api/events/${id}`, { method: 'DELETE' });
      loadEvents();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLeave = async (id) => {
    if (!confirm('Quitter cet événement ? Tes dépenses enregistrées seront aussi supprimées.')) return;
    try {
      await apiFetch(`/api/events/${id}/leave`, { method: 'DELETE' });
      loadEvents();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRename = async (event) => {
    const newName = prompt('Nouveau nom :', event.name);
    if (!newName || !newName.trim() || newName.trim() === event.name) return;
    try {
      await apiFetch(`/api/events/${event.id}`, { method: 'PUT', body: JSON.stringify({ name: newName.trim() }) });
      loadEvents();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <h1>🎪 Mes événements</h1>
      <p>Connecté en tant que {user?.email}</p>

      <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
        <button onClick={() => navigate('/create')}>➕ Créer un événement</button>
        <button onClick={() => navigate('/join')}>🔑 Rejoindre un événement</button>
      </div>

      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {events.map((event) => (
          <li key={event.id} style={{ border: '1px solid #ccc', borderRadius: 8, padding: '1rem', marginBottom: '0.5rem' }}>
            <strong>{event.name}</strong> {event.myRole === 'organizer' && '👑'}
            <div>Code : {event.code}</div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button onClick={() => navigate(`/events/${event.id}`)}>Ouvrir</button>
              {event.myRole === 'organizer' && (
                <>
                  <button onClick={() => handleRename(event)}>✏️ Renommer</button>
                  <button onClick={() => handleDelete(event.id)}>🗑 Supprimer</button>
                </>
              )}
              {event.myRole !== 'organizer' && (
                <button onClick={() => handleLeave(event.id)}>🚪 Quitter</button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {!loading && events.length === 0 && <p>Aucun événement pour l'instant.</p>}

      <button onClick={signOut}>Se déconnecter</button>
    </div>
  );
}
