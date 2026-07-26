import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import EventNav from '../components/EventNav';

export default function MeetingPoint() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [point, setPoint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState('');
  const [meetingTime, setMeetingTime] = useState('');

  const load = () => {
    setLoading(true);
    apiFetch(`/api/events/${eventId}/meeting-point`)
      .then((data) => {
        setPoint(data);
        if (!data) setEditing(true); // rien de défini : on ouvre directement le formulaire
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [eventId]);

  useEffect(() => {
    if (point) {
      setDescription(point.description);
      setMeetingTime(point.meeting_time || '');
    }
  }, [point]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/events/${eventId}/meeting-point`, {
        method: 'PUT',
        body: JSON.stringify({ description, meeting_time: meetingTime }),
      });
      setEditing(false);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleClear = async () => {
    if (!confirm('Effacer le point de rendez-vous ?')) return;
    try {
      await apiFetch(`/api/events/${eventId}/meeting-point`, { method: 'DELETE' });
      setPoint(null);
      setDescription('');
      setMeetingTime('');
      setEditing(true);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <button onClick={() => navigate('/')}>← Mes événements</button>
      <EventNav />
      <h1>📍 Point de RDV</h1>

      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !editing && point && (
        <div style={{ border: '2px solid var(--color-primary)', borderRadius: 8, padding: '1rem', margin: '1rem 0' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{point.description}</div>
          {point.meeting_time && <div style={{ fontSize: '1.1rem', marginTop: '0.25rem' }}>🕒 {point.meeting_time}</div>}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button onClick={() => setEditing(true)}>✏️ Modifier</button>
            <button onClick={handleClear}>🗑 Effacer</button>
          </div>
        </div>
      )}

      {!loading && editing && (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '1rem 0' }}>
          <input
            type="text"
            placeholder="Où se retrouve-t-on ? (ex: devant la grande scène)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Quand ? (ex: 22h, après le concert...)"
            value={meetingTime}
            onChange={(e) => setMeetingTime(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit">Enregistrer</button>
            {point && <button type="button" onClick={() => setEditing(false)}>Annuler</button>}
          </div>
        </form>
      )}
    </div>
  );
}
