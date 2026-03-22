#!/bin/bash
# =============================================================
#  CyberShield — One-Click Setup Script
#  Optimised for a SINGLE combined CICIDS2017 CSV file.
#
#  What this does automatically:
#    1. Checks Python 3.9+
#    2. Installs all Python dependencies
#    3. Clones the HuggingFace model (if not already present)
#    4. Finds your CSV in  data/cicids2017/
#    5. Preprocesses it   →  data/processed.csv
#    6. Trains 3 models   →  model/saved_models/
#    7. Prints how to start the app
#
#  Prerequisites:
#    • Python 3.9+, pip
#    • Node.js 18+, npm
#    • git (+ git-lfs for the HF model)
#    • Your CICIDS2017 combined .csv inside  data/cicids2017/
#
#  Run once from project root:
#    bash setup.sh
# =============================================================

set -e

# ── Colours ────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
ok()   { echo -e "  ${GREEN}✅  $1${NC}"; }
warn() { echo -e "  ${YELLOW}⚠️   $1${NC}"; }
fail() { echo -e "\n${RED}❌  $1${NC}\n"; exit 1; }
div()  { echo -e "${CYAN}──────────────────────────────────────────────────${NC}"; }
step() { echo -e "\n${BOLD}${CYAN}[$1/6] $2${NC}"; }

# ── Banner ─────────────────────────────────────────────────
echo -e "${CYAN}"
echo "  ██████╗██╗   ██╗██████╗ ███████╗██████╗ "
echo "  ██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗"
echo "  ██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝"
echo "  ██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗"
echo "  ╚██████╗   ██║   ██████╔╝███████╗██║  ██║"
echo "   ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝"
echo -e "${NC}"
echo -e "  ${BOLD}CyberShield AI Threat Detector — Setup${NC}"
div

# ── Paths ──────────────────────────────────────────────────
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$ROOT/data/cicids2017"
PROCESSED="$ROOT/data/processed.csv"
HF_DIR="$ROOT/model/pretrained"
MODELS_DIR="$ROOT/model/saved_models"
HF_REPO="https://huggingface.co/debashis2007/cybersecuritytl-anomaly-detector"

# ══════════════════════════════════════════════════════════
# STEP 1 — Python version check
# ══════════════════════════════════════════════════════════
step 1 "Checking Python"
command -v python3 &>/dev/null || fail "python3 not found. Install Python 3.9+ first."
PY_VER=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
MAJOR=$(echo $PY_VER | cut -d. -f1)
MINOR=$(echo $PY_VER | cut -d. -f2)
([ "$MAJOR" -ge 3 ] && [ "$MINOR" -ge 9 ]) || fail "Python 3.9+ required. Found $PY_VER."
ok "Python $PY_VER"

# ══════════════════════════════════════════════════════════
# STEP 2 — Python dependencies
# ══════════════════════════════════════════════════════════
step 2 "Installing Python dependencies"
pip install -q -r "$ROOT/backend/requirements.txt"
ok "All packages installed"

# ══════════════════════════════════════════════════════════
# STEP 3 — HuggingFace pretrained model
# ══════════════════════════════════════════════════════════
step 3 "HuggingFace pretrained model"

HF_FILES=$(find "$HF_DIR" -type f ! -name "*.md" 2>/dev/null | wc -l)

if [ "$HF_FILES" -gt 0 ]; then
    ok "Model already in model/pretrained/ ($HF_FILES file(s)) — skipping clone"
elif [ -d "$HF_DIR/.git" ]; then
    echo "  Pulling latest..."
    cd "$HF_DIR" && git pull --quiet && cd "$ROOT"
    ok "Model updated"
else
    echo "  Cloning: $HF_REPO"
    warn "May take a few minutes for large model files..."

    # Try to ensure git-lfs is installed
    if ! command -v git-lfs &>/dev/null; then
        warn "git-lfs missing — attempting install..."
        command -v apt-get &>/dev/null && sudo apt-get install -y git-lfs -q 2>/dev/null || true
        command -v brew    &>/dev/null && brew install git-lfs -q 2>/dev/null || true
    fi

    if command -v git-lfs &>/dev/null; then
        git lfs install --quiet 2>/dev/null || true
        git clone "$HF_REPO" "$HF_DIR" \
            && ok "HuggingFace model cloned" \
            || warn "Clone failed — system will run as 3-model ensemble"
    else
        GIT_LFS_SKIP_SMUDGE=1 git clone "$HF_REPO" "$HF_DIR" 2>/dev/null \
            && ok "Model cloned (without LFS binaries)" \
            || warn "Clone failed — system will run as 3-model ensemble"
    fi
