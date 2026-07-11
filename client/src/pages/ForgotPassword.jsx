import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth.js';
import AuthLayout from '../layouts/AuthLayout.jsx';
import { Button, Input, Alert } from '../components/ui.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    setBusy(true);
    try {
      const res = await authApi.forgotPassword({ email });
      setMsg(res.message || 'If that email exists, a reset code has been sent.');
      if (res.devOtp) setDevOtp(res.devOtp);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Reset password" subtitle="We'll email you a 6-digit code">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        {msg && <Alert kind="success">{msg}</Alert>}
        {devOtp && (
          <Alert kind="info">
            Dev code (SMTP not configured): <strong>{devOtp}</strong>
          </Alert>
        )}
        <Input
          id="email"
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Sending…' : 'Send reset code'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Have a code?{' '}
        <Link to="/reset-password" className="text-indigo-600 hover:underline">
          Enter it here
        </Link>
      </p>
    </AuthLayout>
  );
}
