-- Fix : permettre aux admins d'insérer des notifications
-- (la table notifications n'avait pas de policy INSERT)

CREATE POLICY "notifications_insert_admin" ON notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Aussi permettre la lecture de toutes les notifications pour la vue admin
CREATE POLICY "notifications_read_admin" ON notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );
