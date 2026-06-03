const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://dmgzqkegfwxwhntsopbq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtZ3pxa2VnZnd4d2hudHNvcGJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzEyNDUxNCwiZXhwIjoyMDkyNzAwNTE0fQ.KLRRmkZ5wnPA87LWaeDZ-hl3wLcQqSaEwqhs866oqyQ'
)

const BUCKET = 'cours-pdf'
const BASE_URL = 'https://dmgzqkegfwxwhntsopbq.supabase.co/storage/v1/object/public/cours-pdf'

// Mapping noms fichiers → titres lisibles
const TITRES_EPREUVES = {
  // Math 3ème
  'Applications_Affines_et_Applications_affines_par_intervalles.pdf': { titre: 'Applications Affines par intervalles', matiere: 'MATH', classe: '3eme', semestre: null, type: 'exercice' },
  'Applications__Affines.pdf': { titre: 'Applications Affines', matiere: 'MATH', classe: '3eme', semestre: null, type: 'exercice' },
  'Exercices_Angles_inscrits.pdf': { titre: 'Exercices Angles inscrits', matiere: 'MATH', classe: '3eme', semestre: null, type: 'exercice' },
  'Exercices_Angles_inscrits_.pdf': { titre: 'Exercices Angles inscrits (2)', matiere: 'MATH', classe: '3eme', semestre: null, type: 'exercice' },
  'Exercices_corriges_Geometrie_dans_lespace.pdf': { titre: 'Exercices corrigés Géométrie dans l\'espace', matiere: 'MATH', classe: '3eme', semestre: null, type: 'exercice' },
  'Exercices_Dveloppements2.pdf': { titre: 'Exercices Développements 2', matiere: 'MATH', classe: '3eme', semestre: null, type: 'exercice' },
  'Exercices_Developpements_Identite_remarquable.pdf': { titre: 'Exercices Développements Identité remarquable', matiere: 'MATH', classe: '3eme', semestre: null, type: 'exercice' },
  'Exercices_Developpement_1.pdf': { titre: 'Exercices Développement 1', matiere: 'MATH', classe: '3eme', semestre: null, type: 'exercice' },
  'Exercices_Equationd_et_Inequations_du_1er_degre_a_deux_inconnues.pdf': { titre: 'Équations et Inéquations 1er degré à 2 inconnues', matiere: 'MATH', classe: '3eme', semestre: null, type: 'exercice' },
  'Exercices_Equations_Inequations_a_une_inconnue.pdf': { titre: 'Équations Inéquations à une inconnue', matiere: 'MATH', classe: '3eme', semestre: null, type: 'exercice' },
  'Exercices_Equations_Inequations.pdf': { titre: 'Équations et Inéquations', matiere: 'MATH', classe: '3eme', semestre: null, type: 'exercice' },
  'Exercices_Factorisations.pdf': { titre: 'Exercices Factorisations', matiere: 'MATH', classe: '3eme', semestre: null, type: 'exercice' },
  'Exercices_Fractions.pdf': { titre: 'Exercices Fractions', matiere: 'MATH', classe: '3eme', semestre: null, type: 'exercice' },
  'Exercices_Geometrie_dans_lespace.pdf': { titre: 'Exercices Géométrie dans l\'espace', matiere: 'MATH', classe: '3eme', semestre: null, type: 'exercice' },
  'Exercices_Puissances.pdf': { titre: 'Exercices Puissances', matiere: 'MATH', classe: '3eme', semestre: null, type: 'exercice' },
  'Exercices_Racines_carrees2.pdf': { titre: 'Exercices Racines carrées', matiere: 'MATH', classe: '3eme', semestre: null, type: 'exercice' },
  'Exercices_Reperage_dans_le_plan.pdf': { titre: 'Exercices Repérage dans le plan', matiere: 'MATH', classe: '3eme', semestre: null, type: 'exercice' },
  'Exercices_Resolution_de_systemes_dequations.pdf': { titre: 'Exercices Résolution de systèmes d\'équations', matiere: 'MATH', classe: '3eme', semestre: null, type: 'exercice' },
  'Exercices_Statistiques.pdf': { titre: 'Exercices Statistiques', matiere: 'MATH', classe: '3eme', semestre: null, type: 'exercice' },
  'Exercices_THALES.pdf': { titre: 'Exercices THALES', matiere: 'MATH', classe: '3eme', semestre: null, type: 'exercice' },
  'Exercices_Theoreme_de_Thales.pdf': { titre: 'Exercices Théorème de Thalès', matiere: 'MATH', classe: '3eme', semestre: null, type: 'exercice' },
  'Exercices_Theoreme_de_THALES.pdf': { titre: 'Exercices Théorème de THALES (2)', matiere: 'MATH', classe: '3eme', semestre: null, type: 'exercice' },
  'Exercices_Transformations_du_plan.pdf': { titre: 'Exercices Transformations du plan', matiere: 'MATH', classe: '3eme', semestre: null, type: 'exercice' },
  'Exercices_Trigonometrie.pdf': { titre: 'Exercices Trigonométrie', matiere: 'MATH', classe: '3eme', semestre: null, type: 'exercice' },
  'Exercices__Factorisation.pdf': { titre: 'Exercices Factorisation', matiere: 'MATH', classe: '3eme', semestre: null, type: 'exercice' },

  // Math Terminal S1 & S2
  'Exercices_Calcul_dintégral.pdf': { titre: 'Exercices Calcul d\'intégral', matiere: 'MATH', classe: 'terminale', semestre: 'S2', type: 'exercice' },
  'Exercices_corriges_Calculs_dintegrales.pdf': { titre: 'Exercices corrigés Calculs d\'intégrales', matiere: 'MATH', classe: 'terminale', semestre: 'S2', type: 'exercice' },
  'Exercices_corriges_Suites_numeriques_(1).pdf': { titre: 'Exercices corrigés Suites numériques (1)', matiere: 'MATH', classe: 'terminale', semestre: 'S1', type: 'exercice' },
  'Exercices_corriges_Suites_numeriques.pdf': { titre: 'Exercices corrigés Suites numériques', matiere: 'MATH', classe: 'terminale', semestre: 'S1', type: 'exercice' },
  'Exercices_Denombrement.pdf': { titre: 'Exercices Dénombrement', matiere: 'MATH', classe: 'terminale', semestre: 'S2', type: 'exercice' },
  'Exercices_Derivation_et_Primitives.pdf': { titre: 'Exercices Dérivation et Primitives', matiere: 'MATH', classe: 'terminale', semestre: 'S1', type: 'exercice' },
  'Exercices_Equations_differentielles.pdf': { titre: 'Exercices Équations différentielles', matiere: 'MATH', classe: 'terminale', semestre: 'S2', type: 'exercice' },
  'Exercices_Etudes_de_Fonction-.pdf': { titre: 'Exercices Études de Fonctions', matiere: 'MATH', classe: 'terminale', semestre: 'S1', type: 'exercice' },
  'Exercices_Etudes_de_Fonctions._(1).pdf': { titre: 'Exercices Études de Fonctions (2)', matiere: 'MATH', classe: 'terminale', semestre: 'S1', type: 'exercice' },
  'Exercices_Etudes_de_Fonctions....pdf': { titre: 'Exercices Études de Fonctions (3)', matiere: 'MATH', classe: 'terminale', semestre: 'S1', type: 'exercice' },
  'Exercices_Etudes_de_Fonctions..pdf': { titre: 'Exercices Études de Fonctions (4)', matiere: 'MATH', classe: 'terminale', semestre: 'S1', type: 'exercice' },
  'Exercices_Exponentielle.pdf': { titre: 'Exercices Exponentielle', matiere: 'MATH', classe: 'terminale', semestre: 'S1', type: 'exercice' },
  'Exercices_Fonctions_Exponentielles.pdf': { titre: 'Exercices Fonctions Exponentielles', matiere: 'MATH', classe: 'terminale', semestre: 'S1', type: 'exercice' },
  'Exercices_Fonctions_Ln.pdf': { titre: 'Exercices Fonctions Ln', matiere: 'MATH', classe: 'terminale', semestre: 'S1', type: 'exercice' },
  'Exercices_Fonctions_Logarithmes_et_Exponentielles.pdf': { titre: 'Exercices Fonctions Logarithmes et Exponentielles', matiere: 'MATH', classe: 'terminale', semestre: 'S1', type: 'exercice' },
  'Exercices_Limites_et_Continuite.pdf': { titre: 'Exercices Limites et Continuité', matiere: 'MATH', classe: 'terminale', semestre: 'S1', type: 'exercice' },
  'Exercices_Logarithme_Nyperien.pdf': { titre: 'Exercices Logarithme Népérien', matiere: 'MATH', classe: 'terminale', semestre: 'S1', type: 'exercice' },
  'Exercices_Nombres_Complexes..pdf': { titre: 'Exercices Nombres Complexes', matiere: 'MATH', classe: 'terminale', semestre: 'S2', type: 'exercice' },
  'Exercices_Nombres_Complexes.pdf': { titre: 'Exercices Nombres Complexes (2)', matiere: 'MATH', classe: 'terminale', semestre: 'S2', type: 'exercice' },
  'Exercices_Primitives_et_Equations_differentielles.pdf': { titre: 'Exercices Primitives et Équations différentielles', matiere: 'MATH', classe: 'terminale', semestre: 'S2', type: 'exercice' },
  'Exercices_Probabilites..pdf': { titre: 'Exercices Probabilités', matiere: 'MATH', classe: 'terminale', semestre: 'S2', type: 'exercice' },
  'Exercices_Probabilites.pdf': { titre: 'Exercices Probabilités (2)', matiere: 'MATH', classe: 'terminale', semestre: 'S2', type: 'exercice' },
  'Exercices_Statistiques_.pdf': { titre: 'Exercices Statistiques', matiere: 'MATH', classe: 'terminale', semestre: 'S2', type: 'exercice' },

  // Math Terminal L
  'Exercices_Derivabilite.pdf': { titre: 'Exercices Dérivabilité', matiere: 'MATH', classe: 'terminale', semestre: 'S1', type: 'exercice' },
  'Exercices_Equations_Inequations_2nde_L_et_1ere_L_(1).pdf': { titre: 'Équations Inéquations 2nde L et 1ère L (1)', matiere: 'MATH', classe: 'terminale', semestre: 'S1', type: 'exercice' },
  'Exercices_Equations_Inequations_2nde_L_et_1ere_L.pdf': { titre: 'Équations Inéquations 2nde L et 1ère L', matiere: 'MATH', classe: 'terminale', semestre: 'S1', type: 'exercice' },
  'Exercices_Etudes_de_Fonctions.pdf': { titre: 'Exercices Études de Fonctions (L)', matiere: 'MATH', classe: 'terminale', semestre: 'S1', type: 'exercice' },
  'Exercices_Fonctions_exponentielles.pdf': { titre: 'Exercices Fonctions exponentielles (L)', matiere: 'MATH', classe: 'terminale', semestre: 'S1', type: 'exercice' },
  'Exercices_Fonctions_Logarithme_Nyperien.pdf': { titre: 'Exercices Fonctions Logarithme Népérien (L)', matiere: 'MATH', classe: 'terminale', semestre: 'S1', type: 'exercice' },
  'Exercices_Limites_et_Continuite.pdf': { titre: 'Exercices Limites et Continuité (L)', matiere: 'MATH', classe: 'terminale', semestre: 'S1', type: 'exercice' },
  'Exercices_Probabilite.pdf': { titre: 'Exercices Probabilité (L)', matiere: 'MATH', classe: 'terminale', semestre: 'S2', type: 'exercice' },
  'Exercices_Statistiques.pdf': { titre: 'Exercices Statistiques (L)', matiere: 'MATH', classe: 'terminale', semestre: 'S2', type: 'exercice' },
  'Exercices_Suites_numeriques.pdf': { titre: 'Exercices Suites numériques (L)', matiere: 'MATH', classe: 'terminale', semestre: 'S1', type: 'exercice' },
  'Exercices_sur_les_Polynomes.pdf': { titre: 'Exercices sur les Polynômes (L)', matiere: 'MATH', classe: 'terminale', semestre: 'S1', type: 'exercice' },
}

