'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── Styles communs ───
const inputStyle = {
  width: '100%', boxSizing: 'border-box' as const,
  border: '1px solid #d1d5db', borderRadius: 8, padding: '9px 12px',
  fontSize: 13, color: '#111827', background: '#fff', outline: 'none', fontFamily: 'inherit',
}
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700 as const,
  textTransform: 'uppercase' as const, letterSpacing: '.07em', color: '#6b7280', marginBottom: 5,
}

// ─── Composants définis HORS du parent pour éviter la perte de focus ───

function Section({ icon, title, action, children }: { icon: string; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
      <div style={{ padding: '14px 22px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#374151' }}>{title}</span>
        </div>
        {action}
      </div>
      <div style={{ padding: '20px 22px' }}>{children}</div>
    </section>
  )
}

function Grid({ cols = 4, children }: { cols?: number; children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>{children}</div>
}

function ReadField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p style={labelStyle}>{label}</p>
      <p style={{ fontSize: 13, color: '#111827', margin: 0 }}>
        {value || <span style={{ color: '#d1d5db' }}>—</span>}
      </p>
    </div>
  )
}

function EditField({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={inputStyle} />
    </div>
  )
}

function EF({ label, field, type, placeholder, form, setForm }: {
  label: string; field: string; type?: string; placeholder?: string
  form: Record<string, string>; setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>
}) {
  return <EditField label={label} type={type} placeholder={placeholder} value={form[field] ?? ''} onChange={v => setForm(p => ({ ...p, [field]: v }))} />
}

// ─── Types ───
type Article = {
  id: number; code: string; indice: string | null; designationFr: string; designationEn: string | null
  etat: string | null; famille: string | null; sousFamille: string | null
  diametre: string | null; longueur: string | null; largeur: string | null; autreCarac: string | null
  typeProduit: string | null; prixAchatRef: string | null; stockMin: string | null; stockSecurite: string | null
  commentaire: string | null; isActive: boolean; type: string; createdAt: string
  lots: { id: number; lotNumber: string; quantity: string; status: string; receivedAt: string | null }[]
}
type SupplierPrice = {
  id: number; supplierId: number; unitPrice: string; qtyMin: string | null
  refDevis: string | null; dateDevis: string | null; validFrom: string | null; validTo: string | null
  currency: string; note: string | null; isActive: boolean
  supplier: { id: number; code: string; name: string }
}
type Supplier = { id: number; code: string; name: string }

// ─── Ligne de tarif ───
function PriceRow({ sp, onDelete }: { sp: SupplierPrice; onDelete: (id: number) => void }) {
  const tdStyle = { padding: '10px 12px', fontSize: 13, borderBottom: '1px solid #f9fafb' }
  return (
    <tr style={{ borderBottom: '1px solid #f9fafb' }}>
      <td style={tdStyle}>
        <span style={{ fontWeight: 600 }}>{sp.supplier.name}</span>
        <span style={{ color: '#9ca3af', fontSize: 11, marginLeft: 6 }}>({sp.supplier.code})</span>
      </td>
      <td style={{ ...tdStyle, fontWeight: 700, color: '#065f46', fontVariantNumeric: 'tabular-nums' }}>
        {Number(sp.unitPrice).toFixed(4)} {sp.currency}
      </td>
      <td style={{ ...tdStyle, color: '#6b7280' }}>{sp.qtyMin != null ? `≥ ${Number(sp.qtyMin)}` : '—'}</td>
      <td style={{ ...tdStyle, color: '#6b7280' }}>{sp.refDevis || '—'}</td>
      <td style={{ ...tdStyle, color: '#9ca3af', fontSize: 12 }}>{sp.dateDevis ? new Date(sp.dateDevis).toLocaleDateString('fr-FR') : '—'}</td>
      <td style={{ ...tdStyle, color: '#9ca3af', fontSize: 12 }}>
        {sp.validFrom ? new Date(sp.validFrom).toLocaleDateString('fr-FR') : '—'}
        {sp.validTo ? ` → ${new Date(sp.validTo).toLocaleDateString('fr-FR')}` : ''}
      </td>
      <td style={tdStyle}>
        <button onClick={() => onDelete(sp.id)} style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 4 }}>✕ Supprimer</button>
      </td>
    </tr>
  )
}

