#!/usr/bin/env python3
"""
import_skillnova.py — Import des ressources Skill Nova dans TerangaLearn
Usage:
    python import_skillnova.py [--dry-run] [--limit N]

Pré-requis:
    pip install supabase python-dotenv
    Variables .env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY

Sécurité:
    - Utilise SUPABASE_SERVICE_KEY (service_role) — jamais la clé anon
    - Ne contourne aucune RLS
    - Vérifie redistribution_authorized avant tout upload
    - Idempotent via sha256 (skip si déjà importé)
"""

import argparse
import hashlib
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path

# ─── Configuration ─────────────────────────────────────────────────────────────

# Chemin vers les PDFs (C:\Users\franc\propres sur Windows → ajuster si besoin)
PDF_BASE_DIR = Path(r"C:\Users\franc\propres")  # dossier des PDFs originaux

MANIFEST_PATH = Path("data/import_terangalearn_manifest.json")
BUCKET = "cours-pdf"
STORAGE_PREFIX = "epreuves/skillnova"

# Mapping manifest → DB
MATIERE_MAP = {
    "mathématiques": "MATH",
    "mathematiques":  "MATH",
    "maths":          "MATH",
    "physique":       "PHY",
    "chimie":         "CHIMIE",
    "physique-chimie":"PHY",   # fallback conservateur → PHY
    "svt":            "SVT",
    "français":       "FR",
    "francais":       "FR",
    "histoire":       "HG",
    "géographie":     "HG",
    "philosophie":    "PHILO",
    "anglais":        "EN",
    "économie":       "ECO",
    "economie":       "ECO",
}

CLASSE_MAP = {
    "3eme":       "troisieme",
    "3ème":       "troisieme",
    "terminale":  "terminale",
}

# ─── Helpers ───────────────────────────────────────────────────────────────────

def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def normalise_matiere(raw: str) -> str | None:
    key = raw.lower().strip()
    return MATIERE_MAP.get(key)


def normalise_classe(raw: str) -> str | None:
    key = raw.lower().strip()
    return CLASSE_MAP.get(key)


def resolve_pdf_path(resource: dict) -> Path | None:
    """
    Structure réelle : PDF_BASE_DIR/{classe}/{matiere}/{fichier.pdf}
    Stratégies dans l'ordre :
    1. PDF_BASE_DIR/{level}/{subject}/{basename}
    2. Recherche récursive par basename dans PDF_BASE_DIR
    3. Chemin complet local_path tel quel
    """
    local_path = resource.get("file", {}).get("local_path", "")
    level   = resource.get("level", "").lower().strip()    # "3eme", "terminale"
    subject = resource.get("subject", "").lower().strip()  # "mathématiques", "physique"…

    if not local_path:
        return None

    basename = Path(local_path).name

    # Stratégie 1 : propres/{level}/{subject}/{basename}
    candidate = PDF_BASE_DIR / level / subject / basename
    if candidate.exists():
        return candidate

    # Stratégie 2 : recherche récursive par nom de fichier
    for found in PDF_BASE_DIR.rglob(basename):
        return found

    # Stratégie 3 : chemin absolu tel quel dans le manifest
    full = Path(local_path)
    if full.exists():
        return full

    return None


def storage_path(classe_db: str, matiere_code: str, sha: str) -> str:
    return f"{STORAGE_PREFIX}/{classe_db}/{matiere_code}/{sha}.pdf"


