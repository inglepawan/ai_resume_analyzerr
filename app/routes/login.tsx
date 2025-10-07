import { usePuterStore } from "~/lib/puter";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

export const meta = () => ([
  { title: 'Resumind | Log In' },
  { name: 'description', content: 'Log into your account' },
])

export default function Login() {
  const { isLoading, auth } = usePuterStore();
  const location = useLocation();
  const next = new URLSearchParams(location.search).get('next') || '/';
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (auth.isAuthenticated) navigate(next);
  }, [auth.isAuthenticated, next, navigate]);

  const handleLogin = async () => {
    setSubmitting(true);
    await auth.signIn();
    setSubmitting(false);
  }

  return (
    <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex items-center justify-center">
      <div className="gradient-border shadow-lg">
        <section className="flex flex-col gap-8 bg-white rounded-2xl p-10 w-[min(480px,92vw)]">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1>Welcome Back</h1>
            <h2>Sign in to continue</h2>
          </div>
          <form className="flex flex-col gap-4">
            <div className="form-div">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" placeholder="you@example.com" disabled />
            </div>
            <div className="form-div">
              <label htmlFor="password">Password</label>
              <input type="password" id="password" placeholder="••••••••" disabled />
            </div>
            <button type="button" onClick={handleLogin} className="auth-button" disabled={isLoading || submitting}>
              <p>{(isLoading || submitting) ? 'Signing you in...' : 'Log In'}</p>
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