const TITRES_BIBLIOTHEQUE = {
  '3eme': {
    'Ahmadou_kourouma_les_soleils_des_independance-1.pdf': { titre: 'Les Soleils des Indépendances', auteur: 'Ahmadou Kourouma' },
    'Aminata_Sow_Fall_-_La_Greve_des_battu.pdf': { titre: 'La Grève des Bàttu', auteur: 'Aminata Sow Fall' },
    'BERNARD-B.-DADIER-Le-pagne-noir-contes-africains.pdf': { titre: 'Le Pagne noir — Contes africains', auteur: 'Bernard B. Dadié' },
    'Birago_Diop_Les_contes_Amadou.pdf': { titre: 'Les Contes d\'Amadou Koumba', auteur: 'Birago Diop' },
    'Cheikh_Hamidou_Kane_-_L_Aventure_Ambigue.pdf': { titre: 'L\'Aventure Ambiguë', auteur: 'Cheikh Hamidou Kane' },
    'Chinua_Achebe_-_Tout_seffondre.pdf': { titre: 'Tout s\'effondre', auteur: 'Chinua Achebe' },
    'La_Belle_Histoire_de_Leuk-le-lievre_enghor.pdf': { titre: 'La Belle Histoire de Leuk-le-Lièvre', auteur: 'Léopold Sédar Senghor' },
    'L_39_Etrange_Destin_De_Wangrin_-_Amadou_Hampate_Ba.pdf': { titre: 'L\'Étrange Destin de Wangrin', auteur: 'Amadou Hampâté Bâ' },
    'Une_Si_Longue_Lettre_-_Mariama_Ba-1.pdf': { titre: 'Une Si Longue Lettre', auteur: 'Mariama Bâ' },
    'Une_vie_de_boy_-_Ferdinand_Oyono_23986.pdf': { titre: 'Une Vie de Boy', auteur: 'Ferdinand Oyono' },
    'Victor_Hugo_-_Les_Contemplations.pdf': { titre: 'Les Contemplations', auteur: 'Victor Hugo' },
    'Voltaique_-_Sembene_Ousmane.pdf': { titre: 'Voltaïque', auteur: 'Sembène Ousmane' },
    'Xala_-_Sembene_Ousmane.pdf': { titre: 'Xala', auteur: 'Sembène Ousmane' },
  },
  'terminale': {
    'Ahmadou_kourouma_les_soleils_des_independance-1.pdf': { titre: 'Les Soleils des Indépendances', auteur: 'Ahmadou Kourouma' },
    'Aminata_Sow_Fall_-_La_Greve_des_battu.pdf': { titre: 'La Grève des Bàttu', auteur: 'Aminata Sow Fall' },
    'BERNARD-B.-DADIER-Le-pagne-noir-contes-africains.pdf': { titre: 'Le Pagne noir — Contes africains', auteur: 'Bernard B. Dadié' },
    'Birago_Diop_Les_contes_Amadou.pdf': { titre: 'Les Contes d\'Amadou Koumba', auteur: 'Birago Diop' },
    'Cheikh_Hamidou_Kane_-_L_Aventure_Ambigue.pdf': { titre: 'L\'Aventure Ambiguë', auteur: 'Cheikh Hamidou Kane' },
    'L_39_Etrange_Destin_De_Wangrin_-_Amadou_Hampate_Ba.pdf': { titre: 'L\'Étrange Destin de Wangrin', auteur: 'Amadou Hampâté Bâ' },
    'L_g1_2021_rempl.pdf': { titre: 'Sujet BAC Français 2021', auteur: 'Ministère Éducation Sénégal' },
  }
}

