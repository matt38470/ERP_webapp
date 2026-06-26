import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'ERP Stock V5',
  description: 'Gestion de stock, lots, mouvements, commandes et documents',
}

const navGroups = [
  {
    label: 'Stock',
    links: [
      { href: '/',            label: '🏠 Accueil' },
      { href: '/articles',    label: '📦 Articles' },
      { href: '/lots',        label: '🗃️ Lots' },
      { href: '/stock',       label: '📊 Stock' },
      { href: '/mouvements',  label: '🔄 Mouvements' },
    ],
  },
  {
    label: 'Commercial',
    links: [
      { href: '/clients',     label: '👤 Clients' },
      { href: '/commandes',   label: '🛒 Commandes' },
      { href: '/documents',   label: '📄 BL / Factures' },
    ],
  },
  {
    label: 'Achats',
    links: [
      { href: '/fournisseurs',label: '🏭 Fournisseurs' },
    ],
  },
  {
    label: 'Analyse',
    links: [
      { href: '/previsionnel', label: '📈 Prévisionnel' },
    ],
  },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <nav style={{
          width: 220,
          background: '#1e1e2e',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 0',
          flexShrink: 0,
          minHeight: '100vh',
          overflowY: 'auto',
        }}>
          <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #333' }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>⚙️ ERP V5</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Gestion de stock</div>
          </div>

          {navGroups.map(group => (
            <div key={group.label} style={{ marginTop: 16 }}>
              <div style={{ padding: '4px 20px 6px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#555' }}>
                {group.label}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {group.links.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      style={{
                        display: 'block',
                        padding: '9px 20px',
                        color: '#ccc',
                        textDecoration: 'none',
                        fontSize: 14,
                        transition: 'background 0.15s',
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Contenu principal */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#f8f7f5' }}>
          {children}
        </div>
      </body>
    </html>
  )
}
