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
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

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
      setLatitude(point.latitude ?? null);
      setLongitude(point.longitude ?? null);
    }
  }, [point]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("La géolocalisation n'est pas disponible sur cet appareil");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocating(false);
      },
      () => {
        setLocationError('Impossible de récupérer ta position (autorisation refusée ?)');
        setLocating(false);
      },
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/events/${eventId}/meeting-point`, {
        method: 'PUT',
        body: JSON.stringify({ description, meeting_time: meetingTime, latitude, longitude }),
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
      setLatitude(null);
      setLongitude(null);
      setEditing(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const mapsUrl = point?.latitude && point?.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${point.latitude},${point.longitude}`
    : null;

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

          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <button style={{ width: '100%', marginTop: '0.75rem' }}>🗺️ M'y guider</button>
            </a>
          )}
          {!mapsUrl && (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: '0.5rem' }}>
              Pas de position GPS enregistrée — modifie le point pour en ajouter une.
            </p>
          )}

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

          <button type="button" onClick={handleUseMyLocation} disabled={locating}>
            {locating ? '📍 Localisation...' : '📍 Utiliser ma position actuelle'}
          </button>

          {latitude && longitude && (
            <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)' }}>✅ Position capturée</p>
          )}
          {locationError && <p style={{ color: 'red', fontSize: '0.9rem' }}>{locationError}</p>}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit">Enregistrer</button>
            {point && <button type="button" onClick={() => setEditing(false)}>Annuler</button>}
          </div>
        </form>
      )}
    </div>
  );
}
