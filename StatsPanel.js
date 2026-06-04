'use client'

export default function StatsPanel({ emails, analysis }) {
  if (!emails.length) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 32 }}>📊</div>
      <div style={{ fontSize: 13 }}>Lance une analyse IA pour voir les stats</div>
    </div>
  )

  // By supplier
  const bySupplier = {}
  emails.forEach(e => {
    const key = e.supplier || 'Autre'
    if (!bySupplier[key]) bySupplier[key] = { urgent: 0, important: 0, info: 0, total: 0 }
    if (e.priority) bySupplier[key][e.priority] = (bySupplier[key][e.priority] || 0) + 1
    bySupplier[key].total++
  })

  // By capsule
  const byCapsule = {}
  emails.forEach(e => {
    const key = e.capsule || 'Non détectée'
    if (!byCapsule[key]) byCapsule[key] = 0
    byCapsule[key]++
  })

  // By category
  const byCategory = {}
  emails.forEach(e => {
    const key = e.category || 'autre'
    if (!byCategory[key]) byCategory[key] = 0
    byCategory[key]++
  })

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
      {/* Global stats */}
      {analysis?.stats && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.08em', marginBottom: 10 }}>VUE GLOBALE</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { label: 'TOTAL', val: analysis.stats.total, color: '#0a0a0a', bg: '#f4f4f4' },
              { label: 'URGENT', val: analysis.stats.urgent, color: '#c0392b', bg: '#fff0f0' },
              { label: 'IMPORTANT', val: analysis.stats.important, color: '#b7791f', bg: '#fffbf0' },
              { label: 'INFO', val: analysis.stats.info, color: '#276749', bg: '#f0fff4' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: s.color, letterSpacing: '0.06em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* By supplier */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.08em', marginBottom: 10 }}>PAR FOURNISSEUR</div>
        <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden' }}>
          {Object.entries(bySupplier)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([supplier, counts], i) => (
              <div key={supplier} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderBottom: i < Object.keys(bySupplier).length - 1 ? '1px solid #f4f4f4' : 'none',
              }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{supplier}</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {counts.urgent > 0 && <span style={{ fontSize: 12, color: '#c0392b', fontWeight: 700 }}>🔴 {counts.urgent}</span>}
                  {counts.important > 0 && <span style={{ fontSize: 12, color: '#b7791f', fontWeight: 700 }}>🟡 {counts.important}</span>}
                  {counts.info > 0 && <span style={{ fontSize: 12, color: '#276749', fontWeight: 700 }}>🟢 {counts.info}</span>}
                  <span style={{ fontSize: 11, color: '#aaa' }}>({counts.total})</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* By capsule */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.08em', marginBottom: 10 }}>PAR CAPSULE</div>
        <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden' }}>
          {Object.entries(byCapsule)
            .sort((a, b) => b[1] - a[1])
            .map(([capsule, count], i) => (
              <div key={capsule} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderBottom: i < Object.keys(byCapsule).length - 1 ? '1px solid #f4f4f4' : 'none',
              }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{capsule}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>{count}</span>
              </div>
            ))}
        </div>
      </div>

      {/* By category */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: '0.08em', marginBottom: 10 }}>PAR CATÉGORIE</div>
        <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden' }}>
          {Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, count], i) => (
              <div key={cat} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderBottom: i < Object.keys(byCategory).length - 1 ? '1px solid #f4f4f4' : 'none',
              }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{cat}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0a0a0a' }}>{count}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
