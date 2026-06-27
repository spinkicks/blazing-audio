import { useRef, useState, type FormEvent } from 'react';
import {
  authErrorMessage,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '@/features/auth/authService';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useTimeline } from '@/lib/anim';

type Mode = 'signin' | 'signup';

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const isSignup = mode === 'signup';

  useTimeline(rootRef, (tl) => {
    tl.from('[data-anim="logo"]', { opacity: 0, scale: 0.8, y: 8, duration: 0.6, ease: 'back.out(1.6)' }, 0);
    tl.from('[data-anim="form"]', { opacity: 0, y: 18, duration: 0.6, ease: 'power3.out' }, 0.2);
    tl.from('[data-anim="alt"]', { opacity: 0, y: 12, ease: 'power2.out' }, 0.4);
    tl.from('[data-anim="foot"]', { opacity: 0, ease: 'power2.out' }, 0.5);
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (isSignup) {
        await signUpWithEmail(name, email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
      // Auth listener flips the app into the authed routes.
    } catch (e) {
      setError(authErrorMessage(e));
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(authErrorMessage(e));
      setBusy(false);
    }
  }

  return (
    <div ref={rootRef} className="flex min-h-screen flex-col justify-center px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        {/* Brand */}
        <div data-anim="logo" className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border border-white/10 bg-ink-800">
            <WaveMark className="h-9 w-9" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">Blazing Audio</h1>
          <p className="mt-1 text-sm text-slate-400">
            Learn how audio really works, one hands-on lesson at a time.
          </p>
        </div>

        <form data-anim="form" onSubmit={handleSubmit} className="flex flex-col gap-3">
          {isSignup ? (
            <Field
              label="Name"
              value={name}
              onChange={setName}
              placeholder="What should we call you?"
              autoComplete="name"
              required
            />
          ) : null}
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            required
          />

          {error ? (
            <p className="bg-clip-500/10 px-3 py-2 text-sm text-clip-300">{error}</p>
          ) : null}

          <Button type="submit" fullWidth disabled={busy} className="mt-1">
            {busy ? <Spinner className="h-5 w-5" /> : isSignup ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-600">
          <span className="h-px flex-1 bg-white/10" />
          or
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <Button data-anim="alt" variant="secondary" fullWidth disabled={busy} onClick={handleGoogle}>
          <GoogleMark className="h-5 w-5" />
          Continue with Google
        </Button>

        <p data-anim="foot" className="mt-6 text-center text-sm text-slate-400">
          {isSignup ? 'Already have an account?' : "New here?"}{' '}
          <button
            type="button"
            className="font-semibold text-wave-400 hover:underline"
            onClick={() => {
              setMode(isSignup ? 'signin' : 'signup');
              setError(null);
            }}
          >
            {isSignup ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}

function Field({ label, value, onChange, type = 'text', ...rest }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-white/10 bg-ink-800 px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:border-wave-400 focus:outline-none focus:ring-2 focus:ring-wave-400/40"
        {...rest}
      />
    </label>
  );
}

function WaveMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <path
        d="M6 32c8 0 8-14 16-14s8 28 16 28 8-14 16-14"
        stroke="#38bdf8"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="52" cy="16" r="5" fill="#f9531e" />
    </svg>
  );
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.5-11.3-8.3l-6.5 5C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C39.9 36.6 44 31 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
