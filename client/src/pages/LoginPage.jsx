import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';

export default function LoginPage({ onAuth }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const parseError = (err) => {
    const data = err?.response?.data;
    if (data?.errors?.length) return data.errors.map((e) => e.message).join(', ');
    if (data?.message) return data.message;
    if (err?.code === 'ERR_NETWORK') return 'Cannot reach server. Check if backend is running on port 4000.';
    return 'Login failed';
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username.trim() || !form.password) {
      setError('Enter username and password');
      return;
    }
    try {
      const { data } = await authApi.login(form);
      onAuth(data.user);
      navigate('/');
    } catch (err) {
      setError(parseError(err));
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card glass-card" onSubmit={submit}>
        <h1>Welcome Back</h1>
        <input
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
        />
        {error ? <p className="error">{error}</p> : null}
        <button type="submit">Login</button>
        <p>
          No account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </div>
  );
}
