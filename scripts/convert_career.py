#!/usr/bin/env python3
"""
Deterministic converter: docs/careers-external-jsons/<id>.json (external source format)
  -> src/data/careers/<id>.json (internal CareerData schema).

Design principle: every field that can be copied or parsed by a fixed, auditable rule
IS copied/parsed by code -- never "rewritten" by judgement. Only the narrative mishap/event
entries that have no fixed pattern are left as reviewable placeholders (effects: {"type": "none"})
with auto-extracted "expected tokens" so a human/LLM authoring pass can be checked against the
source text field-by-field, instead of trusted blindly.

Usage:
    python scripts/convert_career.py <career_id> [<career_id> ...]
    python scripts/convert_career.py --all-standard
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "docs" / "careers-external-jsons"
OUTPUT_DIR = ROOT / "src" / "data" / "careers"
SKILLS_TS = ROOT / "src" / "data" / "skills.ts"

# Careers explicitly deferred per user decision (need bespoke rules research first).
DEFERRED = {"prisoner", "psion"}

CHAR_NAMES = {"STR", "DEX", "END", "INT", "EDU", "SOC"}


# ---------------------------------------------------------------------------
# Skills registry (parsed from the TS source so there's one source of truth)
# ---------------------------------------------------------------------------
def load_skills_registry() -> dict[str, list[str]]:
    text = SKILLS_TS.read_text(encoding="utf-8")
    registry: dict[str, list[str]] = {}
    # Matches:  Name: [],   or   'Name': ['A', 'B'],   or   Name: ['A'],
    pattern = re.compile(r"^\s*(?:'([^']+)'|([A-Za-z][\w-]*)):\s*\[(.*?)\],?\s*$", re.MULTILINE)
    for m in pattern.finditer(text):
        name = m.group(1) or m.group(2)
        specialties_raw = m.group(3)
        specialties = re.findall(r"'([^']*)'", specialties_raw)
        registry[name] = specialties
    return registry


SKILLS_REGISTRY = load_skills_registry()
_SKILLS_LOWER = {name.lower(): name for name in SKILLS_REGISTRY}


def normalize_specialty(skill: str, specialty: str) -> str:
    """Match a free-text specialty against the registry's canonical casing."""
    specialty = specialty.strip()
    known = SKILLS_REGISTRY.get(skill, [])
    for candidate in known:
        if candidate.lower() == specialty.lower():
            return candidate
    # Not an exact match -- return as-titled and let validation flag it.
    return specialty


def normalize_skill(skill: str, context: str, warnings: list[str]) -> str:
    """Match a free-text skill name against the registry's canonical casing."""
    skill = skill.strip()
    canonical = _SKILLS_LOWER.get(skill.lower())
    if canonical is None:
        warnings.append(f"[{context}] Unknown skill referenced: '{skill}'")
        return skill
    return canonical


def split_top_level_or(text: str) -> list[str]:
    """Split on ' or ' but only at paren-depth 0, so 'Pilot (Small Craft or
    Spacecraft)' stays intact while 'Pilot (any) or Flyer (any)' splits in two."""
    parts: list[str] = []
    current: list[str] = []
    depth = 0
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        if ch == "(":
            depth += 1
            current.append(ch)
            i += 1
        elif ch == ")":
            depth -= 1
            current.append(ch)
            i += 1
        elif depth == 0 and text[i : i + 4] == " or ":
            parts.append("".join(current).strip())
            current = []
            i += 4
        else:
            current.append(ch)
            i += 1
    parts.append("".join(current).strip())
    return parts


# ---------------------------------------------------------------------------
# Skill table cell parsing:  "DEX +1" | "Skill" | "Skill (Specialty)" | "Skill (any)"
# | "A or B" | "A or B or C..." | "Skill (Specialty1 or Specialty2)" | combinations
# ---------------------------------------------------------------------------
CHAR_MOD_RE = re.compile(r"^(STR|DEX|END|INT|EDU|SOC)\s*([+-]\d+)$")
SKILL_SPECIALTY_RE = re.compile(r"^(.+?)\s*\(([^)]+)\)$")


