import os
import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import torch.nn.functional as F

LABELS = ['false', 'uncertain', 'true']

MODEL_DIR = os.environ.get('MODEL_DIR', './artifacts/text-model')
FALLBACK_MODEL = os.environ.get('FALLBACK_MODEL', 'distilbert-base-uncased-finetuned-sst-2-english')
DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'

# Select local fine-tuned model directory if present, else fallback open-source HF model
model_path = MODEL_DIR if os.path.exists(MODEL_DIR) else FALLBACK_MODEL

app = FastAPI(title='Satya Lens Text Model')

class PredictIn(BaseModel):
    text: str

class PredictOut(BaseModel):
    label: str
    confidence: float

print(f"Loading open-source model from '{model_path}' on {DEVICE}...")
try:
    _tokenizer = AutoTokenizer.from_pretrained(model_path)
    _model = AutoModelForSequenceClassification.from_pretrained(model_path).to(DEVICE).eval()
    print("Open-source text model loaded successfully.")
except Exception as e:
    print(f"Warning: Could not load model from '{model_path}': {e}")
    _tokenizer = None
    _model = None

@app.get('/health')
def health():
    return {
        "status": "operational",
        "model": model_path,
        "loaded": _model is not None,
        "device": DEVICE
    }

@app.post('/predict', response_model=PredictOut)
def predict(inp: PredictIn):
    if _model is None or _tokenizer is None:
        return PredictOut(label='uncertain', confidence=0.5)

    with torch.no_grad():
        toks = _tokenizer(inp.text, truncation=True, padding='max_length', max_length=256, return_tensors='pt')
        toks = {k: v.to(DEVICE) for k, v in toks.items()}
        logits = _model(**toks).logits[0]
        probs = F.softmax(logits, dim=-1).cpu().numpy()
        idx = int(probs.argmax())

        # If 3 classes, direct mapping; if 2 classes (e.g. SST-2 pos/neg), map neg->false, pos->true
        num_labels = len(probs)
        if num_labels == 3:
            raw_label = LABELS[idx]
        elif num_labels == 2:
            # Index 0 is negative (often correlated with sensational/disputed text), 1 is positive
            raw_label = 'false' if idx == 0 else 'true'
        else:
            raw_label = 'uncertain'

        mapped = 'true' if raw_label == 'true' else 'false' if raw_label == 'false' else 'uncertain'
        conf = float(probs[idx])
        return PredictOut(label=mapped, confidence=conf)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', '9000'))
    uvicorn.run(app, host='0.0.0.0', port=port)
