'use client'
import { useEffect, useState } from 'react'
import Dashboard from '../components/Dashboard'

export default function Home() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(s => { setSession(s); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#fafafa' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, background: '#0a0a0a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16, margin: '0 auto 16px' }}>TF</div>
        <div style={{ fontSize: 12, color: '#aaa', letterSpacing: '0.1em' }}>CHARGEMENT...</div>
      </div>
    </div>
  )

  if (!session?.user) return <LoginScreen />

  return <Dashboard session={session} />
}

function LoginScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#fafafa', padding: 24,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 320, width: '100%' }}>
        <div style={{
          width: 56, height: 56, background: '#0a0a0a', borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: 22, margin: '0 auto 24px',
          letterSpacing: '-1px',
        }}>TF</div>
        <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '0.05em', marginBottom: 4 }}>THE FRANKIE SHOP</h1>
        <p style={{ fontSize: 12, color: '#888', letterSpacing: '0.1em', marginBottom: 40 }}>ASSISTANT PRODUCTION</p>
        <a
          href="/api/auth/signin/google"
          style={{
            display: 'block', width: '100%', padding: '14px 24px',
            background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          Connexion avec Google
        </a>
        <p style={{ fontSize: 11, color: '#bbb', marginTop: 16 }}>
          giovana.granchi@thefrankieshop.com
        </p>
      </div>
    </div>
  )
}
