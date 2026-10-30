import os
import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import torch.nn.functional as F

LABELS = ['false','uncertain','true']

MODEL_DIR = os.environ.get('MODEL_DIR', './artifacts/text-model')
DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'

app = FastAPI(title='Satya Lens Text Model')

class PredictIn(BaseModel):
    text: str

class PredictOut(BaseModel):
    label: str
    confidence: float

print(f"Loading model from {MODEL_DIR} on {DEVICE}...")
_tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
_model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR).to(DEVICE).eval()

@app.post('/predict', response_model=PredictOut)
def predict(inp: PredictIn):
    with torch.no_grad():
        toks = _tokenizer(inp.text, truncation=True, padding='max_length', max_length=256, return_tensors='pt')
        toks = {k: v.to(DEVICE) for k,v in toks.items()}
        logits = _model(**toks).logits[0]
        probs = F.softmax(logits, dim=-1).cpu().numpy()
        idx = int(probs.argmax())
        label = LABELS[idx]
        # map to unified labels
        mapped = 'true' if label == 'true' else 'false' if label == 'false' else 'uncertain'
        conf = float(probs[idx])
        return PredictOut(label=mapped, confidence=conf)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', '9000'))
    uvicorn.run(app, host='0.0.0.0', port=port)
