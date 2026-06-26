'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── Composants UI réutilisables (définis hors parent pour éviter perte de focus) ───

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#6b7280', marginBottom: 5 }}>
      {text}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
    </label>
  )
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box' as const,
  border: '1px solid #d1d5db', borderRadius: 8, padding: '9px 12px',
  fontSize: 13, color: '#111827', background: '#fff', outline: 'none',
  fontFamily: 'inherit',
}

function TF({ label, value, onChange, required, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void
  required?: boolean; type?: string; placeholder?: string
}) {
  return (
    <div>
      <Label text={label} required={required} />
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={inputStyle} />
    </div>
  )
}

function SF({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void
  options: { v: string; l: string }[]
}) {
  return (
    <div>
      <Label text={label} />
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  )
}

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
      <div style={{ padding: '14px 22px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#374151' }}>{title}</span>
      </div>
      <div style={{ padding: '20px 22px' }}>{children}</div>
    </section>
  )
}

function Grid({ cols = 4, children }: { cols?: number; children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>{children}</div>
}

type FormState = {
  code: string; indice: string; designationFr: string; designationEn: string
  etat: string; famille: string; sousFamille: string; type: string; typeProduit: string
  diametre: string; longueur: string; largeur: string; autreCarac: string
  prixAchatRef: string; stockMin: string; stockSecurite: string; commentaire: string
}

export default function NouvelArticlePage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({
    code: '', indice: '', designationFr: '', designationEn: '',
    etat: '', famille: '', sousFamille: '', type: 'SIMPLE', typeProduit: 'FINI',
    diametre: '', longueur: '', largeur: '', autreCarac: '',
    prixAchatRef: '', stockMin: '', stockSecurite: '', commentaire: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof FormState) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.code.trim()) { setError('Le code article est obligatoire'); return }
    if (!form.designationFr.trim()) { setError('La désignation FR est obligatoire'); return }
    setSaving(true); setError('')
    const body: Record<string, unknown> = { ...form }
    for (const k of ['prixAchatRef', 'stockMin', 'stockSecurite']) {
      if (body[k] === '') delete body[k]; else if (body[k]) body[k] = parseFloat(body[k] as string)
    }
    for (const k of ['indice','designationEn','etat','famille','sousFamille','diametre','longueur','largeur','autreCarac','commentaire']) {
      if (body[k] === '') body[k] = null
    }
    const res = await fetch('/api/articles', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) { const art = await res.json(); router.push(`/articles/${art.id}`) }
    else { setError('Erreur lors de la création'); setSaving(false) }
  }

  return (
    <main style={{ padding: '32px 40px', maxWidth: 1000, margin: '0 auto' }}>

      {/* Breadcrumb */}
      <nav style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link href="/articles" style={{ color: '#0c4e54', textDecoration: 'none', fontWeight: 600 }}>Articles</Link>
        <span>›</span>
        <span style={{ color: '#374151', fontWeight: 600 }}>Nouvel article</span>
      </nav>

      {/* Titre */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: 0 }}>Créer un article</h1>
        <p style={{ color: '#6b7280', marginTop: 6, fontSize: 14 }}>Remplissez les informations ci-dessous puis cliquez sur Créer.</p>
      </div>

      {/* Erreur */}
      {error && (
        <div style={{ marginBottom: 20, background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#9f1239', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚠️</span> {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <Section icon="🏷️" title="Identification">
          <Grid cols={4}>
            <TF label="Code" value={form.code} onChange={set('code')} required placeholder="Ex: VIS-304" />
            <TF label="Indice" value={form.indice} onChange={set('indice')} placeholder="A, B, 01…" />
            <TF label="État" value={form.etat} onChange={set('etat')} placeholder="Ex: Actif" />
            <SF label="Type article" value={form.type} onChange={set('type')} options={[
              { v: 'SIMPLE', l: 'Simple' }, { v: 'KIT', l: 'Kit' }, { v: 'COMPONENT', l: 'Composant' }
            ]} />
            <SF label="Type produit" value={form.typeProduit} onChange={set('typeProduit')} options={[
              { v: 'FINI', l: 'Fini' }, { v: 'EBAUCHE', l: 'Ébauche' },
              { v: 'MATIERE_PREMIERE', l: 'Matière première' }, { v: 'DEMO', l: 'Démo' }
            ]} />
            <TF label="Famille" value={form.famille} onChange={set('famille')} placeholder="Ex: Visserie" />
            <TF label="Sous-famille" value={form.sousFamille} onChange={set('sousFamille')} placeholder="Ex: Inox" />
          </Grid>
        </Section>

        <Section icon="📝" title="Désignations">
          <Grid cols={2}>
            <TF label="Désignation FR" value={form.designationFr} onChange={set('designationFr')} required placeholder="Nom du produit en français" />
            <TF label="Désignation EN" value={form.designationEn} onChange={set('designationEn')} placeholder="Product name in English" />
          </Grid>
        </Section>

        <Section icon="📐" title="Caractéristiques physiques">
          <Grid cols={4}>
            <TF label="Diamètre" value={form.diametre} onChange={set('diametre')} placeholder="Ex: 8mm" />
            <TF label="Longueur" value={form.longueur} onChange={set('longueur')} placeholder="Ex: 50mm" />
            <TF label="Largeur" value={form.largeur} onChange={set('largeur')} placeholder="Ex: 20mm" />
            <TF label="Autre carac." value={form.autreCarac} onChange={set('autreCarac')} placeholder="Ex: M8x50 Inox A2" />
          </Grid>
        </Section>

        <Section icon="📦" title="Stock">
          <Grid cols={3}>
            <TF label="Stock minimum" value={form.stockMin} onChange={set('stockMin')} type="number" placeholder="0" />
            <TF label="Stock sécurité" value={form.stockSecurite} onChange={set('stockSecurite')} type="number" placeholder="0" />
          </Grid>
          <div style={{ marginTop: 12, fontSize: 12, color: '#9ca3af', background: '#f9fafb', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            ℹ️ Le prix d&apos;achat fournisseur se configure après la création, dans la section <strong>Tarifs fournisseurs</strong> de la fiche article.
          </div>
        </Section>

        <Section icon="💬" title="Commentaire">
          <textarea value={form.commentaire} rows={3}
            onChange={e => setForm(p => ({ ...p, commentaire: e.target.value }))}
            placeholder="Notes internes, spécifications particulières…"
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
        </Section>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 28, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
        <Link href="/articles" style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, border: '1px solid #d1d5db', borderRadius: 10, textDecoration: 'none', color: '#374151', background: '#fff' }}>
          Annuler
        </Link>
        <button onClick={submit} disabled={saving} style={{
          padding: '10px 28px', fontSize: 13, fontWeight: 700,
          background: saving ? '#9ca3af' : '#0c4e54', color: '#fff',
          border: 'none', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {saving ? '⏳ Création…' : '✅ Créer l\'article'}
        </button>
      </div>
    </main>
  )
}
