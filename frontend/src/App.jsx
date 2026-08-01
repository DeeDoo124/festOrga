import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Login from './pages/Login';
import Events from './pages/Events';
import CreateEvent from './pages/CreateEvent';
import JoinEvent from './pages/JoinEvent';
import ExpenseList from './pages/ExpenseList';
import ExpenseForm from './pages/ExpenseForm';
import Balances from './pages/Balances';
import Checklist from './pages/Checklist';
import MeetingPoint from './pages/MeetingPoint';

// Redirige vers l'écran de connexion si l'utilisateur n'est pas authentifié
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<RequireAuth><Events /></RequireAuth>} />
      <Route path="/create" element={<RequireAuth><CreateEvent /></RequireAuth>} />
      <Route path="/join" element={<RequireAuth><JoinEvent /></RequireAuth>} />
      <Route path="/events/:eventId" element={<RequireAuth><ExpenseList /></RequireAuth>} />
      <Route path="/events/:eventId/expenses/new" element={<RequireAuth><ExpenseForm /></RequireAuth>} />
      <Route path="/events/:eventId/expenses/:expenseId/edit" element={<RequireAuth><ExpenseForm /></RequireAuth>} />
      <Route path="/events/:eventId/balances" element={<RequireAuth><Balances /></RequireAuth>} />
      <Route path="/events/:eventId/checklist" element={<RequireAuth><Checklist /></RequireAuth>} />
      <Route path="/events/:eventId/meeting-point" element={<RequireAuth><MeetingPoint /></RequireAuth>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
