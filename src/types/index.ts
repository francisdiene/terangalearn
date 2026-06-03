export type Classe = '3eme' | 'terminale'
export type Serie = 'S1' | 'S2' | 'L' | 'G' | 'STEG' | null

export interface Profile {
  id: string
  full_name: string
  email: string
  classe: Classe
  serie: Serie
  avatar_url: string | null
  xp: number
  niveau: number
  streak: number
  last_activity: string | null
  created_at: string
}

export interface Matiere {
  id: string
  nom: string
  code: string
  icone: string
  couleur: string
  classe: 'both' | Classe
}

export interface Chapitre {
  id: string
  matiere_id: string
  titre: string
  description: string
  ordre: number
}

export interface Cours {
  id: string
  chapitre_id: string
  titre: string
  contenu: string
  resume: string
  duree_minutes: number
  ordre: number
}

export interface Exercice {
  id: string
  chapitre_id: string
  question: string
  type: 'qcm' | 'vrai_faux' | 'redaction'
  options: string[] | null
  reponse_correcte: string
  explication: string
  difficulte: 'facile' | 'moyen' | 'difficile'
  points: number
}

export interface Badge {
  id: string
  nom: string
  description: string
  icone: string
  condition_type: string
  condition_valeur: number
}

export interface UserBadge {
  badge_id: string
  obtenu_le: string
  badges: Badge
}

export interface ProgressionCours {
  cours_id: string
  termine: boolean
  progression_pct: number
}

export interface MessageCoach {
  id: string
  role: 'user' | 'assistant'
  contenu: string
  created_at: string
}

export interface ResultatExercice {
  exercice_id: string
  reponse_donnee: string
  est_correct: boolean
  points_gagnes: number
}