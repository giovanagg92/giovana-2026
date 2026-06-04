'use client'
import { useState, useEffect } from 'react'

const CAPSULES = ['C26.3HS','C26.4','C26.4ESS','C26.4ACC','C26.5','C26.5ACC','REORDER','FW26TFS','FW26MILAN']

const EMAIL_TYPES = [
  { key: 'relance', label: '⚡ Relance' },
  { key: 'commande', label: '📋 Commande' },
  { key: 'etd', label: '📅 Demande ETD' },
  { key: 'urgence', label: '🚨 Urgence' },
  { key: 'facturation', label: '🧾 Facturation compta' },
]

export default function ComposeModal({ context, onClose, onSent }) {
  const [type, setType] = useState(context?.type || 'relance')
  const [to, setTo] = useState(context?.replyTo || '')
  const [subject, setSubject] = useState(context?.subject || '')
  const [body, setBody] = useState('')
  const [supplier, setSupplier] = useState(context?.supplier || '')
  const [capsule, setCapsule] = useState(context?.capsule || '')
  const [extraContext, setExtraContext] = useState('')
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [status, setStatus] = useState(null)

  // Facturation defaults
  useEffect(() => {
    if (type === 'facturation') {
      setTo('ap@thefrankieshop.com')
      setSubject(`FACTURE PRODUCTION / ${supplier || 'FOURNISSEUR'}`)
    }
  }, [type, supplier])

  const generate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'draft',
          emailType: type,
          supplier,
          capsule,
          context: extraContext,
        }),
      })
      const data = await res.json()
      if (data.body) setBody(data.body)
      if (data.subject && !subject) setSubject(data.subject)
      if (data.to && !to) setTo(data.to)
    } catch (e) { console.error(e) }
    setGenerating(false)
  }

  const saveDraft = async () => {
    setSavingDraft(true)
    try {
      const res = await fetch('/api/gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'draft',
          to,
          subject,
          message: body,
          threadId: context?.threadId,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setStatus({ type: 'success', msg: '✅ Brouillon sauvegardé dans Gmail' })
      }
    } catch (e) { setStatus({ type: 'error', msg: '❌ Erreur: ' + e.message }) }
    setSavingDraft(false)
  }

  const send = async () => {
    if (!to || !subject || !body) {
      setStatus({ type: 'error', msg: '❌ Destinataire, sujet et corps requis' })
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          to,
          subject,
          message: body,
          threadId: context?.threadId,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setStatus({ type: 'success', msg: '✅ Email envoyé' })
        setTimeout(() => { onSent?.(); onClose() }, 1500)
      }
    } catch (e) { setStatus({ type: 'error', msg: '❌ Erreur: ' + e.message }) }
    setSending(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      zIndex: 200, padding: '0',
    }}>
      <div style={{
        background: '#fff', width: '100%', maxWidth: 640,
        maxHeight: '92vh', borderRadius: '12px 12px 0 0',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -4px 40px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px', borderBottom: '1px solid #e8e8e8',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '0.04em' }}>NOUVEAU MAIL</div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 22, color: '#aaa', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: 16 }}>
          {/* Type selector */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.08em', marginBottom: 8 }}>TYPE</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {EMAIL_TYPES.map(t => (
                <button key={t.key} onClick={() => setType(t.key)}
                  style={{
                    padding: '6px 12px', fontSize: 12, fontWeight: 600, borderRadius: 4, cursor: 'pointer',
                    background: type === t.key ? '#0a0a0a' : '#f4f4f4',
                    color: type === t.key ? '#fff' : '#444',
                    border: 'none',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Context fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>FOURNISSEUR</label>
              <input value={supplier} onChange={e => setSupplier(e.target.value)}
                placeholder="ex: YUNSA"
                style={{ width: '100%', padding: '7px 10px', fontSize: 13, border: '1px solid #e8e8e8', borderRadius: 4, outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>CAPSULE</label>
              <select value={capsule} onChange={e => setCapsule(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', fontSize: 13, border: '1px solid #e8e8e8', borderRadius: 4 }}>
                <option value="">— Capsule</option>
                {CAPSULES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>CONTEXTE SUPPLÉMENTAIRE</label>
            <input value={extraContext} onChange={e => setExtraContext(e.target.value)}
              placeholder="ex: ETD demandé le 15/06, PO#R2026-045..."
              style={{ width: '100%', padding: '7px 10px', fontSize: 13, border: '1px solid #e8e8e8', borderRadius: 4, outline: 'none' }} />
          </div>

          <button onClick={generate} disabled={generating}
            style={{
              width: '100%', padding: '10px', fontSize: 13, fontWeight: 700, marginBottom: 16,
              background: generating ? '#ccc' : '#0a0a0a', color: '#fff', border: 'none', borderRadius: 6, cursor: generating ? 'default' : 'pointer',
            }}>
            {generating ? '⟳ Génération Gemini...' : '🤖 Générer avec IA'}
          </button>

          {/* Email fields */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>À</label>
            <input value={to} onChange={e => setTo(e.target.value)}
              placeholder="email@fournisseur.com"
              style={{ width: '100%', padding: '7px 10px', fontSize: 13, border: '1px solid #e8e8e8', borderRadius: 4, outline: 'none' }} />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>OBJET</label>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="TFS / CAPSULE / FOURNISSEUR / USINE"
              style={{ width: '100%', padding: '7px 10px', fontSize: 13, border: '1px solid #e8e8e8', borderRadius: 4, outline: 'none' }} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>CORPS</label>
            <textarea value={body} onChange={e => setBody(e.target.value)}
              placeholder="Corps de l'email..."
              rows={8}
              style={{ width: '100%', padding: '8px 10px', fontSize: 13, border: '1px solid #e8e8e8', borderRadius: 4, outline: 'none', resize: 'vertical', lineHeight: 1.6 }} />
          </div>

          {status && (
            <div style={{
              padding: '8px 12px', borderRadius: 4, marginBottom: 12, fontSize: 12, fontWeight: 600,
              background: status.type === 'success' ? '#f0fff4' : '#fff0f0',
              color: status.type === 'success' ? '#276749' : '#c0392b',
              border: `1px solid ${status.type === 'success' ? '#c6f6d5' : '#f5c6cb'}`,
            }}>
              {status.msg}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{
          padding: '12px 16px', borderTop: '1px solid #e8e8e8',
          display: 'flex', gap: 8, paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        }}>
          <button onClick={saveDraft} disabled={savingDraft || !body}
            style={{
              flex: 1, padding: '10px', fontSize: 13, fontWeight: 600,
              background: '#fff', color: '#333', border: '1px solid #ddd', borderRadius: 6,
              cursor: savingDraft || !body ? 'default' : 'pointer',
              opacity: !body ? 0.5 : 1,
            }}>
            {savingDraft ? '⟳' : '💾'} Brouillon
          </button>
          <button onClick={send} disabled={sending || !body || !to}
            style={{
              flex: 2, padding: '10px', fontSize: 13, fontWeight: 700,
              background: sending ? '#ccc' : '#0a0a0a', color: '#fff', border: 'none', borderRadius: 6,
              cursor: sending || !body || !to ? 'default' : 'pointer',
            }}>
            {sending ? '⟳ Envoi...' : '✉ Envoyer'}
          </button>
        </div>
      </div>
    </div>
  )
}