def parse_skill_cell(text: str, context: str, warnings: list[str]) -> dict:
    text = text.strip()

    segments = split_top_level_or(text)
    if len(segments) > 1:
        return {
            "type": "choice",
            "options": [parse_skill_cell(seg, context, warnings) for seg in segments],
        }

    char_match = CHAR_MOD_RE.match(text)
    if char_match:
        return {
            "type": "characteristic",
            "characteristic": char_match.group(1),
            "value": int(char_match.group(2)),
        }

    specialty_match = SKILL_SPECIALTY_RE.match(text)
    if specialty_match:
        skill = normalize_skill(specialty_match.group(1), context, warnings)
        inner = specialty_match.group(2).strip()
        inner_segments = split_top_level_or(inner)
        if len(inner_segments) > 1:
            options = []
            for seg in inner_segments:
                if seg.lower() == "any":
                    options.append({"type": "skill", "skill": skill})
                else:
                    options.append(
                        {"type": "skill", "skill": skill, "specialty": normalize_specialty(skill, seg)}
                    )
            return {"type": "choice", "options": options}
        if inner.lower() == "any":
            # "(any)" means the player's free choice of specialty -- no specialty pinned.
            return {"type": "skill", "skill": skill}
        return {
            "type": "skill",
            "skill": skill,
            "specialty": normalize_specialty(skill, inner),
        }

    return {"type": "skill", "skill": normalize_skill(text, context, warnings)}


# ---------------------------------------------------------------------------
# Rank title / bonus parsing
# ---------------------------------------------------------------------------
BONUS_SKILL_LEVEL_RE = re.compile(r"^(.+?)\s+(\d+)$")


def parse_single_bonus_phrase(phrase: str, context: str, warnings: list[str]) -> dict:
    phrase = phrase.strip()

    char_match = CHAR_MOD_RE.match(phrase)
    if char_match:
        return {
            "type": "modCharacteristic",
            "characteristic": char_match.group(1),
            "value": int(char_match.group(2)),
        }

    level_match = BONUS_SKILL_LEVEL_RE.match(phrase)
    if level_match:
        skill_part, level = level_match.group(1).strip(), int(level_match.group(2))
        specialty_match = SKILL_SPECIALTY_RE.match(skill_part)
        if specialty_match:
            skill = normalize_skill(specialty_match.group(1), context, warnings)
            specialty = specialty_match.group(2).strip()
            if specialty.lower() == "any":
                return {"type": "gainSkill", "skill": skill, "level": level}
            return {
                "type": "gainSpecialty",
                "skill": skill,
                "specialty": normalize_specialty(skill, specialty),
                "level": level,
            }
        return {"type": "gainSkill", "skill": normalize_skill(skill_part, context, warnings), "level": level}

    warnings.append(f"[{context}] Could not parse bonus phrase: '{phrase}'")
    return {"type": "none"}


def parse_rank_bonus(bonus: str | None, context: str, warnings: list[str]) -> dict | None:
    if bonus is None:
        return None

    if "whichever is higher" in bonus:
        # Known one-off pattern, e.g. "SOC 10 or SOC +1, whichever is higher".
        m = re.match(r"^([A-Z]{3})\s+(\d+)\s+or\s+[A-Z]{3}\s*\+(\d+),\s*whichever is higher$", bonus)
        if m:
            return {
                "type": "ensureCharacteristic",
                "characteristic": m.group(1),
                "minimum": int(m.group(2)),
                "fallback": {
                    "type": "modCharacteristic",
                    "characteristic": m.group(1),
                    "value": int(m.group(3)),
                },
            }
        warnings.append(f"[{context}] Unrecognized 'whichever is higher' phrasing: '{bonus}'")
        return {"type": "none"}

    if " or " in bonus:
        parts = [p.strip() for p in bonus.split(" or ")]
        return {
            "type": "pickOne",
            "prompt": "Choose your bonus:",
            "options": [
                {"label": p, "effect": parse_single_bonus_phrase(p, context, warnings)}
                for p in parts
            ],
        }

    return parse_single_bonus_phrase(bonus, context, warnings)


