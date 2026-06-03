const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabase = createClient(
  'https://dmgzqkegfwxwhntsopbq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtZ3pxa2VnZnd4d2hudHNvcGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzEyNDUxNCwiZXhwIjoyMDkyNzAwNTE0fQ.KLRRmkZ5wnPA87LWaeDZ-hl3wLcQqSaEwqhs866oqyQ'
)

const ANTHROPIC_KEY = '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'

const BASE = 'C:\\Users\\franc\\Desktop\\Fichier Pedagogique terangaLearn\\Cour officiel Source Verifié\\Terminal'

const DOSSIERS = [
  { local: 'Geographie', matiere: 'HG', chapitreTitle: 'Géographie Terminale', ordre: 10 },
  { local: 'Histoire', matiere: 'HG', chapitreTitle: 'Histoire Terminale', ordre: 11 },
  { local: 'Phylosophie', matiere: 'PHILO', chapitreTitle: 'Philosophie Terminale', ordre: 10 },
  { local: 'SVT L', matiere: 'SVT', chapitreTitle: 'SVT Terminale L', ordre: 10 },
  { local: 'SVT S', matiere: 'SVT', chapitreTitle: 'SVT Terminale S', ordre: 11 },
]

// Délai pour éviter de dépasser les limites de l'API
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function corrigerAvecIA(texte, titre) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `Tu es un correcteur de textes éducatifs sénégalais.
Corrige UNIQUEMENT les fautes d'orthographe, de grammaire et de ponctuation dans ce cours intitulé "${titre}".
Règles :
- Garde exactement le même contenu, les mêmes idées et la même structure
- Ne rajoute rien, ne supprime rien
- Corrige les mots mal orthographiés (ex: "phylosophie" → "philosophie", "mamifere" → "mammifère")
- Améliore la ponctuation si nécessaire
- Retourne UNIQUEMENT le texte corrigé, sans commentaire ni explication

Texte à corriger :
${texte}`
        }]
      })
    })

    const data = await response.json()
    
    if (data.content && data.content[0]) {
      return data.content[0].text
    }
    
    console.log(`⚠️ Réponse inattendue pour ${titre}`)
    return texte // Retourner l'original si erreur

  } catch (err) {
    console.log(`⚠️ Erreur IA pour ${titre}: ${err.message}`)
    return texte // Retourner l'original si erreur
  }
}

function formatContenu(texte, titre) {
  const lignes = texte.split('\n').filter(l => l.trim())
  let contenu = `# ${titre}\n\n`
  
  for (const ligne of lignes) {
    const trim = ligne.trim()
    if (!trim) continue

    const estTitre = (
      trim.length < 80 &&
      (trim === trim.toUpperCase() && trim.length > 3 ||
       /^(I|II|III|IV|V|VI|VII|VIII|IX|X)[.\)]\s/.test(trim) ||
       /^[A-Z][.\)]\s/.test(trim) ||
       /^\d+[.\)]\s/.test(trim) ||
       trim.endsWith(' :') ||
       (trim.endsWith(':') && trim.length < 50))
    )

    if (estTitre) {
      contenu += `\n## ${trim}\n\n`
    } else if (trim.startsWith('-') || trim.startsWith('•') || trim.startsWith('*')) {
      contenu += `${trim}\n`
    } else {
      contenu += `${trim}\n\n`
    }
  }

  return contenu.trim()
}

function genererResume(texte, titre) {
  const premierePhrase = texte.split('.')[0]?.trim() ?? ''
  return `${titre} — ${premierePhrase.slice(0, 200)}`
}

async function getMatiereId(code) {
  const { data } = await supabase
    .from('matieres')
    .select('id')
    .eq('code', code)
    .single()
  return data?.id
}

async function getOrCreateChapitre(matiereId, titre, ordre) {
  const { data: existing } = await supabase
    .from('chapitres')
    .select('id')
    .eq('matiere_id', matiereId)
    .eq('titre', titre)
    .single()

  if (existing) return existing.id

  const { data } = await supabase
    .from('chapitres')
    .insert({ matiere_id: matiereId, titre, description: titre, ordre })
    .select('id')
    .single()

  return data?.id
}

async function importCours() {
  console.log('🚀 Début import avec correction IA...\n')
  let totalOk = 0
  let totalErr = 0

  for (const dossier of DOSSIERS) {
    const localPath = path.join(BASE, dossier.local)

    if (!fs.existsSync(localPath)) {
      console.log(`⚠️ Dossier non trouvé: ${dossier.local}`)
      continue
    }

    const files = fs.readdirSync(localPath).filter(f => f.endsWith('.txt'))
    console.log(`\n📁 ${dossier.local} — ${files.length} fichiers`)

    const matiereId = await getMatiereId(dossier.matiere)
    if (!matiereId) {
      console.log(`❌ Matière ${dossier.matiere} non trouvée`)
      continue
    }

    const chapitreId = await getOrCreateChapitre(matiereId, dossier.chapitreTitle, dossier.ordre)
    if (!chapitreId) {
      console.log(`❌ Chapitre non créé`)
      continue
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const titre = file.replace('.txt', '').trim()
      const filePath = path.join(localPath, file)

      // Vérifier si déjà importé
      const { data: existing } = await supabase
        .from('cours')
        .select('id')
        .eq('chapitre_id', chapitreId)
        .eq('titre', titre)
        .single()

      if (existing) {
        console.log(`⏭️ Déjà importé: ${titre}`)
        continue
      }

      try {
        const texteRaw = fs.readFileSync(filePath, 'utf8')
        
        console.log(`🤖 Correction IA: ${titre}...`)
        const texteCorrige = await corrigerAvecIA(texteRaw, titre)
        
        const contenu = formatContenu(texteCorrige, titre)
        const resume = genererResume(texteCorrige, titre)
        const duree = Math.max(15, Math.floor(texteRaw.split(' ').length / 150) * 5)

        const { error } = await supabase
          .from('cours')
          .insert({
            chapitre_id: chapitreId,
            titre,
            contenu,
            resume,
            duree_minutes: duree,
            ordre: i + 1
          })

        if (error) {
          console.log(`❌ ${titre} — ${error.message}`)
          totalErr++
        } else {
          console.log(`✅ ${titre} (${duree} min)`)
          totalOk++
        }

        // Pause de 1 seconde entre chaque appel API
        await sleep(1000)

      } catch (err) {
        console.log(`❌ Erreur: ${file} — ${err.message}`)
        totalErr++
      }
    }
  }

  console.log(`\n🎉 Import terminé ! ✅ ${totalOk} cours importés, ❌ ${totalErr} erreurs`)
}

importCours()