/**
 * Layout groupe (admin) — aucune sidebar élève, aucun nav dashboard.
 * Toutes les pages /admin/* utilisent ce layout minimal.
 */
export default function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0D14] text-white">
      {children}
    </div>
  )
}
