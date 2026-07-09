const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabase = createClient(
  'https://dmgzqkegfwxwhntsopbq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtZ3pxa2VnZnd4d2hudHNvcGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzEyNDUxNCwiZXhwIjoyMDkyNzAwNTE0fQ.KLRRmkZ5wnPA87LWaeDZ-hl3wLcQqSaEwqhs866oqyQ'
)

const BASE_GEN = 'C:\\Users\\franc\\Desktop\\epreuve bac teranga learn\\Epreuves Bac Gen 2026\\1ergroupe'
const BASE_TECH = 'C:\\Users\\franc\\Desktop\\epreuve bac teranga learn\\Epreuves Bac Tech 2026\\1ergroupe'
// Mapping noms de fichiers -> métadonnées
function detecterMatiere(nom) {
  const n = nom.toLowerCase()
  if (n.includes('maths') || n.includes('math')) return 'MATH'
  if (n.includes('philo')) return 'PHILO'
  if (n.includes('svt')) return 'SVT'
  if (n.includes('francais') || n.includes('fancais') || n.includes('fr-')) return 'FR'
  if (n.includes('anglais') || n.includes('ang')) return 'EN'
  if (n.includes('hg') || n.includes('histoire')) return 'HG'
  if (n.includes('physique') || n.includes('chimie') || n.includes('sciences-phys')) return 'PC'
  if (n.includes('economie') || n.includes('steg')) return 'ECO'
  return 'AUTRE'
}

function detecterSerie(nom) {
  const n = nom.toLowerCase()
  if (n.includes('-s1') || n.includes('_s1') || n.includes('bac-s1')) return 'S1'
  if (n.includes('-s2') || n.includes('_s2') || n.includes('bac-s2') || n.includes('maths-s2')) return 'S2'
  if (n.includes('-l2') || n.includes('_l2') || n.includes('-l-') || n.includes('_l_')) return 'L'
  if (n.includes('steg')) return 'STEG'
  if (n.includes('stidd') || n.includes('f6') || n.includes('t1') || n.includes('t2')) return 'TECH'
  return null
}

function estCorrige(nom) {
  const n = nom.toLowerCase()
  return n.includes('corrig') || n.includes('correction') || n.includes('answer_key') ||
         n.includes('grille') || n.includes('esquisse') || n.includes('canevas') ||
         n.includes('proposition')
}

async function uploadDossier(dossierPath, type, annee) {
  if (!fs.existsSync(dossierPath)) {
    console.log(`Dossier non trouvé: ${dossierPath}`)
    return
  }

  const files = fs.readdirSync(dossierPath).filter(f => f.endsWith('.pdf'))
  console.log(`\n📁 ${dossierPath} — ${files.length} fichiers`)

  for (const file of files) {
    const filePath = path.join(dossierPath, file)
    const fileBuffer = fs.readFileSync(filePath)
    const isCorrige = estCorrige(file)
    const matiere = detecterMatiere(file)
    const serie = detecterSerie(file)

    const storageKey = `epreuves/bac-${type}-${annee}/${isCorrige ? 'corriges' : 'sujets'}/${file}`

    try {
      // Upload dans Storage
      const { error: uploadError } = await supabase.storage
        .from('cours-pdf')
        .upload(storageKey, fileBuffer, {
          contentType: 'application/pdf',
          upsert: true
        })

      if (uploadError) {
        console.log(`❌ Upload échoué: ${file} — ${uploadError.message}`)
        continue
      }

      const { data: urlData } = supabase.storage
        .from('cours-pdf')
        .getPublicUrl(storageKey)

      const titre = file
        .replace('.pdf', '')
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .trim()

      // Vérifier si déjà en base
      const { data: existing } = await supabase
        .from('epreuves')
        .select('id')
        .eq('titre', titre)
        .single()

      if (existing) {
        console.log(`⏭️ Déjà existant: ${titre}`)
        continue
      }

      // Insérer en base
      const { error: dbError } = await supabase
        .from('epreuves')
        .insert({
          titre,
          matiere,
          classe: 'terminale',
          semestre: null,
          type: isCorrige ? 'corrige' : 'bac',
          annee: parseInt(annee),
          pdf_url: urlData.publicUrl,
          corrige_url: null,
          ordre: 1
        })

      if (dbError) {
        console.log(`❌ DB erreur: ${titre} — ${dbError.message}`)
      } else {
        console.log(`✅ ${isCorrige ? '📝 Corrigé' : '📋 Sujet'}: ${titre}`)
      }

    } catch (err) {
      console.log(`❌ Erreur: ${file} — ${err.message}`)
    }
  }
}

async function main() {
  console.log('🚀 Upload épreuves BAC 2026...\n')

  // Bac Général - Épreuves
  await uploadDossier(
    path.join(BASE_GEN, 'epreuves'),
    'gen', '2026'
  )

  // Bac Général - Corrigés
  await uploadDossier(
    path.join(BASE_GEN, 'corriges'),
    'gen', '2026'
  )

  // Bac Tech - Épreuves
  await uploadDossier(
    path.join(BASE_TECH, 'epreuves'),
    'tech', '2026'
  )

  // Bac Tech - Corrigés
  await uploadDossier(
    path.join(BASE_TECH, 'corriges'),
    'tech', '2026'
  )

  console.log('\n🎉 Upload terminé !')
}

main()