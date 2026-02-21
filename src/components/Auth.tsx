import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Tab = 'login' | 'register';

const ERROR_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Ungültige E-Mail oder Passwort.',
  'Email not confirmed': 'Bitte bestätige zuerst deine E-Mail-Adresse.',
  'User already registered': 'Diese E-Mail-Adresse ist bereits registriert.',
  'Password should be at least 6 characters': 'Das Passwort muss mindestens 6 Zeichen haben.',
  'Unable to validate email address: invalid format': 'Bitte gib eine gültige E-Mail-Adresse ein.',
  'Signup requires a valid password': 'Bitte wähle ein gültiges Passwort.',
};

function getGermanError(message: string): string {
  return ERROR_MESSAGES[message] ?? message;
}

export default function Auth() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(getGermanError(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;
      setSuccessMessage('Registrierung erfolgreich. Bitte prüfe deine E-Mails zur Bestätigung.');
      setPassword('');
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(getGermanError(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = tab === 'login' ? handleLogin : handleRegister;

  const inputClass =
    'w-full px-4 py-3 bg-white/5 text-white text-[15px] rounded-btn shadow-sm outline-none transition-colors focus:bg-white/10 font-sans box-border border-0';
  const labelClass = 'block text-white/60 text-[13px] font-medium mb-2 font-sans';

  return (
    <div className="min-h-screen flex bg-dark">
      {/* ── LEFT: Turkish flag panel ── */}
      <div className="w-1/2 bg-brand relative overflow-hidden flex flex-col justify-between p-12">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[200px] text-white opacity-15 pointer-events-none select-none">
          ☽★
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold text-base font-sans">
            TR
          </div>
          <span className="text-white font-bold text-xl tracking-wide font-sans">Türkçe Pro</span>
        </div>
        <div className="relative z-10">
          <div className="text-white/20 text-[64px] font-serif leading-none mb-4">"</div>
          <p className="text-white text-[28px] font-light leading-snug mb-3 font-sans">
            Türkisch nicht nur sprechen –<br />
            <span className="text-amber-300 font-semibold">wirklich beherrschen.</span>
          </p>
          <p className="text-white/60 text-sm font-sans">
            B1 → C1 · KI-Korrekturen · Deyimler · Business-Türkisch
          </p>
        </div>
        <div className="flex gap-10 relative z-10 font-sans">
          {[
            { num: '3', label: 'Varianten pro Text' },
            { num: '∞', label: 'Deyimler lernen' },
            { num: 'B1→C1', label: 'Niveau-Sprung' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-white font-bold text-[22px]">{s.num}</div>
              <div className="text-white/50 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT: Form panel ── */}
      <div className="w-1/2 min-h-screen flex items-center justify-center p-12 bg-dark">
        <div className="w-full max-w-[420px] font-sans">
          {/* Branding: Türkçe Pro prominent über dem Formular */}
          <h1 className="text-center text-white text-4xl font-serif font-bold mb-2">
            Türkçe Pro
          </h1>

          <h2 className="text-white text-3xl font-bold mb-2 font-sans">
            {tab === 'login' ? 'Willkommen zurück' : 'Konto erstellen'}
          </h2>
          <p className="text-white/40 text-[15px] mb-8 font-sans">
            {tab === 'login' ? 'Melde dich an um weiterzuüben.' : 'Kostenlos starten – keine Kreditkarte nötig.'}
          </p>

          {/* Tab switcher */}
          <div className="flex bg-white/5 rounded-btn p-1 mb-7">
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setError(null); setSuccessMessage(null); }}
                className={`flex-1 py-2.5 rounded-[6px] border-0 font-medium text-sm cursor-pointer transition-all font-sans no-underline ${
                  tab === t ? 'bg-brand text-white' : 'bg-transparent text-white/40'
                }`}
              >
                {t === 'login' ? 'Anmelden' : 'Registrieren'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className={labelClass}>E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="deine@email.de"
                className={inputClass}
              />
            </div>

            <div className="mb-6">
              <label className={labelClass}>Passwort</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                minLength={6}
                placeholder="••••••••"
                className={inputClass}
              />
              {tab === 'register' && (
                <p className="text-white/30 text-xs mt-1.5 font-sans">Mindestens 6 Zeichen</p>
              )}
            </div>

            {error && (
              <div className="py-3 px-4 rounded-btn mb-4 bg-brand/15 border border-brand/30 text-red-200 text-sm font-sans">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="py-3 px-4 rounded-btn mb-4 bg-green-500/10 border border-green-500/20 text-green-200 text-sm font-sans">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn w-full py-3.5 bg-brand text-white font-semibold text-[15px] rounded-btn font-sans border-0 cursor-pointer shadow-md hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all no-underline"
            >
              {loading ? 'Bitte warten…' : tab === 'login' ? 'Anmelden' : 'Konto erstellen'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-white/25 font-sans">
            {tab === 'login' ? 'Noch kein Konto? ' : 'Bereits registriert? '}
            <button
              type="button"
              onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError(null); setSuccessMessage(null); }}
              className="text-amber-300 bg-transparent border-0 cursor-pointer text-sm font-medium font-sans no-underline hover:underline"
            >
              {tab === 'login' ? 'Jetzt registrieren' : 'Anmelden'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}