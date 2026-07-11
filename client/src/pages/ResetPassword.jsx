import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.js';
import AuthLayout from '../layouts/AuthLayout.jsx';
import { Button, Input, Alert } from '../components/ui.jsx';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', otp: '', newPassword: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await authApi.resetPassword(form);
      navigate('/login', { replace: true, state: { reset: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Enter reset code" subtitle="Check your email for the 6-digit code">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Input
          id="email"
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          id="otp"
          label="6-digit code"
          inputMode="numeric"
          maxLength={6}
          required
          value={form.otp}
          onChange={(e) => setForm({ ...form, otp: e.target.value })}
        />
        <Input
          id="newPassword"
          label="New password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={form.newPassword}
          onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
        />
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <Link to="/login" className="text-indigo-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