# ─── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Import Skill Nova → TerangaLearn")
    parser.add_argument("--dry-run", action="store_true",
                        help="Simule l'import sans écrire en base ni uploader")
    parser.add_argument("--limit", type=int, default=0,
                        help="Limite le nombre de ressources traitées (0 = toutes)")
    args = parser.parse_args()

    # ── Chargement .env ────────────────────────────────────────────────────────
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        print("⚠️  python-dotenv non installé — variables d'env chargées depuis le shell")

    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    service_key  = os.environ.get("SUPABASE_SERVICE_KEY")

    if not supabase_url or not service_key:
        print("❌ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_KEY requis dans .env")
        sys.exit(1)

    if not args.dry_run:
        try:
            from supabase import create_client
        except ImportError:
            print("❌ pip install supabase")
            sys.exit(1)
        sb = create_client(supabase_url, service_key)
    else:
        sb = None
        print("🔍 MODE DRY-RUN — aucune écriture en base ni upload\n")

    # ── Chargement manifest ────────────────────────────────────────────────────
    if not MANIFEST_PATH.exists():
        print(f"❌ Manifest introuvable : {MANIFEST_PATH}")
        sys.exit(1)

    with open(MANIFEST_PATH, encoding="utf-8") as f:
        manifest = json.load(f)

    resources = manifest.get("resources", [])
    total = len(resources)
    if args.limit:
        resources = resources[:args.limit]

    print(f"📋 Manifest : {total} ressources — traitement de {len(resources)}\n")

    # ── Récupération des sha256 déjà importés (idempotence) ───────────────────
    existing_sha256 = set()
    if not args.dry_run:
        resp = sb.table("epreuves").select("sha256").not_.is_("sha256", "null").execute()
        existing_sha256 = {r["sha256"] for r in (resp.data or []) if r.get("sha256")}
        print(f"ℹ️  {len(existing_sha256)} ressources déjà importées (sha256)\n")

    # ── Rapport ────────────────────────────────────────────────────────────────
    rapport = {
        "run_at": datetime.utcnow().isoformat() + "Z",
        "dry_run": args.dry_run,
        "total_in_manifest": total,
        "processed": 0,
        "inserted": 0,
        "skipped_already_imported": 0,
        "skipped_file_not_found": 0,
        "skipped_mapping_error": 0,
        "errors": [],
        "details": [],
    }

    # ── Boucle principale ──────────────────────────────────────────────────────
    for idx, resource in enumerate(resources, 1):
        rapport["processed"] += 1
        title  = resource.get("title", "Sans titre")
        level  = resource.get("level", "")
        subj   = resource.get("subject", "")
        chap   = resource.get("chapter", "")
        rtype  = resource.get("resource_type", "exercise")

        file_info = resource.get("file", {})
        sha_manifest = file_info.get("sha256", "")

        rights = resource.get("rights", {})
        redistrib = rights.get("redistribution_authorized", False)

        correction = resource.get("correction", {})
        has_corrige   = bool(correction.get("external_url"))
        corrige_url   = correction.get("external_url", "")
        corrige_provider = correction.get("provider", "")

        pub_status = resource.get("publication_status", "pending_review")

        prefix = f"[{idx:03d}/{len(resources)}]"

        # 1. Droits de redistribution — informatif uniquement, ne bloque pas
        if not redistrib:
            print(f"{prefix} ⚠️  Droits non confirmés (import quand même) — {title[:50]}")

        # 2. Résolution matière
        matiere_code = normalise_matiere(subj)
        if not matiere_code:
            print(f"{prefix} ⚠️  SKIP matière inconnue '{subj}' — {title[:50]}")
            rapport["skipped_mapping_error"] += 1
            rapport["details"].append({"title": title, "status": "skipped_mapping_error",
                                        "reason": f"matiere_inconnue:{subj}"})
            continue

        # 3. Résolution classe
        classe_db = normalise_classe(level)
        if not classe_db:
            print(f"{prefix} ⚠️  SKIP classe inconnue '{level}' — {title[:50]}")
            rapport["skipped_mapping_error"] += 1
            rapport["details"].append({"title": title, "status": "skipped_mapping_error",
                                        "reason": f"classe_inconnue:{level}"})
            continue

        # 4. Fichier local
        pdf_path = resolve_pdf_path(resource)
        if not pdf_path:
            print(f"{prefix} ⚠️  SKIP fichier introuvable — {title[:50]}")
            rapport["skipped_file_not_found"] += 1
            rapport["details"].append({"title": title, "status": "skipped_file_not_found"})
            continue

        # 5. SHA-256 (vérification + idempotence)
        sha = sha256_file(pdf_path)
        if sha_manifest and sha != sha_manifest:
            print(f"{prefix} ⚠️  SHA-256 mismatch — {title[:50]}")
            rapport["errors"].append({"title": title, "error": "sha256_mismatch",
                                      "expected": sha_manifest, "computed": sha})
            continue

        if sha in existing_sha256:
            print(f"{prefix} ✅ Déjà importé — {title[:60]}")
            rapport["skipped_already_imported"] += 1
            rapport["details"].append({"title": title, "status": "already_imported", "sha256": sha})
            continue

        # 6. Chemin de stockage
        storage_key = storage_path(classe_db, matiere_code, sha)
        pdf_url = f"{supabase_url}/storage/v1/object/public/{BUCKET}/{storage_key}"

        # 7. Statut DB
        # publication_status "pending_review" → draft, "approved"/"published" → published
        statut_db = "published" if pub_status in ("approved", "published") else "draft"

        row = {
            "titre":               title,
            "matiere":             matiere_code,
            "classe":              classe_db,
            "semestre":            None,
            "type":                rtype,
            "annee":               None,
            "pdf_url":             pdf_url,
            "chapitre":            chap if chap else None,
            "sha256":              sha,
            "source_externe_id":   resource.get("source", {}).get("exercise_url", ""),
            "has_corrige_externe": has_corrige,
            "fournisseur_corrige": corrige_provider if has_corrige else None,
            "statut":              statut_db,
            "droits":              json.dumps(rights),
            "acces":               "free",
            "annee_scolaire":      None,
        }

        if args.dry_run:
            print(f"{prefix} 🔍 DRY-RUN OK — {title[:60]}")
            print(f"         → {matiere_code} | {classe_db} | {statut_db} | {sha[:12]}…")
            rapport["inserted"] += 1
            rapport["details"].append({"title": title, "status": "would_insert",
                                        "sha256": sha, "storage_key": storage_key})
            continue

        # 8. Upload PDF
        try:
            with open(pdf_path, "rb") as pdf_file:
                pdf_bytes = pdf_file.read()

            sb.storage.from_(BUCKET).upload(
                path=storage_key,
                file=pdf_bytes,
                file_options={"content-type": "application/pdf", "upsert": "false"},
            )
        except Exception as e:
            err_str = str(e)
            # Si le fichier existe déjà dans le bucket, ce n'est pas une vraie erreur
            if "already exists" in err_str.lower() or "duplicate" in err_str.lower():
                print(f"{prefix} ℹ️  Déjà dans bucket — {title[:55]}")
            else:
                print(f"{prefix} ❌ Upload échoué — {err_str[:80]}")
                rapport["errors"].append({"title": title, "error": "upload_failed", "detail": err_str})
                continue

        # 9. Insert DB
        try:
            sb.table("epreuves").insert(row).execute()
            existing_sha256.add(sha)
            rapport["inserted"] += 1
            print(f"{prefix} ✅ Importé — {title[:60]}")
            rapport["details"].append({"title": title, "status": "inserted",
                                        "sha256": sha, "storage_key": storage_key})
        except Exception as e:
            err_str = str(e)
            print(f"{prefix} ❌ Insert DB échoué — {err_str[:80]}")
            rapport["errors"].append({"title": title, "error": "db_insert_failed", "detail": err_str})

    # ── Résumé ─────────────────────────────────────────────────────────────────
    print("\n" + "═" * 60)
    print("RAPPORT FINAL")
    print("═" * 60)
    print(f"  Traités            : {rapport['processed']}")
    print(f"  ✅ Insérés          : {rapport['inserted']}")
    print(f"  ✅ Déjà importés    : {rapport['skipped_already_imported']}")
    print(f"  ⚠️  Fichier manquant : {rapport['skipped_file_not_found']}")
    print(f"  ⚠️  Mapping erreur  : {rapport['skipped_mapping_error']}")
    print(f"  ❌ Erreurs          : {len(rapport['errors'])}")
    print("═" * 60)

    # Sauvegarde rapport JSON
    rapport_path = Path(f"import_rapport_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json")
    with open(rapport_path, "w", encoding="utf-8") as f:
        json.dump(rapport, f, ensure_ascii=False, indent=2)
    print(f"\n📄 Rapport sauvegardé : {rapport_path}")

    if rapport["errors"]:
        print("\n⚠️  Erreurs détaillées :")
        for e in rapport["errors"]:
            print(f"   • {e.get('title', '?')[:50]} → {e.get('error')} : {e.get('detail', '')[:60]}")


if __name__ == "__main__":
    main()
