import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

function getPostLoginRedirect(location) {
  const fromState = location?.state?.from
    ? location.state.from.pathname + (location.state.from.search || '')
    : null;

  let fromStorage = null;
  try {
    fromStorage = sessionStorage.getItem('festorga_redirect_after_login');
    if (fromStorage) {
      sessionStorage.removeItem('festorga_redirect_after_login');
    }
  } catch {}

  const target = fromState || fromStorage;
  return target && target !== '/login' ? target : '/';
}

// Redirige vers l'écran de connexion si l'utilisateur n'est pas authentifié
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) {
    const target = location.pathname + location.search;
    if (target !== '/' && target !== '/login') {
      try {
        sessionStorage.setItem('festorga_redirect_after_login', target);
      } catch {}
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function LoginRoute() {
  const { user } = useAuth();
  const location = useLocation();

  if (user) {
    const target = getPostLoginRedirect(location);
    return <Navigate to={target} replace />;
  }
  return <Login />;
}

function HomeRoute() {
  const location = useLocation();
  const target = getPostLoginRedirect(location);

  if (target !== '/') {
    return <Navigate to={target} replace />;
  }
  return <Events />;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/" element={<RequireAuth><HomeRoute /></RequireAuth>} />
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