def hyphenate(key: str) -> str:
    return key.replace("_", "-")


# ---------------------------------------------------------------------------
# Mustering-out benefit string parsing
# ---------------------------------------------------------------------------
CONTACT_WORDS = {"contact": "contact", "ally": "ally", "rival": "rival", "enemy": "enemy"}


def parse_benefit_phrase(phrase: str, context: str, warnings: list[str]) -> dict:
    phrase = phrase.strip()

    char_match = CHAR_MOD_RE.match(phrase)
    if char_match:
        return {
            "type": "modCharacteristic",
            "characteristic": char_match.group(1),
            "value": int(char_match.group(2)),
        }

    if phrase.lower() in CONTACT_WORDS:
        return {"type": "gainContact", "contactType": CONTACT_WORDS[phrase.lower()]}

    # Everything else (equipment, ship shares, memberships, etc.) is an opaque item tag.
    return {"type": "gainEquipment", "item": phrase}


def parse_benefit(benefit: str, context: str, warnings: list[str]) -> dict:
    if " and " in benefit:
        parts = [p.strip() for p in benefit.split(" and ")]
        return {
            "type": "compound",
            "effects": [parse_benefit_phrase(p, context, warnings) for p in parts],
        }
    if " or " in benefit:
        parts = [p.strip() for p in benefit.split(" or ")]
        return {
            "type": "pickOne",
            "prompt": "Choose your benefit:",
            "options": [
                {"label": p, "effect": parse_benefit_phrase(p, context, warnings)}
                for p in parts
            ],
        }
    return parse_benefit_phrase(benefit, context, warnings)


# ---------------------------------------------------------------------------
# Boilerplate mishap/event detection (identical text & mechanics across every
# surveyed career -- safe to auto-generate, not a judgement call).
# ---------------------------------------------------------------------------
def convert_mishap(roll: str, description: str, warnings: list[str], context: str) -> dict:
    if roll == "1" and "roll twice on the injury table and take the lower result" in description.lower():
        return {
            "description": description,
            "effects": {
                "type": "choice",
                "prompt": "You are severely injured. Choose how to resolve your injuries.",
                "options": [
                    {
                        "label": "Take the severity of a result of 2 (Severely injured)",
                        "effects": [{"type": "rollOnTable", "table": "injury", "fixedResult": 2}],
                    },
                    {
                        "label": "Roll twice on the Injury table and take the lower result",
                        "effects": [{"type": "rollOnTable", "table": "injury", "modifier": "takeLower"}],
                    },
                ],
            },
        }

    if roll == "6" and description.strip().lower() == "injured. roll on the injury table.":
        return {
            "description": description,
            "effects": {
                "type": "compound",
                "effects": [
                    {"type": "ejectFromCareer"},
                    {"type": "rollOnTable", "table": "injury"},
                ],
            },
        }

    return {
        "description": description,
        "effects": {"type": "none"},
    }


def convert_event(roll: str, description: str, warnings: list[str], context: str) -> dict:
    if roll == "2" and description.strip().lower().startswith("disaster!"):
        return {
            "description": description,
            "effects": {"type": "rollOnTable", "table": "mishap"},
        }

    if roll == "7" and "life event" in description.lower() and "life events table" in description.lower():
        return {
            "description": description,
            "effects": {"type": "rollOnTable", "table": "life-events"},
        }

    return {
        "description": description,
        "effects": {"type": "none"},
    }


TOKEN_PATTERNS = [
    ("contact_type", re.compile(r"\b(Enemy|Ally|Rival|Contact)(?:ies)?\b")),
    ("skill_target", re.compile(r"\b([A-Z][A-Za-z()\s/-]*?)\s+(\d+)\+")),
    ("dm", re.compile(r"DM[+-]\d+")),
    ("dice", re.compile(r"\b\d*D\d+\b")),
    ("char_mod", re.compile(r"\b(STR|DEX|END|INT|EDU|SOC)\b")),
    ("auto_promote", re.compile(r"automatically promoted")),
]


