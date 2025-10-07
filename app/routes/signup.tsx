import { usePuterStore } from "~/lib/puter";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

export const meta = () => ([
  { title: 'Resumind | Sign Up' },
  { name: 'description', content: 'Create an account' },
])

export default function Signup() {
  const { isLoading, auth } = usePuterStore();
  const location = useLocation();
  const next = new URLSearchParams(location.search).get('next') || '/';
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (auth.isAuthenticated) navigate(next);
  }, [auth.isAuthenticated, next, navigate]);

  const handleSignup = async () => {
    setSubmitting(true);
    // Using the same signIn for Puter auth; would be signUp if available
    await auth.signIn();
    setSubmitting(false);
  }

  return (
    <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex items-center justify-center">
      <div className="gradient-border shadow-lg">
        <section className="flex flex-col gap-8 bg-white rounded-2xl p-10 w-[min(480px,92vw)]">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1>Create Account</h1>
            <h2>Join Resumind to get started</h2>
          </div>
          <form className="flex flex-col gap-4">
            <div className="form-div">
              <label htmlFor="name">Name</label>
              <input type="text" id="name" placeholder="Jane Doe" disabled />
            </div>
            <div className="form-div">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" placeholder="you@example.com" disabled />
            </div>
            <div className="form-div">
              <label htmlFor="password">Password</label>
              <input type="password" id="password" placeholder="••••••••" disabled />
            </div>
            <button type="button" onClick={handleSignup} className="auth-button" disabled={isLoading || submitting}>
              <p>{(isLoading || submitting) ? 'Creating your account...' : 'Sign Up'}</p>
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
