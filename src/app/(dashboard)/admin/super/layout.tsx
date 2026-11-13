/**
 * Layout dédié Super Admin — remplace complètement le layout dashboard.
 * Aucune sidebar élève, aucun onglet Cours/Coach/etc.
 */
export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0D14] text-white">
      {children}
    </div>
  )
}