def extract_tokens(description: str) -> list[str]:
    tokens: list[str] = []
    for _, pattern in TOKEN_PATTERNS:
        for m in pattern.finditer(description):
            tokens.append(m.group(0))
    return tokens


# ---------------------------------------------------------------------------
# Top-level career conversion
# ---------------------------------------------------------------------------
def convert_qualification(src: dict, warnings: list[str]) -> dict | None:
    q = src.get("qualification")
    if q is None:
        return None
    if q.get("automatic"):
        return None  # e.g. Drifter -- no qualification roll at all.

    modifiers = []
    for m in q.get("modifiers", []):
        if m["type"] == "per_previous_career":
            modifiers.append({"type": "previousCareers", "dmPer": m["dm"]})
        elif m["type"] == "age":
            modifiers.append({"type": "age", "threshold": m["threshold"], "dm": m["dm"]})
        else:
            warnings.append(f"Unknown qualification modifier type: {m['type']}")

    result = {
        "characteristic": q["characteristic"],
        "target": q["target"],
    }
    if modifiers:
        result["modifiers"] = modifiers
    return result


def convert_assignments(src: dict, warnings: list[str]) -> list[dict]:
    out = []
    for key, a in src["assignments"].items():
        out.append(
            {
                "id": hyphenate(key),
                "name": a["name"],
                "description": a["description"],
                "survivalCheck": {
                    "characteristic": a["survival"]["characteristic"],
                    "target": a["survival"]["target"],
                },
                "advancementCheck": {
                    "characteristic": a["advancement"]["characteristic"],
                    "target": a["advancement"]["target"],
                },
            }
        )
    return out


TABLE_DISPLAY_NAME_STRIP_RE = re.compile(r"\s*\((commissioned only|any)\)\s*$", re.IGNORECASE)


def convert_skill_tables(src: dict, assignment_keys: set[str], warnings: list[str]) -> list[dict]:
    out = []
    for key, table in src["skill_tables"].items():
        entries = {}
        for roll in "123456":
            if roll not in table:
                warnings.append(f"skill_tables.{key} missing roll {roll}")
                continue
            entries[roll] = parse_skill_cell(table[roll], f"skill_tables.{key}[{roll}]", warnings)

        name = TABLE_DISPLAY_NAME_STRIP_RE.sub("", table["name"]).strip()
        restriction = None
        if table.get("requires_edu"):
            restriction = {"type": "minEdu", "value": table["requires_edu"]}
        elif table.get("requires_commission"):
            restriction = {"type": "officer"}
        elif table.get("assignment_only"):
            restriction = {"type": "assignment", "assignmentId": hyphenate(table["assignment_only"])}

        table_id = hyphenate(key)
        if key in assignment_keys:
            table_id = f"{table_id}-skills"

        entry = {"id": table_id, "name": name}
        if restriction:
            entry["restriction"] = restriction
        entry["entries"] = entries
        out.append(entry)
    return out


def convert_ranks(src: dict, assignment_keys: set[str], warnings: list[str]) -> dict:
    tracks_src = src["ranks"]
    keys = set(tracks_src.keys())

    if keys == {"default"}:
        rank_type = "default"
    elif keys == {"enlisted", "officer"}:
        rank_type = "split"
    elif keys == assignment_keys:
        rank_type = "assignment"
    else:
        warnings.append(f"Unrecognized rank track key set: {keys} (assignments: {assignment_keys})")
        rank_type = "default" if len(keys) == 1 else "split"

    tracks = {}
    for key, track in tracks_src.items():
        out_key = hyphenate(key) if rank_type == "assignment" else key
        parsed_track = {}
        for level, entry in track.items():
            title = entry.get("title") or ""
            parsed_entry = {"title": title}
            bonus = parse_rank_bonus(entry.get("bonus"), f"ranks.{key}[{level}]", warnings)
            if bonus is not None:
                parsed_entry["bonus"] = bonus
            parsed_track[level] = parsed_entry
        tracks[out_key] = parsed_track

    return {"type": rank_type, "tracks": tracks}


