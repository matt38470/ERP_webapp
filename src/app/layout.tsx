import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'ERP Stock V5',
  description: 'Gestion de stock, lots, mouvements, commandes et documents',
}

const navLinks = [
  { href: '/', label: '🏠 Accueil' },
  { href: '/articles', label: '📦 Articles' },
  { href: '/lots', label: '🗃️ Lots' },
  { href: '/stock', label: '📊 Stock' },
  { href: '/mouvements', label: '🔄 Mouvements' },
  { href: '/commandes', label: '🛒 Commandes' },
  { href: '/documents', label: '📄 Documents' },
  { href: '/previsionnel', label: '📈 Prévisionnel' },
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
        }}>
          <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #333' }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>⚙️ ERP V5</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Gestion de stock</div>
          </div>
          <ul style={{ listStyle: 'none', padding: '16px 0', margin: 0 }}>
            {navLinks.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  style={{
                    display: 'block',
                    padding: '10px 20px',
                    color: '#ccc',
                    textDecoration: 'none',
                    fontSize: 14,
                    borderRadius: 0,
                    transition: 'background 0.15s',
                  }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contenu principal */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#f8f7f5' }}>
          {children}
        </div>
      </body>
    </html>
  )
}
