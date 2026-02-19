import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';

export default function RegisterPage({ onAuth }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const parseError = (err) => {
    const data = err?.response?.data;
    if (data?.errors?.length) return data.errors.map((e) => e.message).join(', ');
    if (data?.message) return data.message;
    if (err?.code === 'ERR_NETWORK') return 'Cannot reach server. Check if backend is running on port 4000.';
    return 'Register failed';
  };

  const validatePassword = (password) => {
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must include a number';
    if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include a special character';
    return '';
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const passwordError = validatePassword(form.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    try {
      const { data } = await authApi.register(form);
      onAuth(data.user);
      navigate('/');
    } catch (err) {
      setError(parseError(err));
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card glass-card" onSubmit={submit}>
        <h1>Create Account</h1>
        <input
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
        />
        <input
          type="password"
          placeholder="Password (strong)"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
        />
        <small className="muted">
          Use 8+ chars with uppercase, lowercase, number, and special character. Example: `Test@1234`
        </small>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit">Register</button>
        <p>
          Already have one? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
