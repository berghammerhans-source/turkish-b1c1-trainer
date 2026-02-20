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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(getGermanError(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = tab === 'login' ? handleLogin : handleRegister;

  return (
    <div className="min-h-screen flex" style={{ background: '#0f0508' }}>

      {/* ── LEFT PANEL (decorative) ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #C8102E 0%, #9B0022 100%)' }}
      >
        {/* Crescent watermark */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 select-none pointer-events-none"
          style={{
            fontSize: '520px',
            lineHeight: 1,
            color: 'rgba(255,255,255,0.06)',
            right: '-80px',
          }}
        >
          ☽
        </div>

        {/* Star watermark */}
        <div
          className="absolute select-none pointer-events-none"
          style={{
            fontSize: '120px',
            color: 'rgba(255,255,255,0.05)',
            top: '20%',
            right: '18%',
          }}
        >
          ★
        </div>

        {/* Logo */}
        <div>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
            >
              TR
            </div>
            <span className="text-white font-bold text-xl tracking-wide">TürkçePro</span>
          </div>
        </div>

        {/* Center quote */}
        <div className="relative z-10">
          <div
            className="text-6xl mb-6 font-serif leading-none"
            style={{ color: 'rgba(255,255,255,0.15)' }}
          >
            "
          </div>
          <p className="text-white text-2xl font-light leading-relaxed mb-4">
            Türkisch nicht nur sprechen –<br />
            <span style={{ color: '#F0B429', fontWeight: 600 }}>wirklich beherrschen.</span>
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
            B1 → C1 · KI-Korrekturen · Deyimler · Business-Türkisch
          </p>
        </div>

        {/* Bottom stats */}
        <div className="flex gap-8 relative z-10">
          {[
            { num: '3', label: 'Varianten pro Text' },
            { num: '∞', label: 'Deyimler lernen' },
            { num: 'B1→C1', label: 'Niveau-Sprung' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-white font-bold text-xl">{s.num}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 justify-center mb-10">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
              style={{ background: '#C8102E', color: 'white' }}
            >
              TR
            </div>
            <span className="font-bold text-xl tracking-wide" style={{ color: 'white' }}>
              TürkçePro
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'white' }}>
              {tab === 'login' ? 'Willkommen zurück' : 'Konto erstellen'}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px' }}>
              {tab === 'login'
                ? 'Melde dich an um weiterzuüben.'
                : 'Kostenlos starten – kein Kreditkarte nötig.'}
            </p>
          </div>

          {/* Tab switcher */}
          <div
            className="flex rounded-xl p-1 mb-8"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setError(null); setSuccessMessage(null); }}
                className="flex-1 py-2.5 text-sm font-medium rounded-lg transition-all"
                style={{
                  background: tab === t ? '#C8102E' : 'transparent',
                  color: tab === t ? 'white' : 'rgba(255,255,255,0.4)',
                }}
              >
                {t === 'login' ? 'Anmelden' : 'Registrieren'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                E-Mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="deine@email.de"
                className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: '15px',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid #C8102E';
                  e.target.style.background = 'rgba(200,16,46,0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(255,255,255,0.1)';
                  e.target.style.background = 'rgba(255,255,255,0.07)';
                }}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                Passwort
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                minLength={6}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: '15px',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid #C8102E';
                  e.target.style.background = 'rgba(200,16,46,0.08)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(255,255,255,0.1)';
                  e.target.style.background = 'rgba(255,255,255,0.07)';
                }}
              />
              {tab === 'register' && (
                <p className="mt-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Mindestens 6 Zeichen
                </p>
              )}
            </div>

            {error && (
              <div
                className="p-3 rounded-xl text-sm"
                style={{ background: 'rgba(200,16,46,0.15)', color: '#FCA5A5', border: '1px solid rgba(200,16,46,0.3)' }}
              >
                {error}
              </div>
            )}
            {successMessage && (
              <div
                className="p-3 rounded-xl text-sm"
                style={{ background: 'rgba(34,197,94,0.1)', color: '#86EFAC', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-white transition-all"
              style={{
                background: loading ? 'rgba(200,16,46,0.5)' : 'linear-gradient(135deg, #C8102E, #9B0022)',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '15px',
                boxShadow: loading ? 'none' : '0 4px 24px rgba(200,16,46,0.35)',
              }}
            >
              {loading ? 'Bitte warten…' : tab === 'login' ? 'Anmelden' : 'Konto erstellen'}
            </button>
          </form>

          {/* Footer link */}
          <p className="text-center mt-8 text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {tab === 'login' ? 'Noch kein Konto? ' : 'Bereits registriert? '}
            <button
              type="button"
              onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError(null); setSuccessMessage(null); }}
              style={{ color: '#F0B429', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
            >
              {tab === 'login' ? 'Jetzt registrieren' : 'Anmelden'}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}