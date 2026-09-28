import { ChangeEvent, FormEvent, useState } from 'react';

type LoginPageProps = {
  onLoginSuccess?: () => void;
};

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const DEMO_USERNAME = 'admin@globowave.com';
  const DEMO_PASSWORD = 'Admin@1234';

  function handleUsernameChange(event: ChangeEvent<HTMLInputElement>) {
    setUsername(event.target.value);
    setError('');
  }

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value);
    setError('');
  }

  function handleRememberChange(event: ChangeEvent<HTMLInputElement>) {
    setRememberMe(event.target.checked);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    if (username !== DEMO_USERNAME || password !== DEMO_PASSWORD) {
      setError('Invalid username or password.');
      return;
    }

    onLoginSuccess?.();

    setUsername('');
    setPassword('');
    setRememberMe(false);
  }

  return (
    <section style={{ maxWidth: '560px', margin: '0 auto' }}>
      <div className="auth-card">
        <h1 className="auth-title">Sign in to your Account</h1>

        {error && <div className="error-banner">{error}</div>}

        <form
          onSubmit={handleSubmit}
          className="auth-form-row"
          style={{
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: '18px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <label htmlFor="login-username">Username</label>

            <input
              id="login-username"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Username"
              required
              style={{ width: '100%' }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <label htmlFor="login-password">Password</label>

            <input
              id="login-password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Password"
              required
              style={{ width: '100%' }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '18px' }}>
              <input type="checkbox" checked={rememberMe} onChange={handleRememberChange} />
              Remember me
            </label>

            <a
              href="#"
              onClick={(event: any) => {
                event.preventDefault();
                setError('Password recovery is not enabled in demo mode.');
              }}
            >
              Forgot password?
            </a>
          </div>

          <div className="auth-module-actions">
            <button type="submit" className="auth-button auth-button--primary">
              Sign In
            </button>
          </div>

          <p style={{ margin: 0, textAlign: 'center', color: '#111827' }}>
            Use <strong>admin / 1234</strong> to login (demo)
          </p>
        </form>
      </div>
    </section>
  );
}

// import { ChangeEvent, FormEvent, useState } from 'react';

// type LoginPageProps = {
//   onLoginSuccess?: () => void;
// };

// export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');

//   // Only this email and password can login
//   const ALLOWED_EMAIL = 'admin@globowave.com';
//   const ALLOWED_PASSWORD = 'Admin@123';

//   function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
//     setEmail(event.target.value);
//     setError('');
//   }

//   function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
//     setPassword(event.target.value);
//     setError('');
//   }

//   function handleSubmit(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     setError('');

//     // Check empty fields
//     if (!email || !password) {
//       setError('Please enter both email and password.');
//       return;
//     }

//     // Check email and password
//     if (email !== ALLOWED_EMAIL || password !== ALLOWED_PASSWORD) {
//       setError('Invalid email or password.');
//       return;
//     }

//     // Login successful
//     onLoginSuccess?.();

//     // Clear form
//     setEmail('');
//     setPassword('');
//   }

//   return (
//     <section style={{ maxWidth: '560px', margin: '0 auto' }}>
//       <div className="auth-card">
//         <h1 className="auth-title">Login</h1>

//         {error && (
//           <div className="error-banner">
//             {error}
//           </div>
//         )}

//         <form
//           onSubmit={handleSubmit}
//           className="auth-form-row"
//           style={{
//             flexDirection: 'column',
//             alignItems: 'stretch',
//             gap: '18px',
//           }}
//         >
//           {/* Email */}
//           <div
//             style={{
//               display: 'flex',
//               flexDirection: 'column',
//               gap: '8px',
//             }}
//           >
//             <label htmlFor="login-email">Email</label>

//             <input
//               id="login-email"
//               type="email"
//               value={email}
//               onChange={handleEmailChange}
//               placeholder="Enter your email"
//               required
//               style={{ width: '100%' }}
//             />
//           </div>

//           {/* Password */}
//           <div
//             style={{
//               display: 'flex',
//               flexDirection: 'column',
//               gap: '8px',
//             }}
//           >
//             <label htmlFor="login-password">Password</label>

//             <input
//               id="login-password"
//               type="password"
//               value={password}
//               onChange={handlePasswordChange}
//               placeholder="Enter your password"
//               required
//               style={{ width: '100%' }}
//             />
//           </div>

//           {/* Login Button */}
//           <div className="auth-module-actions">
//             <button
//               type="submit"
//               className="auth-button auth-button--primary"
//             >
//               Login
//             </button>
//           </div>
//         </form>
//       </div>
//     </section>
//   );
// }