// ─── Formulaire ajout tarif ───
function AddPriceForm({ articleId, suppliers, onAdded }: { articleId: number; suppliers: Supplier[]; onAdded: (sp: SupplierPrice) => void }) {
  const [f, setF] = useState({ supplierId: '', unitPrice: '', qtyMin: '', refDevis: '', dateDevis: '', validFrom: '', validTo: '', currency: 'EUR', note: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF(p => ({ ...p, [k]: e.target.value }))

  const submit = async () => {
    if (!f.supplierId || !f.unitPrice) { setErr('Fournisseur et prix sont obligatoires'); return }
    setSaving(true); setErr('')
    const res = await fetch('/api/supplier-prices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...f, articleId, unitPrice: parseFloat(f.unitPrice), qtyMin: f.qtyMin ? parseFloat(f.qtyMin) : null }),
    })
    if (!res.ok) { setErr('Erreur serveur'); setSaving(false); return }
    const sp = await res.json()
    onAdded(sp)
    setF({ supplierId: '', unitPrice: '', qtyMin: '', refDevis: '', dateDevis: '', validFrom: '', validTo: '', currency: 'EUR', note: '' })
    setSaving(false)
  }

  const smInput = { ...inputStyle, padding: '8px 10px', fontSize: 12 }

  return (
    <div style={{ marginTop: 16, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
      <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#6b7280', marginBottom: 12 }}>Ajouter un tarif</p>
      {err && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 8 }}>⚠️ {err}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <div>
          <label style={{ ...labelStyle, fontSize: 10 }}>Fournisseur *</label>
          <select value={f.supplierId} onChange={set('supplierId')} style={smInput}>
            <option value="">— choisir —</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
        </div>
        <div>
          <label style={{ ...labelStyle, fontSize: 10 }}>Prix unit. *</label>
          <input type="number" step="0.0001" value={f.unitPrice} onChange={set('unitPrice')} style={smInput} placeholder="0.0000" />
        </div>
        <div>
          <label style={{ ...labelStyle, fontSize: 10 }}>Qté min.</label>
          <input type="number" value={f.qtyMin} onChange={set('qtyMin')} style={smInput} placeholder="Sans limite" />
        </div>
        <div>
          <label style={{ ...labelStyle, fontSize: 10 }}>Devise</label>
          <select value={f.currency} onChange={set('currency')} style={smInput}>
            <option value="EUR">€ EUR</option><option value="USD">$ USD</option><option value="GBP">£ GBP</option><option value="CHF">CHF</option>
          </select>
        </div>
        <div>
          <label style={{ ...labelStyle, fontSize: 10 }}>Réf. devis</label>
          <input type="text" value={f.refDevis} onChange={set('refDevis')} style={smInput} /></div>
        <div>
          <label style={{ ...labelStyle, fontSize: 10 }}>Date devis</label>
          <input type="date" value={f.dateDevis} onChange={set('dateDevis')} style={smInput} /></div>
        <div>
          <label style={{ ...labelStyle, fontSize: 10 }}>Valide du</label>
          <input type="date" value={f.validFrom} onChange={set('validFrom')} style={smInput} /></div>
        <div>
          <label style={{ ...labelStyle, fontSize: 10 }}>au</label>
          <input type="date" value={f.validTo} onChange={set('validTo')} style={smInput} /></div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ ...labelStyle, fontSize: 10 }}>Note</label>
          <input type="text" value={f.note} onChange={set('note')} style={smInput} placeholder="Ex: prix valable si commande groupée…" />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button onClick={submit} disabled={saving} style={{ padding: '8px 20px', fontSize: 12, fontWeight: 700, background: '#0c4e54', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          {saving ? 'Ajout…' : '+ Ajouter ce tarif'}
        </button>
      </div>
    </div>
  )
}

function articleToForm(d: Record<string, unknown>): Record<string, string> {
  const f: Record<string, string> = {}
  for (const k of Object.keys(d)) {
    if (typeof d[k] === 'string' || typeof d[k] === 'number') f[k] = String(d[k] ?? '')
    else if (d[k] === null) f[k] = ''
  }
  return f
}

const LOT_STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  AVAILABLE: { bg: '#d1fae5', color: '#065f46' },
  RESERVED:  { bg: '#dbeafe', color: '#1e40af' },
  QUARANTINE:{ bg: '#fef3c7', color: '#92400e' },
  EXPIRED:   { bg: '#fee2e2', color: '#991b1b' },
}

export default function ArticleDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [prices, setPrices] = useState<SupplierPrice[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [showAddPrice, setShowAddPrice] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    fetch(`/api/articles/${id}`)
      .then(r => { if (!r.ok) { setNotFound(true); return null } return r.json() })
      .then(d => { if (!d) return; setArticle(d); setForm(articleToForm(d)) })
      .catch(() => setLoadError('Impossible de charger l\'article.'))
    fetch(`/api/supplier-prices?articleId=${id}`).then(r => r.ok ? r.json() : []).then(setPrices).catch(() => setPrices([]))
    fetch('/api/fournisseurs').then(r => r.ok ? r.json() : []).then(setSuppliers).catch(() => setSuppliers([]))
  }, [id])

  const save = async () => {
    setSaving(true)
    const body: Record<string, unknown> = { ...form }
    for (const k of ['prixAchatRef', 'stockMin', 'stockSecurite']) {
      if (body[k] === '') body[k] = null; else if (body[k]) body[k] = parseFloat(body[k] as string)
    }
    const res = await fetch(`/api/articles/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) { const u = await res.json(); setArticle(u); setForm(articleToForm(u)); setEditing(false) }
    setSaving(false)
  }

  const archive = async () => {
    if (!confirm('Archiver cet article ?')) return
    await fetch(`/api/articles/${id}`, { method: 'DELETE' })
    router.push('/articles')
  }

  const deletePrice = useCallback(async (priceId: number) => {
    if (!confirm('Supprimer ce tarif ?')) return
    await fetch(`/api/supplier-prices/${priceId}`, { method: 'DELETE' })
    setPrices(p => p.filter(x => x.id !== priceId))
  }, [])

  if (notFound) return <div style={{ padding: 40, textAlign: 'center' }}><p style={{ color: '#9ca3af', marginBottom: 16 }}>Article introuvable.</p><Link href="/articles" style={{ color: '#0c4e54' }}>Retour aux articles</Link></div>
  if (loadError) return <div style={{ padding: 40, color: '#ef4444' }}>{loadError}</div>
  if (!article) return <div style={{ padding: 40, color: '#9ca3af', textAlign: 'center' }}>⏳ Chargement…</div>

  const stockTotal = article.lots.filter(l => l.status === 'AVAILABLE').reduce((s, l) => s + Number(l.quantity), 0)

  return (
    <main style={{ padding: '32px 40px', maxWidth: 1000, margin: '0 auto' }}>

      {/* Breadcrumb */}
      <nav style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link href="/articles" style={{ color: '#0c4e54', textDecoration: 'none', fontWeight: 600 }}>Articles</Link>
        <span>›</span>
        <span style={{ color: '#374151', fontWeight: 600 }}>{article.code}</span>
      </nav>

      {/* Header article */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: 0 }}>
              {article.code}{article.indice ? <span style={{ fontSize: 16, fontWeight: 500, color: '#6b7280', marginLeft: 6 }}>({article.indice})</span> : null}
            </h1>
            {!article.isActive && <span style={{ fontSize: 11, background: '#f3f4f6', color: '#6b7280', padding: '2px 10px', borderRadius: 999, fontWeight: 600 }}>Archivé</span>}
            <span style={{ fontSize: 11, background: '#dbeafe', color: '#1e40af', padding: '2px 10px', borderRadius: 999, fontWeight: 600 }}>{article.type}</span>
            {article.typeProduit && <span style={{ fontSize: 11, background: '#f0fdf4', color: '#15803d', padding: '2px 10px', borderRadius: 999, fontWeight: 600 }}>{article.typeProduit}</span>}
          </div>
          <p style={{ color: '#6b7280', marginTop: 6, fontSize: 14 }}>{article.designationFr}</p>
          {article.designationEn && <p style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>{article.designationEn}</p>}
        </div>

        {/* Stock badge */}
        <div style={{ textAlign: 'center', background: stockTotal > 0 ? '#d1fae5' : '#fee2e2', borderRadius: 12, padding: '12px 20px', minWidth: 90, flexShrink: 0 }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: stockTotal > 0 ? '#065f46' : '#991b1b', lineHeight: 1 }}>{stockTotal.toLocaleString('fr-FR')}</div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: stockTotal > 0 ? '#059669' : '#dc2626', marginTop: 4 }}>En stock</div>
        </div>
      </div>

      {/* Boutons action */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        {editing ? (
          <>
            <button onClick={() => setEditing(false)} style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, border: '1px solid #d1d5db', borderRadius: 9, background: '#fff', cursor: 'pointer', color: '#374151' }}>Annuler</button>
            <button onClick={save} disabled={saving} style={{ padding: '9px 22px', fontSize: 13, fontWeight: 700, background: saving ? '#9ca3af' : '#0c4e54', color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer' }}>
              {saving ? '⏳ Enregistrement…' : '✅ Enregistrer'}
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, border: '1px solid #0c4e54', borderRadius: 9, color: '#0c4e54', background: '#fff', cursor: 'pointer' }}>✏️ Modifier</button>
            <button onClick={archive} style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, border: '1px solid #fca5a5', borderRadius: 9, color: '#dc2626', background: '#fff', cursor: 'pointer' }}>🗄️ Archiver</button>
          </>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <Section icon="🏷️" title="Identification">
          <Grid cols={4}>
            {editing ? (
              <>
                <EF label="Code" field="code" form={form} setForm={setForm} />
                <EF label="Indice" field="indice" form={form} setForm={setForm} />
                <EF label="État" field="etat" form={form} setForm={setForm} />
                <EF label="Famille" field="famille" form={form} setForm={setForm} />
                <EF label="Sous-famille" field="sousFamille" form={form} setForm={setForm} />
              </>
            ) : (
              <>
                <ReadField label="Code" value={article.code} />
                <ReadField label="Indice" value={article.indice} />
                <ReadField label="État" value={article.etat} />
                <ReadField label="Famille" value={article.famille} />
                <ReadField label="Sous-famille" value={article.sousFamille} />
                <ReadField label="Type produit" value={article.typeProduit} />
              </>
            )}
          </Grid>
        </Section>

        <Section icon="📝" title="Désignations">
          <Grid cols={2}>
            {editing ? (
              <>
                <EF label="Désignation FR" field="designationFr" form={form} setForm={setForm} />
                <EF label="Désignation EN" field="designationEn" form={form} setForm={setForm} />
              </>
            ) : (
              <>
                <ReadField label="Désignation FR" value={article.designationFr} />
                <ReadField label="Désignation EN" value={article.designationEn} />
              </>
            )}
          </Grid>
        </Section>

        <Section icon="📐" title="Caractéristiques physiques">
          <Grid cols={4}>
            {editing ? (
              <>
                <EF label="Diamètre" field="diametre" form={form} setForm={setForm} />
                <EF label="Longueur" field="longueur" form={form} setForm={setForm} />
                <EF label="Largeur" field="largeur" form={form} setForm={setForm} />
                <EF label="Autre carac." field="autreCarac" form={form} setForm={setForm} />
              </>
            ) : (
              <>
                <ReadField label="Diamètre" value={article.diametre} />
                <ReadField label="Longueur" value={article.longueur} />
                <ReadField label="Largeur" value={article.largeur} />
                <ReadField label="Autre carac." value={article.autreCarac} />
              </>
            )}
          </Grid>
        </Section>

        <Section icon="📦" title="Paramètres stock">
          <Grid cols={3}>
            {editing ? (
              <>
                <EF label="Stock minimum" field="stockMin" type="number" form={form} setForm={setForm} />
                <EF label="Stock sécurité" field="stockSecurite" type="number" form={form} setForm={setForm} />
              </>
            ) : (
              <>
                <ReadField label="Stock minimum" value={article.stockMin} />
                <ReadField label="Stock sécurité" value={article.stockSecurite} />
              </>
            )}
          </Grid>
        </Section>

        <Section icon="💬" title="Commentaire">
          {editing
            ? <textarea value={form.commentaire ?? ''} rows={3}
                onChange={e => setForm(p => ({ ...p, commentaire: e.target.value }))}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
            : <p style={{ fontSize: 13, color: article.commentaire ? '#374151' : '#d1d5db', margin: 0 }}>{article.commentaire || '—'}</p>
          }
        </Section>

        {/* Tarifs fournisseurs */}
        <Section icon="💶" title={`Tarifs fournisseurs (${prices.length})`}
          action={
            <button onClick={() => setShowAddPrice(p => !p)} style={{ fontSize: 12, fontWeight: 600, border: '1px solid #0c4e54', color: '#0c4e54', background: showAddPrice ? '#f0fdf4' : '#fff', padding: '5px 12px', borderRadius: 7, cursor: 'pointer' }}>
              {showAddPrice ? '✕ Annuler' : '+ Ajouter un tarif'}
            </button>
          }>
          {prices.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    {['Fournisseur', 'Prix unit.', 'Qté min', 'Réf. devis', 'Date devis', 'Validité', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#9ca3af' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>{prices.map(sp => <PriceRow key={sp.id} sp={sp} onDelete={deletePrice} />)}</tbody>
              </table>
            </div>
          ) : <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Aucun tarif fournisseur enregistré.</p>}
          {showAddPrice && <AddPriceForm articleId={article.id} suppliers={suppliers} onAdded={sp => { setPrices(p => [...p, sp]); setShowAddPrice(false) }} />}
        </Section>

        {/* Lots */}
        {article.lots.length > 0 && (
          <Section icon="🗃️" title={`Lots (${article.lots.length})`}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  {['N° lot', 'Quantité', 'Statut', 'Reçu le'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0 12px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: '#9ca3af' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {article.lots.map(lot => {
                  const sc = LOT_STATUS_COLOR[lot.status] ?? { bg: '#f3f4f6', color: '#374151' }
                  return (
                    <tr key={lot.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12 }}>{lot.lotNumber}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{Number(lot.quantity).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</td>
                      <td style={{ padding: '10px 12px' }}><span style={{ background: sc.bg, color: sc.color, padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{lot.status}</span></td>
                      <td style={{ padding: '10px 12px', color: '#9ca3af', fontSize: 12 }}>{lot.receivedAt ? new Date(lot.receivedAt).toLocaleDateString('fr-FR') : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Section>
        )}
      </div>
    </main>
  )
}
