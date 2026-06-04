'use client'
import { useState, useEffect } from 'react'

const EMAIL_TYPES = [
  { key: 'relance', label: '⚡ Relance' },
  { key: 'commande', label: '📋 Commande' },
  { key: 'etd', label: '📅 ETD' },
  { key: 'urgence', label: '🚨 Urgence' },
  { key: 'facturation', label: '🧾 Facturation' },
]

export default function EmailDetail({ email, onClose, onCompose }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fullContent, setFullContent] = useState(null)
  const [loadingContent, setLoadingContent] = useState(false)

  // Auto-summarize when email selected
  useEffect(() => {
    if (email?.snippet) {
      summarizeEmail()
    }
  }, [email?.id])

  const summarizeEmail = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'summarize',
          emailContent: `Sujet: ${email.subject}\nDe: ${email.from}\nContenu: ${email.snippet}`,
        }),
      })
      const data = await res.json()
      setSummary(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const loadFullEmail = async () => {
    setLoadingContent(true)
    try {
      const res = await fetch(`/api/gmail?threadId=${email.id}`)
      const data = await res.json()
      const messages = data.messages || []
      const lastMsg = messages[messages.length - 1]
      const body = decodeEmailBody(lastMsg?.payload)
      setFullContent(body)
    } catch (e) { console.error(e) }
    setLoadingContent(false)
  }

  return (
    <div style={{
      flex: 1, overflowY: 'auto', background: '#fff',
      borderLeft: '1px solid #e8e8e8',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Detail header */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid #e8e8e8',
        position: 'sticky', top: 0, background: '#fff', zIndex: 10,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, lineHeight: 1.4 }}>
              {email.subject}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>{email.from}</div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{email.date}</div>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 20, color: '#aaa', cursor: 'pointer', padding: 4 }}>
            ✕
          </button>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {email.priority && (
            <PriorityBadge priority={email.priority} />
          )}
          {email.supplier && (
            <span style={{ fontSize: 11, fontWeight: 600, background: '#f0f0f0', color: '#333', padding: '3px 8px', borderRadius: 4 }}>
              {email.supplier}
            </span>
          )}
          {email.capsule && (
            <span style={{ fontSize: 11, color: '#555', background: '#f8f8f8', padding: '3px 8px', borderRadius: 4, border: '1px solid #eee' }}>
              {email.capsule}
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: 16, flex: 1 }}>
        {/* AI Summary */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.08em', marginBottom: 8 }}>
            🤖 ANALYSE IA
          </div>
          {loading ? (
            <div style={{ fontSize: 12, color: '#aaa' }}>Analyse en cours...</div>
          ) : summary ? (
            <div style={{ background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: 6, padding: 12 }}>
              <p style={{ fontSize: 13, color: '#333', marginBottom: summary.key_points?.length ? 10 : 0, lineHeight: 1.6 }}>
                {summary.summary}
              </p>
              {summary.key_points?.length > 0 && (
                <ul style={{ paddingLeft: 16, margin: 0 }}>
                  {summary.key_points.map((p, i) => (
                    <li key={i} style={{ fontSize: 12, color: '#555', marginBottom: 3 }}>{p}</li>
                  ))}
                </ul>
              )}
              {summary.action && (
                <div style={{ marginTop: 10, padding: '6px 10px', background: '#fff0f0', borderRadius: 4, fontSize: 12, color: '#c0392b', fontWeight: 600 }}>
                  → {summary.action}
                </div>
              )}
              {(summary.etd || summary.quantities || summary.references) && (
                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {summary.etd && <InfoChip label="ETD" value={summary.etd} />}
                  {summary.quantities && <InfoChip label="QTÉ" value={summary.quantities} />}
                  {summary.references && <InfoChip label="RÉF" value={summary.references} />}
                </div>
              )}
            </div>
          ) : (
            <button onClick={summarizeEmail}
              style={{ fontSize: 12, color: '#0a0a0a', background: '#f0f0f0', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}>
              Analyser cet email
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.08em', marginBottom: 8 }}>
            CONTENU
          </div>
          <div style={{ background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: 6, padding: 12 }}>
            {fullContent ? (
              <div style={{ fontSize: 13, color: '#333', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto' }}>
                {fullContent}
              </div>
            ) : (
              <>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 8 }}>
                  {email.snippet}
                </p>
                <button onClick={loadFullEmail} disabled={loadingContent}
                  style={{ fontSize: 11, color: '#666', background: 'none', border: '1px solid #ddd', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}>
                  {loadingContent ? 'Chargement...' : 'Voir email complet'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Reply actions */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.08em', marginBottom: 10 }}>
            RÉPONDRE
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {EMAIL_TYPES.map(t => (
              <button key={t.key}
                onClick={() => onCompose({
                  type: t.key,
                  supplier: email.supplier,
                  capsule: email.capsule,
                  threadId: email.id,
                  replyTo: email.from,
                  subject: `Re: ${email.subject}`,
                })}
                style={{
                  padding: '10px 12px', fontSize: 12, fontWeight: 600,
                  background: t.key === 'urgence' ? '#fff0f0' : '#f8f8f8',
                  color: t.key === 'urgence' ? '#c0392b' : '#333',
                  border: `1px solid ${t.key === 'urgence' ? '#f5c6cb' : '#e8e8e8'}`,
                  borderRadius: 6, cursor: 'pointer', textAlign: 'left',
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PriorityBadge({ priority }) {
  const config = {
    urgent:    { emoji: '🔴', label: 'URGENT',    color: '#c0392b', bg: '#fff0f0' },
    important: { emoji: '🟡', label: 'IMPORTANT', color: '#b7791f', bg: '#fffbf0' },
    info:      { emoji: '🟢', label: 'INFO',      color: '#276749', bg: '#f0fff4' },
  }
  const c = config[priority] || config.info
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, background: c.bg, color: c.color,
      padding: '3px 8px', borderRadius: 4, letterSpacing: '0.04em',
    }}>
      {c.emoji} {c.label}
    </span>
  )
}

function InfoChip({ label, value }) {
  return (
    <span style={{ fontSize: 11, background: '#fff', border: '1px solid #e8e8e8', padding: '3px 8px', borderRadius: 4 }}>
      <strong style={{ color: '#888' }}>{label}:</strong> <span style={{ color: '#333' }}>{value}</span>
    </span>
  )
}

function decodeEmailBody(payload) {
  if (!payload) return null
  if (payload.body?.data) {
    try { return atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/')) } catch { return null }
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        try { return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/')) } catch {}
      }
    }
    for (const part of payload.parts) {
      const result = decodeEmailBody(part)
      if (result) return result
    }
  }
  return null
}
