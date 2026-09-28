import { ChangeEvent, FormEvent, useState } from 'react';

type LoginPageProps = {
  onLoginSuccess?: () => void;
};

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
  }

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    // Placeholder login behavior
    alert(`Login requested for ${email}`);
    onLoginSuccess?.();
    setEmail('');
    setPassword('');

  }

  return (
    <section style={{ maxWidth: '560px', margin: '0 auto' }}>
      <div className="auth-card">
        <h1 className="auth-title">login</h1>
      

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="hello@example.com"
              required
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter your password"
              required
              style={{ width: '100%' }}
            />
          </div>

          <div className="auth-module-actions">
            <button type="submit" className="auth-button auth-button--primary">
              Login
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
