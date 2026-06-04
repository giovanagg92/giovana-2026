'use client'

const PRIORITY_CONFIG = {
  urgent:    { emoji: '🔴', color: '#c0392b', bg: '#fff0f0', border: '#c0392b' },
  important: { emoji: '🟡', color: '#b7791f', bg: '#fffbf0', border: '#d4a017' },
  info:      { emoji: '🟢', color: '#276749', bg: '#f0fff4', border: '#27ae60' },
}

export default function EmailList({ emails, loading, selectedId, onSelect }) {
  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 24, animation: 'spin 1s linear infinite' }}>⟳</div>
      <div style={{ fontSize: 12 }}>Chargement...</div>
    </div>
  )

  if (!emails.length) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 32 }}>📭</div>
      <div style={{ fontSize: 13 }}>Aucun email</div>
    </div>
  )

  return (
    <div style={{
      width: '100%', maxWidth: 480, borderRight: '1px solid #e8e8e8',
      overflowY: 'auto', background: '#fff',
      // Mobile: full width; Desktop: fixed width
    }}>
      {emails.map(email => {
        const p = PRIORITY_CONFIG[email.priority]
        const isSelected = email.id === selectedId
        return (
          <div
            key={email.id}
            onClick={() => onSelect(email)}
            style={{
              padding: '12px 14px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer',
              background: isSelected ? '#f8f8f8' : '#fff',
              borderLeft: p ? `3px solid ${p.border}` : '3px solid transparent',
              transition: 'background 0.1s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#0a0a0a', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {email.subject || '(Sans objet)'}
                </div>
                <div style={{ fontSize: 11, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {email.from?.replace(/<.*>/, '').trim()}
                </div>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                {p && <span style={{ fontSize: 14 }}>{p.emoji}</span>}
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{formatDate(email.date)}</div>
              </div>
            </div>

            <div style={{ fontSize: 12, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
              {email.snippet}
            </div>

            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {email.supplier && (
                <span style={{ fontSize: 10, fontWeight: 600, background: '#f0f0f0', color: '#444', padding: '1px 6px', borderRadius: 3 }}>
                  {email.supplier}
                </span>
              )}
              {email.capsule && (
                <span style={{ fontSize: 10, color: '#888', background: '#f8f8f8', padding: '1px 6px', borderRadius: 3, border: '1px solid #eee' }}>
                  {email.capsule}
                </span>
              )}
              {email.action_required && (
                <span style={{ fontSize: 10, fontWeight: 700, background: '#0a0a0a', color: '#fff', padding: '1px 6px', borderRadius: 3 }}>
                  ACTION
                </span>
              )}
              {email.messageCount > 1 && (
                <span style={{ fontSize: 10, color: '#aaa', background: '#f4f4f4', padding: '1px 6px', borderRadius: 3 }}>
                  {email.messageCount} msgs
                </span>
              )}
            </div>

            {email.action && (
              <div style={{ fontSize: 11, color: '#c0392b', marginTop: 4, fontWeight: 500 }}>
                → {email.action}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now - d
    const days = Math.floor(diff / 86400000)
    if (days === 0) return d.toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' })
    if (days === 1) return 'Hier'
    if (days < 7) return d.toLocaleDateString('fr', { weekday: 'short' })
    return d.toLocaleDateString('fr', { day: '2-digit', month: 'short' })
  } catch { return '' }
}
