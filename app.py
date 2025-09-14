import os
import re
import json
import datetime
from datetime import timezone
from flask import Flask, render_template, request, jsonify, redirect, url_for 


app = Flask(__name__)

MAX_ROWS = 5
BASE_DIR = os.path.dirname(__file__)
LEADERBOARD_FILES = {
    "pop": os.path.join(BASE_DIR, "leaderboard_pop.json"),
    "fly": os.path.join(BASE_DIR, "leaderboard_fly.json"),
    "blood": os.path.join(BASE_DIR, "leaderboard_blood.json"),
    "mario": os.path.join(BASE_DIR, "leaderboard_mario.json"),
}

_NAME_RE = re.compile(r"^[A-Za-z][A-Za-z '\-]{1,19}$")
# --- EXPANDED PROFANITY LIST ---
_DEFAULT_PROFANITY = {
    "poop",
    "fart",
    "dick",
    "ass",
    "shit",
    "fuck",
    "bitch",
    "cunt",
    "nigger",
    "damn",
    "hell",
    "piss",
}


def _normalize_text(text: str) -> str:
    """Replaces leetspeak and other common character substitutions with normal characters."""
    substitutions = {
        "@": "a",
        "4": "a",
        "3": "e",
        "1": "i",
        "!": "i",
        "|": "i",
        "0": "o",
        "5": "s",
        "$": "s",
        "7": "t",
        "+": "t",
        "8": "b",
        "9": "g",
    }
    normalized_text = text.lower()
    for char, replacement in substitutions.items():
        normalized_text = normalized_text.replace(char, replacement)
    return normalized_text


def _compile_profanity_re():
    """
    Loads profanity from default and custom lists, then compiles a single,
    efficient regular expression for matching. If expanded_profanity.txt
    exists but cannot be read, the application will fail to start.
    """
    words = set(_DEFAULT_PROFANITY)
    extra_path = os.path.join(BASE_DIR, "profanity.txt")
    with open(extra_path, "r", encoding="utf-8") as f:
        for line in f:
            word = line.strip()
            if word:
                # Escape any special regex characters in the word itself
                words.add(re.escape(word))

    # Create a single regex pattern: \b(word1|word2|...)\b
    # The \b ensures we match whole words only (e.g., doesn't match 'ass' in 'class')
    pattern = r"\b(" + "|".join(words) + r")\b"

    # Compile the pattern for maximum performance, ignoring case
    print("Loaded profanity")
    return re.compile(pattern, re.IGNORECASE)


# Compile the profanity pattern at import time. This is the correct location.
_PROFANITY_RE = _compile_profanity_re()


def _censor_profanity(name: str) -> str:
    """
    Replaces any profane words in a string with asterisks of the same length.
    It checks a normalized version of the name to catch leetspeak.
    """
    if not _PROFANITY_RE:
        return name

    # --- IMPROVED LOGIC: Check the normalized name ---
    normalized_name = _normalize_text(name)

    # Find all matches in the normalized string
    matches = list(_PROFANITY_RE.finditer(normalized_name))
    if not matches:
        return name

    print(f"Censoring profane name. Original: '{name}'")

    # Convert original name to a list of characters to modify it
    censored_chars = list(name)

    # Replace the corresponding characters in the *original* name
    for match in matches:
        start, end = match.span()
        for i in range(start, end):
            censored_chars[i] = "*"

    censored_name = "".join(censored_chars)
    print(f"Censored result: '{censored_name}'")
    return censored_name