def convert_mustering_out(src: dict, warnings: list[str]) -> dict:
    cash = {}
    benefits = {}
    for roll, entry in src["mustering_out"].items():
        cash[roll] = entry["cash"]
        benefits[roll] = {
            "description": entry["benefit"],
            "effects": parse_benefit(entry["benefit"], f"mustering_out[{roll}]", warnings),
        }
    return {"cash": cash, "benefits": benefits}


def convert_career(career_id: str) -> tuple[dict, list[str], dict]:
    warnings: list[str] = []
    src = json.loads((SOURCE_DIR / f"{career_id}.json").read_text(encoding="utf-8"))

    assignment_keys = set(src["assignments"].keys())

    result = {
        "id": src["id"],
        "name": src["name"],
        "description": src["description"],
    }

    qualification = convert_qualification(src, warnings)
    result["qualification"] = qualification

    if "commission" in src:
        result["commission"] = src["commission"]

    result["assignments"] = convert_assignments(src, warnings)
    result["skillTables"] = convert_skill_tables(src, assignment_keys, warnings)
    result["ranks"] = convert_ranks(src, assignment_keys, warnings)

    service_table = src["skill_tables"].get("service_skills", {})
    if service_table.get("note"):
        result["basicTrainingUsesAssignmentSkills"] = True

    review: dict = {"mishaps": {}, "events": {}}

    mishaps = {}
    for roll, desc in src["mishaps"].items():
        mishaps[roll] = convert_mishap(roll, desc, warnings, f"mishaps[{roll}]")
        if mishaps[roll]["effects"]["type"] == "none":
            review["mishaps"][roll] = {"description": desc, "tokens": extract_tokens(desc)}
    result["mishaps"] = mishaps

    events = {}
    for roll, desc in src["events"].items():
        events[roll] = convert_event(roll, desc, warnings, f"events[{roll}]")
        if events[roll]["effects"]["type"] == "none":
            review["events"][roll] = {"description": desc, "tokens": extract_tokens(desc)}
    result["events"] = events

    result["musteringOut"] = convert_mustering_out(src, warnings)

    if career_id == "drifter":
        result["isSpecial"] = True

    return result, warnings, review


def main() -> None:
    args = sys.argv[1:]
    if not args or args == ["--all-standard"]:
        career_ids = sorted(
            p.stem for p in SOURCE_DIR.glob("*.json") if p.stem not in DEFERRED
        )
    else:
        career_ids = args

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    review_dir = ROOT / "scripts" / "review"
    review_dir.mkdir(parents=True, exist_ok=True)
    total_warnings = 0
    total_review_items = 0

    for career_id in career_ids:
        if career_id in DEFERRED:
            print(f"SKIP {career_id} (deferred: prisoner/psion need bespoke rules research)")
            continue

        result, warnings, review = convert_career(career_id)
        out_path = OUTPUT_DIR / f"{career_id}.json"
        out_path.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")

        review_path = review_dir / f"{career_id}.json"
        review_path.write_text(json.dumps(review, indent=2) + "\n", encoding="utf-8")

        review_count = len(review["mishaps"]) + len(review["events"])
        total_review_items += review_count
        total_warnings += len(warnings)

        print(f"{career_id}: wrote {out_path.relative_to(ROOT)} "
              f"({review_count} narrative entries need review, {len(warnings)} warnings)")
        for w in warnings:
            print(f"    WARNING: {w}")

    print(f"\nDone. {len(career_ids) - len(set(career_ids) & DEFERRED)} careers converted, "
          f"{total_review_items} narrative entries flagged for review, {total_warnings} warnings.")


if __name__ == "__main__":
    main()
