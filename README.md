# CyberShield 🛡️

> Real-time AI-powered network threat detection — ensemble ML backend + cross-platform mobile app.

![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=flat-square&logo=fastapi&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-Expo-61DAFB?style=flat-square&logo=react&logoColor=black)
![HuggingFace](https://img.shields.io/badge/HuggingFace-Model-FFD21E?style=flat-square&logo=huggingface&logoColor=black)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.3-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## What is CyberShield?

CyberShield is a full-stack cybersecurity application that uses an ensemble of three machine learning models to detect network intrusions and anomalies in real time. A FastAPI backend processes 20 engineered network traffic features and returns a threat score to a mobile app built with Expo (React Native), enabling on-the-go network monitoring from any iOS or Android device.

Built as a personal project to explore the intersection of applied ML and cybersecurity — going beyond notebooks into a production-style deployment.

---

## Architecture

```
┌─────────────────────────────────┐
│      Mobile App (Expo)          │
│   iOS · Android · React Native  │
└──────────────┬──────────────────┘
               │ HTTP POST /predict
               ▼
┌─────────────────────────────────┐
│      FastAPI Backend            │
│      Uvicorn · Python 3.11      │
└──────────────┬──────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐
│  Isolation   │ │ Extra Trees  │ │  Deep Autoencoder    │
│  Forest      │ │ Regressor    │ │  (HuggingFace Hub)   │
│              │ │              │ │                      │
│ Unsupervised │ │ Supervised   │ │ Reconstruction error │
│ anomaly      │ │ threat       │ │ anomaly detection    │
│ detection    │ │ scoring      │ │                      │
└──────────────┘ └──────────────┘ └──────────────────────┘
       │                │                    │
       └────────────────┴────────────────────┘
                        │
               Ensemble vote
                        │
              Threat score + label
```

---

## Stack

| Layer | Technology |
|---|---|
| Mobile frontend | React Native, Expo |
| API server | FastAPI, Uvicorn |
| ML models | scikit-learn (Isolation Forest, Extra Trees), HuggingFace (Autoencoder) |
| Preprocessing | StandardScaler — 20 network traffic features |
| Model hosting | HuggingFace Hub |
| Language | Python 3.11, JavaScript |

---

## ML Ensemble — How it works

CyberShield combines three complementary detection strategies:

| Model | Type | Strength |
|---|---|---|
| **Isolation Forest** | Unsupervised | Detects unknown/zero-day threats — no labels needed |
| **Extra Trees Regressor** | Supervised | High-accuracy scoring on known attack patterns |
| **Deep Autoencoder** | Deep learning | High reconstruction error = anomalous traffic |

Each model independently analyzes the 20-feature traffic vector. Their outputs are combined into a single ensemble threat score. This hybrid approach improves coverage over any single model alone — especially for novel, unlabeled attack types.

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone (for testing on device)

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/cybershield.git
cd cybershield
```

### 2. Start the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will be live at `http://localhost:8000`
Interactive API docs at `http://localhost:8000/docs`

### 3. Start the mobile app

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone. Make sure your phone and PC are on the same WiFi network.

### 4. Connect mobile to backend

Find your PC's local IP address:

```powershell
# Windows
ipconfig
# Look for IPv4 Address under your WiFi adapter
```

Update the API base URL in the mobile app:

```javascript
const API_BASE_URL = "http://192.168.x.x:8000"; // your PC's local IP
```

> **Note:** `localhost` does not resolve from a physical device. Always use the local network IP.

---

## API Reference

### `GET /`
Health check — confirms the server and models are loaded.

### `POST /predict`
Submit network traffic features and receive a threat score.

**Request body:**
```json
{
  "features": [0.0, 1.2, 0.5, ...]  // 20 normalized traffic features
}
```

**Response:**
```json
{
  "threat_score": 0.87,
  "label": "malicious",
  "confidence": 0.91
}
```

Full interactive documentation available at `http://localhost:8000/docs` when the server is running.

---

## Project Structure

```
cybershield/
├── backend/
│   ├── main.py              # FastAPI app + routes
│   ├── inference.py         # Ensemble inference engine
│   ├── hf_adapter.py        # HuggingFace model loader
│   └── requirements.txt
├── mobile/
│   ├── App.js               # Root component
│   ├── src/                 # Screens, components, API client
│   ├── app.json
│   └── package.json
└── README.md
```

---

## Roadmap

- [ ] Connect mobile app to live backend
- [ ] Add authentication to the API
- [ ] Real-time packet capture integration
- [ ] Push notifications for high-severity threats
- [ ] Model retraining pipeline
- [ ] Deploy backend to cloud (Railway / Render)

---

## Author

**Kwafo Nathaniel Senior** — CS student at Accra Institute of Technology, building at the intersection of full-stack development, ML, and cybersecurity.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/nathaniel-senior-kwafo-922214257)
[![HuggingFace](https://img.shields.io/badge/HuggingFace-fawwerty-FFD21E?style=flat-square&logo=huggingface&logoColor=black)](https://huggingface.co/fawwerty)
[![Kaggle](https://img.shields.io/badge/Kaggle-friexesawwerty-20BEFF?style=flat-square&logo=kaggle&logoColor=white)](https://kaggle.com/friexesawwerty)
[![GitHub](https://img.shields.io/badge/GitHub-fawwerty-181717?style=flat-square&logo=github)](https://github.com/fawwerty)


## Data & Models

- **Dataset**: [CICIDS2017](https://www.unb.ca/cic/datasets/ids-2017.html) — download and place in `data/cicids2017/`
- **Trained model**: Available on [HuggingFace Hub](https://huggingface.co/fawwerty)

## Model Performance

Trained and evaluated on **292,837 samples** from the CICIDS2017 dataset (58,568 test samples).

| Class | Precision | Recall | F1 Score |
|---|---|---|---|
| Normal | 0.99 | 0.99 | 0.99 |
| Suspicious | 0.99 | 1.00 | 0.99 |
| Malicious | 1.00 | 0.99 | 0.99 |
| **Overall** | **0.99** | **0.99** | **0.99** |

**Overall Accuracy: 99%** across 58,568 test samples.

| Component | Detail |
|---|---|
| Training set | 234,269 samples |
| Test set | 58,568 samples |
| LSTM Autoencoder threshold | 0.6876 (95th percentile) |
| Classes | Normal · Suspicious · Malicious |
---

## License

MIT — free to use, modify, and distribute with attribution.