def _load_board(game_key: str):
    """Load the leaderboard for a given game key."""
    path = LEADERBOARD_FILES.get(game_key)
    if not path or not os.path.exists(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        print(f"Error loading leaderboard file {path}: {e}")
        return []


def _save_board(game_key: str, rows):
    """Write the leaderboard back to disk, creating it if necessary."""
    path = LEADERBOARD_FILES.get(game_key)
    if not path:
        return
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(rows, f, ensure_ascii=False, indent=2)
    except IOError as e:
        print(f"Error saving leaderboard file {path}: {e}")


def _sorted(rows):
    """Sort leaderboard entries descending by score, then by timestamp (newest first)."""
    rows.sort(key=lambda r: (int(r.get("score", 0)), r.get("ts", "")), reverse=True)
    return rows


def _insert_score(game_key: str, name: str, score: int, max_score: int) -> tuple:
    """
    Validate and insert a score into the leaderboard for the specified game.
    Any profanity in the name will be censored.
    """
    # First, validate the name's format.
    if not name or not _NAME_RE.match(name):
        return {"ok": False, "error": "Invalid name format"}, 400

    # Censor any profanity in the name
    censored_name = _censor_profanity(name)

    try:
        s = int(score)
    except (ValueError, TypeError):
        return {"ok": False, "error": "Invalid score"}, 400
    if not (0 <= s <= max_score):
        return {"ok": False, "error": "Invalid score"}, 400

    rows = _load_board(game_key)
    rows.append(
        {
            "name": censored_name.strip(),
            "score": s,
            "ts": datetime.datetime.now(timezone.utc)
            .isoformat(timespec="seconds")
            .replace("+00:00", "Z"),
        }
    )
    rows = _sorted(rows)[:MAX_ROWS]
    _save_board(game_key, rows)
    return {"ok": True}, 200


# ---- Page Routes ----


@app.route("/")
def home():
    """Render the landing page with quick links and preview of top scores."""
    pop_rows = _sorted(_load_board("pop"))[:3]
    fly_rows = _sorted(_load_board("fly"))[:3]
    return render_template("home.html", top_pop=pop_rows, top_fly=fly_rows)


@app.route("/fly_swatter_game")
def fly_swatter():
    return render_template("fly_swatter_game.html")


@app.route("/fly_swatter_tutorial")
def fly_swatter_tutorial():
    """Render the tutorial for Fly Swatter with a top-3 score preview."""
    fly_rows = _sorted(_load_board("fly"))[:3]
    return render_template("fly_swatter_tutorial.html", top_rows=fly_rows)


@app.route("/pop_the_lock_game")
def pop_the_lock():
    """Render the Pop the Lock WASM game."""
    return render_template("pop_the_lock_game.html")


@app.route("/pop_the_lock_tutorial")
def pop_the_lock_tutorial():
    """Render the Pop the Lock tutorial with a top-3 score preview."""
    pop_rows = _sorted(_load_board("pop"))[:3]
    return render_template("pop_the_lock_tutorial.html", top_rows=pop_rows)


@app.route("/pop_the_lock_leaderboard")
def pop_the_lock_leaderboard():
    rows = _sorted(_load_board("pop"))
    return render_template("pop_the_lock_leaderboard.html", rows=rows[:MAX_ROWS])


@app.route("/fly_swatter_leaderboard")
def fly_swatter_leaderboard():
    rows = _sorted(_load_board("fly"))
    return render_template("fly_swatter_leaderboard.html", rows=rows[:MAX_ROWS])


# ---- Blood Factory Routes ----
@app.route("/blood_factory_game")
def blood_factory_game():
    """Render the Blood Factory game page."""
    return render_template("blood_factory_game.html")


@app.route("/blood_factory_tutorial")
def blood_factory_tutorial():
    """Render the Blood Factory tutorial with a top‑3 score preview."""
    blood_rows = _sorted(_load_board("blood"))[:3]
    return render_template("blood_factory_tutorial.html", top_rows=blood_rows)


@app.route("/blood_factory_leaderboard")
def blood_factory_leaderboard():
    """Render the Blood Factory leaderboard."""
    rows = _sorted(_load_board("blood"))
    return render_template("blood_factory_leaderboard.html", rows=rows[:MAX_ROWS])


@app.route("/api/pop_leaderboard", methods=["GET", "POST"])
def api_pop_leaderboard():
    if request.method == "GET":
        rows = _sorted(_load_board("pop"))
        return jsonify(rows[:MAX_ROWS])

    # POST
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    score = data.get("score")
    payload, code = _insert_score("pop", name, score, max_score=15)
    return jsonify(payload), code


@app.route("/api/fly_leaderboard", methods=["GET", "POST"])
def api_fly_leaderboard():
    if request.method == "GET":
        rows = _sorted(_load_board("fly"))
        return jsonify(rows[:MAX_ROWS])

    # POST
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    score = data.get("score")
    payload, code = _insert_score("fly", name, score, max_score=999)
    return jsonify(payload), code


@app.route("/api/blood_leaderboard", methods=["GET", "POST"])
def api_blood_leaderboard():
    """API endpoint for fetching and submitting Blood Factory scores."""
    if request.method == "GET":
        rows = _sorted(_load_board("blood"))
        return jsonify(rows[:MAX_ROWS])
    # POST
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    score = data.get("score")
    # Allow a generous maximum score for kills; kills rarely exceed this
    payload, code = _insert_score("blood", name, score, max_score=999)
    return jsonify(payload), code

# ---- Mario Maker Routes ----
@app.route("/mario_game")
def mario_game_page():
    """The editor is now the main page, so redirect there."""
    return redirect(url_for("mario_editor_page")) # This now redirects


@app.route("/mario_editor")
def mario_editor_page():
    """Render the Mario Maker level editor page."""
    return render_template("mario_editor.html")


@app.route("/mario_tutorial")
def mario_tutorial_page():
    """Render the tutorial for Mario Maker with optional top scores preview."""
    rows = _sorted(_load_board("mario"))[:3]
    return render_template("mario_tutorial.html", top_rows=rows)


@app.route("/mario_leaderboard")
def mario_leaderboard_page():
    """Render the leaderboard for Mario Maker."""
    rows = _sorted(_load_board("mario"))
    return render_template("mario_leaderboard.html", rows=rows[:MAX_ROWS])


@app.route("/api/mario_leaderboard", methods=["GET", "POST"])
def api_mario_leaderboard():
    """API endpoint for fetching and submitting Mario Maker scores."""
    if request.method == "GET":
        rows = _sorted(_load_board("mario"))
        return jsonify(rows[:MAX_ROWS])
    # POST
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    score = data.get("score")
    payload, code = _insert_score("mario", name, score, max_score=999999)
    return jsonify(payload), code


# ---- Main Execution ----
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
