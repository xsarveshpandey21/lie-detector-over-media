import os
import argparse
import collections
from datasets import load_dataset, DatasetDict
from transformers import AutoTokenizer, AutoModelForSequenceClassification, TrainingArguments, Trainer
import numpy as np
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score

# LIAR dataset integer label mapping:
# 0: false -> 0 (False)
# 1: half-true -> 1 (Uncertain)
# 2: mostly-true -> 2 (True)
# 3: true -> 2 (True)
# 4: barely-true -> 0 (False)
# 5: pants-fire -> 0 (False)
# Unified Classes: 0=False (Likely False), 1=Uncertain, 2=True (Likely True)
INT_LABEL_MAP = {
    0: 0,  # false
    1: 1,  # half-true
    2: 2,  # mostly-true
    3: 2,  # true
    4: 0,  # barely-true
    5: 0   # pants-fire
}

STRING_LABEL_MAP = {
    "false": 0,
    "pants-fire": 0,
    "barely-true": 0,
    "half-true": 1,
    "mostly-true": 2,
    "true": 2
}

def map_label(example):
    raw_label = example.get('label')
    if isinstance(raw_label, int):
        mapped = INT_LABEL_MAP.get(raw_label, 1)
    elif isinstance(raw_label, (str, bytes)):
        if isinstance(raw_label, bytes):
            raw_label = raw_label.decode('utf-8')
        mapped = STRING_LABEL_MAP.get(raw_label.lower().strip(), 1)
    else:
        mapped = 1

    example['labels'] = mapped
    example['text'] = example.get('statement', '')
    return example

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    acc = accuracy_score(labels, preds)
    f1_macro = f1_score(labels, preds, average='macro', zero_division=0)
    prec = precision_score(labels, preds, average='macro', zero_division=0)
    rec = recall_score(labels, preds, average='macro', zero_division=0)
    return {"accuracy": acc, "f1_macro": f1_macro, "precision": prec, "recall": rec}

def main():
    parser = argparse.ArgumentParser(description="Train Satya Lens 3-class text model on LIAR dataset")
    parser.add_argument('--model_name', default='distilbert-base-uncased')
    parser.add_argument('--epochs', type=int, default=3)
    parser.add_argument('--batch_size', type=int, default=16)
    parser.add_argument('--lr', type=float, default=5e-5)
    parser.add_argument('--out_dir', default='./artifacts/text-model')
    args = parser.parse_args()

    print("Loading LIAR dataset from Hugging Face...")
    ds = load_dataset('liar')
    ds = ds.map(map_label)
    ds = ds.remove_columns([c for c in ds['train'].column_names if c not in ['text', 'labels']])

    # Print class distribution and check balance
    train_labels = ds['train']['labels']
    total_samples = len(train_labels)
    counts = collections.Counter(train_labels)
    print("\n--- Training Class Distribution ---")
    class_names = {0: 'False (likely_false)', 1: 'Uncertain', 2: 'True (likely_true)'}
    for c_id in [0, 1, 2]:
        cnt = counts.get(c_id, 0)
        pct = (cnt / total_samples) * 100 if total_samples > 0 else 0
        print(f"Class {c_id} ({class_names[c_id]}): {cnt} samples ({pct:.1f}%)")
        if pct > 70.0:
            print(f"WARNING: Class {c_id} is heavily dominant (> 70%). Consider class weighting or re-sampling.")
    print("-----------------------------------\n")

    tokenizer = AutoTokenizer.from_pretrained(args.model_name)

    def tok(batch):
        return tokenizer(batch['text'], truncation=True, padding='max_length', max_length=256)

    tokenized = DatasetDict({split: d.map(tok, batched=True) for split, d in ds.items()})
    tokenized = tokenized.rename_column('labels', 'label')
    tokenized.set_format('torch', columns=['input_ids', 'attention_mask', 'label'])

    num_labels = 3
    model = AutoModelForSequenceClassification.from_pretrained(args.model_name, num_labels=num_labels)

    # Use eval_strategy if supported, else evaluation_strategy
    try:
        training_args = TrainingArguments(
            output_dir='./artifacts/text-model-checkpoints',
            eval_strategy='epoch',
            save_strategy='epoch',
            learning_rate=args.lr,
            per_device_train_batch_size=args.batch_size,
            per_device_eval_batch_size=args.batch_size,
            num_train_epochs=args.epochs,
            weight_decay=0.01,
            load_best_model_at_end=True,
            metric_for_best_model='accuracy'
        )
    except TypeError:
        training_args = TrainingArguments(
            output_dir='./artifacts/text-model-checkpoints',
            evaluation_strategy='epoch',
            save_strategy='epoch',
            learning_rate=args.lr,
            per_device_train_batch_size=args.batch_size,
            per_device_eval_batch_size=args.batch_size,
            num_train_epochs=args.epochs,
            weight_decay=0.01,
            load_best_model_at_end=True,
            metric_for_best_model='accuracy'
        )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized['train'],
        eval_dataset=tokenized['validation'],
        tokenizer=tokenizer,
        compute_metrics=compute_metrics
    )

    trainer.train()

    test_metrics = trainer.evaluate(eval_dataset=tokenized['test'])
    os.makedirs(args.out_dir, exist_ok=True)
    trainer.save_model(args.out_dir)
    tokenizer.save_pretrained(args.out_dir)

    with open(os.path.join(args.out_dir, 'metrics.json'), 'w', encoding='utf-8') as f:
        import json
        json.dump(test_metrics, f, indent=2)

    print('Saved model to', args.out_dir)
    print('Test metrics:', test_metrics)

if __name__ == '__main__':
    main()