async function generateSQL() {
  let sql = '-- =============================================\n'
  sql += '-- INSERTION ÉPREUVES\n'
  sql += '-- =============================================\n\n'
  sql += 'INSERT INTO epreuves (titre, matiere, classe, semestre, type, annee, pdf_url) VALUES\n'

  const epreuvesRows = []

  // Math 3ème
  const { data: files3eme } = await supabase.storage.from(BUCKET).list('epreuves/math-3eme')
  if (files3eme) {
    for (const f of files3eme) {
      const info = TITRES_EPREUVES[f.name] || { titre: f.name.replace(/_/g, ' ').replace('.pdf', ''), matiere: 'MATH', classe: '3eme', semestre: null, type: 'exercice' }
      const url = `${BASE_URL}/epreuves/math-3eme/${f.name}`
      epreuvesRows.push(`('${info.titre.replace(/'/g, "''")}', '${info.matiere}', '${info.classe}', ${info.semestre ? `'${info.semestre}'` : 'NULL'}, '${info.type}', 2024, '${url}')`)
    }
  }

  // Math Terminal S1S2
  const { data: filesS1S2 } = await supabase.storage.from(BUCKET).list('epreuves/math-terminale-s1s2')
  if (filesS1S2) {
    for (const f of filesS1S2) {
      const info = TITRES_EPREUVES[f.name] || { titre: f.name.replace(/_/g, ' ').replace('.pdf', ''), matiere: 'MATH', classe: 'terminale', semestre: 'S1', type: 'exercice' }
      const url = `${BASE_URL}/epreuves/math-terminale-s1s2/${f.name}`
      epreuvesRows.push(`('${info.titre.replace(/'/g, "''")}', '${info.matiere}', '${info.classe}', ${info.semestre ? `'${info.semestre}'` : 'NULL'}, '${info.type}', 2024, '${url}')`)
    }
  }

  // Math Terminal L
  const { data: filesL } = await supabase.storage.from(BUCKET).list('epreuves/math-terminale-l')
  if (filesL) {
    for (const f of filesL) {
      const info = TITRES_EPREUVES[f.name] || { titre: f.name.replace(/_/g, ' ').replace('.pdf', ''), matiere: 'MATH', classe: 'terminale', semestre: 'S1', type: 'exercice' }
      const url = `${BASE_URL}/epreuves/math-terminale-l/${f.name}`
      epreuvesRows.push(`('${info.titre.replace(/'/g, "''")}', '${info.matiere}', '${info.classe}', ${info.semestre ? `'${info.semestre}'` : 'NULL'}, '${info.type}', 2024, '${url}')`)
    }
  }

  sql += epreuvesRows.join(',\n') + ';\n\n'

  sql += '-- =============================================\n'
  sql += '-- INSERTION BIBLIOTHÈQUE\n'
  sql += '-- =============================================\n\n'
  sql += 'INSERT INTO bibliotheque (titre, auteur, classe, matiere, description, pdf_url) VALUES\n'

  const bibliothequeRows = []

  for (const classe of ['3eme', 'terminale']) {
    const { data: filesB } = await supabase.storage.from(BUCKET).list(`bibliotheque/${classe}`)
    if (filesB) {
      for (const f of filesB) {
        const info = TITRES_BIBLIOTHEQUE[classe]?.[f.name] || { titre: f.name.replace(/_/g, ' ').replace('.pdf', ''), auteur: 'Auteur inconnu' }
        const url = `${BASE_URL}/bibliotheque/${classe}/${f.name}`
        bibliothequeRows.push(`('${info.titre.replace(/'/g, "''")}', '${info.auteur.replace(/'/g, "''")}', '${classe}', 'FR', 'Œuvre au programme sénégalais', '${url}')`)
      }
    }
  }

  sql += bibliothequeRows.join(',\n') + ';\n'

  // Sauvegarder le SQL dans un fichier
  require('fs').writeFileSync('insert-data.sql', sql)
  console.log('✅ Fichier insert-data.sql généré !')
  console.log(`📊 ${epreuvesRows.length} épreuves + ${bibliothequeRows.length} livres`)
}

generateSQL()