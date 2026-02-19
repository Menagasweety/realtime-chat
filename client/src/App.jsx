import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { authApi } from './api/authApi';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

function Protected({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    authApi
      .me()
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  if (!ready) return <div className="page-loader">Loading chat...</div>;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onAuth={setUser} />} />
      <Route path="/register" element={<RegisterPage onAuth={setUser} />} />
      <Route
        path="/"
        element={
          <Protected user={user}>
            <DashboardPage user={user} onLogout={() => setUser(null)} />
          </Protected>
        }
      />
    </Routes>
  );
}
