'use client'
import { useState, useEffect, useCallback } from 'react'
import EmailList from './EmailList'
import EmailDetail from './EmailDetail'
import ComposeModal from './ComposeModal'
import StatsPanel from './StatsPanel'

const FOLDERS = [
  { key: 'ALL', label: '📨 Tous', color: '#0a0a0a' },
  { key: 'USINES', label: '🏭 Usines', color: '#2d3748' },
  { key: 'TISSUS', label: '🧵 Tissus', color: '#2b6cb0' },
  { key: 'TRIMS', label: '🔩 Trims', color: '#6b46c1' },
  { key: 'ENTREPOT', label: '📦 Entrepôt', color: '#276749' },
  { key: 'TEAM', label: '👥 Team', color: '#c05621' },
]

const DAYS_OPTIONS = [3, 7, 14, 30]

export default function Dashboard({ session }) {
  const [activeFolder, setActiveFolder] = useState('ALL')
  const [activeView, setActiveView] = useState('inbox') // inbox | stats | relances
  const [days, setDays] = useState(7)
  const [emails, setEmails] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [showCompose, setShowCompose] = useState(false)
  const [composeContext, setComposeContext] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState('all')
  const [relances, setRelances] = useState([])

  // Fetch emails
  const fetchEmails = useCallback(async () => {
    setLoading(true)
    setAnalysis(null)
    try {
      const res = await fetch(`/api/gmail?folder=${activeFolder}&days=${days}`)
      const data = await res.json()
      setEmails(data.threads || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [activeFolder, days])

  // Analyze with Gemini
  const analyzeInbox = useCallback(async () => {
    if (!emails.length) return
    setAnalyzing(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze_inbox', emails }),
      })
      const data = await res.json()
      setAnalysis(data)

      // Detect relances
      const relRes = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'detect_relances', emails }),
      })
      const relData = await relRes.json()
      setRelances(relData.relances || [])
    } catch (e) {
      console.error(e)
    }
    setAnalyzing(false)
  }, [emails])

  useEffect(() => { fetchEmails() }, [fetchEmails])

  // Merge analysis with emails
  const enrichedEmails = emails.map(email => {
    const ai = analysis?.emails?.find(a => a.id === email.id)
    return { ...email, ...ai }
  })

  // Filter
  const filtered = enrichedEmails.filter(e => {
    if (filterPriority !== 'all' && e.priority !== filterPriority) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        e.subject?.toLowerCase().includes(q) ||
        e.from?.toLowerCase().includes(q) ||
        e.supplier?.toLowerCase().includes(q) ||
        e.snippet?.toLowerCase().includes(q)
      )
    }
    return true
  }).sort((a, b) => {
    const order = { urgent: 0, important: 1, info: 2 }
    return (order[a.priority] ?? 3) - (order[b.priority] ?? 3)
  })

  const handleCompose = (context = null) => {
    setComposeContext(context)
    setShowCompose(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#fafafa' }}>
      {/* Top header */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e8e8e8',
        padding: '12px 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100,
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, background: '#0a0a0a', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 12, flexShrink: 0,
          }}>TF</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: '0.04em', lineHeight: 1.2 }}>THE FRANKIE SHOP</div>
            <div style={{ fontSize: 10, color: '#999', letterSpacing: '0.08em' }}>PRODUCTION</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select value={days} onChange={e => setDays(Number(e.target.value))}
            style={{ padding: '5px 8px', fontSize: 12, border: '1px solid #ddd', borderRadius: 4, background: '#fff' }}>
            {DAYS_OPTIONS.map(d => <option key={d} value={d}>{d}j</option>)}
          </select>
          <button onClick={fetchEmails} disabled={loading}
            style={{
              padding: '6px 12px', fontSize: 12, fontWeight: 600,
              background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 4,
            }}>
            {loading ? '⟳' : '↻'} Sync
          </button>
          <button onClick={() => handleCompose()}
            style={{
              padding: '6px 12px', fontSize: 12, fontWeight: 600,
              background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 4,
            }}>
            ✉ Nouveau
          </button>
        </div>
      </div>

      {/* Folder tabs */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e8e8e8',
        display: 'flex', overflowX: 'auto', padding: '0 12px',
        gap: 2, scrollbarWidth: 'none',
      }}>
        {FOLDERS.map(f => (
          <button key={f.key} onClick={() => setActiveFolder(f.key)}
            style={{
              padding: '10px 14px', fontSize: 12, fontWeight: 600, border: 'none',
              background: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              borderBottom: activeFolder === f.key ? `2px solid ${f.color}` : '2px solid transparent',
              color: activeFolder === f.key ? f.color : '#888',
            }}>
            {f.label}
            {activeFolder === f.key && emails.length > 0 && (
              <span style={{ marginLeft: 6, fontSize: 10, background: f.color, color: '#fff', padding: '1px 5px', borderRadius: 10 }}>
                {emails.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* View tabs */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e8e8e8',
        display: 'flex', padding: '0 12px', gap: 2,
      }}>
        {[
          { key: 'inbox', label: '📨 Inbox' },
          { key: 'relances', label: `⚡ Relances${relances.length ? ` (${relances.length})` : ''}` },
          { key: 'stats', label: '📊 Stats' },
        ].map(v => (
          <button key={v.key} onClick={() => setActiveView(v.key)}
            style={{
              padding: '8px 12px', fontSize: 12, fontWeight: 600, border: 'none',
              background: 'none', cursor: 'pointer',
              borderBottom: activeView === v.key ? '2px solid #0a0a0a' : '2px solid transparent',
              color: activeView === v.key ? '#0a0a0a' : '#888',
            }}>
            {v.label}
          </button>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
          <button onClick={analyzeInbox} disabled={analyzing || !emails.length}
            style={{
              padding: '5px 12px', fontSize: 11, fontWeight: 700,
              background: analyzing ? '#ccc' : '#0a0a0a',
              color: '#fff', border: 'none', borderRadius: 4,
            }}>
            {analyzing ? '⟳ Analyse...' : '🤖 Analyser IA'}
          </button>
        </div>
      </div>

      {/* Search + filter bar */}
      {activeView === 'inbox' && (
        <div style={{
          background: '#fff', borderBottom: '1px solid #e8e8e8',
          padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <input
            placeholder="🔍 Rechercher..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              flex: 1, padding: '6px 10px', fontSize: 12,
              border: '1px solid #e8e8e8', borderRadius: 4, outline: 'none',
            }}
          />
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
            style={{ padding: '6px 8px', fontSize: 12, border: '1px solid #e8e8e8', borderRadius: 4 }}>
            <option value="all">Tout</option>
            <option value="urgent">🔴 Urgent</option>
            <option value="important">🟡 Important</option>
            <option value="info">🟢 Info</option>
          </select>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {activeView === 'inbox' && (
          <>
            <EmailList
              emails={filtered}
              loading={loading}
              selectedId={selectedEmail?.id}
              onSelect={setSelectedEmail}
              analysis={analysis}
            />
            {selectedEmail && (
              <EmailDetail
                email={selectedEmail}
                onClose={() => setSelectedEmail(null)}
                onCompose={(ctx) => handleCompose(ctx)}
              />
            )}
          </>
        )}

        {activeView === 'relances' && (
          <RelancesView
            relances={relances}
            analyzing={analyzing}
            onCompose={handleCompose}
          />
        )}

        {activeView === 'stats' && (
          <StatsPanel emails={enrichedEmails} analysis={analysis} />
        )}
      </div>

      {/* Compose modal */}
      {showCompose && (
        <ComposeModal
          context={composeContext}
          onClose={() => { setShowCompose(false); setComposeContext(null) }}
          onSent={fetchEmails}
        />
      )}
    </div>
  )
}

function RelancesView({ relances, analyzing, onCompose }) {
  if (analyzing) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
      <div>⟳ Détection en cours...</div>
    </div>
  )

  if (!relances.length) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: '#bbb' }}>
      <div style={{ fontSize: 32 }}>✅</div>
      <div style={{ fontSize: 13 }}>Aucune relance nécessaire</div>
      <div style={{ fontSize: 12 }}>Clique sur "Analyser IA" pour détecter</div>
    </div>
  )

  const urgencyColor = { haute: '#c0392b', moyenne: '#b7791f', faible: '#276749' }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.08em', marginBottom: 12 }}>
        {relances.length} FOURNISSEUR{relances.length > 1 ? 'S' : ''} À RELANCER
      </div>
      {relances.map((r, i) => (
        <div key={i} style={{
          background: '#fff', border: '1px solid #e8e8e8',
          borderLeft: `3px solid ${urgencyColor[r.urgency] || '#888'}`,
          borderRadius: 6, padding: 14, marginBottom: 8,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{r.supplier}</div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>{r.reason}</div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 3,
                background: urgencyColor[r.urgency] + '20',
                color: urgencyColor[r.urgency],
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {r.urgency}
              </span>
            </div>
            <button
              onClick={() => onCompose({ type: 'relance', supplier: r.supplier, subject: r.suggested_subject })}
              style={{
                padding: '6px 12px', fontSize: 12, fontWeight: 600, flexShrink: 0,
                background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 4,
              }}>
              ✉ Relancer
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
