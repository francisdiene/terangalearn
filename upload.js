const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabase = createClient(
  'https://dmgzqkegfwxwhntsopbq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtZ3pxa2VnZnd4d2hudHNvcGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzEyNDUxNCwiZXhwIjoyMDkyNzAwNTE0fQ.KLRRmkZ5wnPA87LWaeDZ-hl3wLcQqSaEwqhs866oqyQ'
)

const BUCKET = 'cours-pdf'
const BASE = 'C:\\Users\\franc\\Desktop\\Fichier Pedagogique terangaLearn'

const DOSSIERS = [
  { local: 'Match 3em', remote: 'epreuves/math-3eme' },
  { local: 'Math Terminal S1 & S2', remote: 'epreuves/math-terminale-s1s2' },
  { local: 'Math Terminal L', remote: 'epreuves/math-terminale-l' },
  { local: 'Oeuvre au Programme 3em', remote: 'bibliotheque/3eme' },
  { local: 'Oeuvre au Programme Terminal', remote: 'bibliotheque/terminale' },
]

// Nettoyer le nom de fichier pour Supabase
function cleanFileName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer accents
    .replace(/['']/g, '') // Supprimer apostrophes
    .replace(/[àáâã]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõ]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-zA-Z0-9._\-() ]/g, '_') // Remplacer autres caractères spéciaux
    .replace(/\s+/g, '_') // Espaces → underscores
    .replace(/_+/g, '_') // Éviter double underscores
}

async function upload() {
  for (const dossier of DOSSIERS) {
    const localPath = path.join(BASE, dossier.local)
    const files = fs.readdirSync(localPath).filter(f => f.endsWith('.pdf'))

    console.log(`\n📁 Upload ${dossier.local} (${files.length} fichiers)...`)

    for (const file of files) {
      const filePath = path.join(localPath, file)
      const fileBuffer = fs.readFileSync(filePath)
      const cleanName = cleanFileName(file)
      const remotePath = `${dossier.remote}/${cleanName}`

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(remotePath, fileBuffer, {
          contentType: 'application/pdf',
          upsert: true
        })

      if (error) {
        console.log(`❌ ${file} → ${error.message}`)
      } else {
        console.log(`✅ ${file} → ${cleanName}`)
      }
    }
  }
  console.log('\n🎉 Upload terminé !')
}

upload()