fi

# ══════════════════════════════════════════════════════════
# STEP 4 — Find the single combined CSV
# ══════════════════════════════════════════════════════════
step 4 "Finding your CICIDS2017 CSV"

# Search data/cicids2017/ for any .csv file
CSV_FILE=$(find "$DATA_DIR" -maxdepth 1 -name "*.csv" 2>/dev/null | head -1)

if [ -z "$CSV_FILE" ]; then
    echo -e "${RED}"
    echo "  ❌  No CSV file found in:  data/cicids2017/"
    echo ""
    echo "  Please copy your combined CICIDS2017 CSV into that folder:"
    echo ""
    echo "    data/"
    echo "    └── cicids2017/"
    echo "        └── cicids2017_combined.csv    ← paste here (any filename)"
    echo ""
    echo "  Download from Kaggle:"
    echo "    https://www.kaggle.com/datasets/cicdataset/cicids2017"
    echo ""
    echo "  Then re-run:  bash setup.sh"
    echo -e "${NC}"
    exit 1
fi

CSV_NAME=$(basename "$CSV_FILE")
CSV_SIZE=$(du -sh "$CSV_FILE" 2>/dev/null | cut -f1)
CSV_ROWS=$(wc -l < "$CSV_FILE")
ok "Found: $CSV_NAME  ($CSV_SIZE, ~${CSV_ROWS} rows)"

# ══════════════════════════════════════════════════════════
# STEP 5 — Preprocess
# ══════════════════════════════════════════════════════════
step 5 "Preprocessing dataset"

if [ -f "$PROCESSED" ]; then
    PROC_ROWS=$(wc -l < "$PROCESSED")
    warn "data/processed.csv already exists (~$PROC_ROWS rows) — skipping"
    warn "Delete it and re-run setup.sh to reprocess"
else
    echo "  Preprocessing: $CSV_NAME  →  data/processed.csv"
    echo "  (Extracting 20 features, mapping labels, balancing classes...)"
    echo ""
    python3 "$ROOT/model/preprocess.py" \
        --dataset cicids2017 \
        --input   "$CSV_FILE" \
        --output  "$PROCESSED"
    PROC_ROWS=$(wc -l < "$PROCESSED")
    ok "Saved data/processed.csv  (~$PROC_ROWS rows)"
fi

# ══════════════════════════════════════════════════════════
# STEP 6 — Train ensemble
# ══════════════════════════════════════════════════════════
step 6 "Training ensemble models"
echo ""
echo "  Training these models:"
echo "    1. Isolation Forest   — unsupervised anomaly detection"
echo "    2. Random Forest      — supervised 3-class classification"
echo "    3. LSTM Autoencoder   — deep reconstruction-based anomaly"
echo "    4. HuggingFace model  — loaded automatically at inference time"
echo ""
warn "Training takes 5–20 minutes. Keep this terminal open."
echo ""

python3 "$ROOT/model/train.py" \
    --data       "$PROCESSED" \
    --output_dir "$MODELS_DIR" \
    --lstm_epochs 20

# ══════════════════════════════════════════════════════════
# Done
# ══════════════════════════════════════════════════════════
echo ""
div
echo -e "\n${GREEN}${BOLD}  ✅  SETUP COMPLETE — CyberShield is ready to run!${NC}\n"
div
echo ""
echo -e "  ${BOLD}Open 3 separate terminals and run:${NC}"
echo ""
echo -e "  ${YELLOW}Terminal 1 — Backend (FastAPI):${NC}"
echo -e "    cd backend"
echo -e "    uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
echo ""
echo -e "  ${YELLOW}Terminal 2 — Web Dashboard (React):${NC}"
echo -e "    cd frontend"
echo -e "    npm install && npm start"
echo ""
echo -e "  ${YELLOW}Terminal 3 — Mobile App (Expo):${NC}"
echo -e "    cd mobile"
echo -e "    npm install && npx expo start"
echo ""
echo -e "  ${CYAN}API docs:   ${NC}http://localhost:8000/docs"
echo -e "  ${CYAN}Dashboard:  ${NC}http://localhost:3000"
echo ""
echo -e "  ${YELLOW}Testing on a physical phone?${NC}"
echo -e "  Edit  mobile/src/services/api.js  and replace"
echo -e "  'localhost' with your computer's local IP address."
echo ""
div
