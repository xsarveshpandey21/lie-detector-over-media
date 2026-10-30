import os
import argparse
from datasets import load_dataset, DatasetDict
from transformers import AutoTokenizer, AutoModelForSequenceClassification, TrainingArguments, Trainer
import numpy as np
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score

# Simple text claim verification trainer using the LIAR dataset (label mapping simplified)
# Classes: 0=False, 1=Uncertain, 2=True
LABELS = {"false":0, "barely-true":0, "pants-fire":0, "half-true":1, "mostly-true":2, "true":2}


def map_label(example):
    label_str = example.get('label', '')
    if isinstance(label_str, bytes):
        label_str = label_str.decode('utf-8')
    label = LABELS.get(label_str, 1)
    example['labels'] = label
    example['text'] = example.get('statement', '')
    return example


def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    acc = accuracy_score(labels, preds)
    f1_macro = f1_score(labels, preds, average='macro')
    prec = precision_score(labels, preds, average='macro', zero_division=0)
    rec = recall_score(labels, preds, average='macro', zero_division=0)
    return {"accuracy": acc, "f1_macro": f1_macro, "precision": prec, "recall": rec}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model_name', default='distilbert-base-uncased')
    parser.add_argument('--epochs', type=int, default=3)
    parser.add_argument('--batch_size', type=int, default=16)
    parser.add_argument('--lr', type=float, default=5e-5)
    parser.add_argument('--out_dir', default='./artifacts/text-model')
    args = parser.parse_args()

    ds = load_dataset('liar')  # train/validation/test splits
    ds = ds.map(map_label)
    ds = ds.remove_columns([c for c in ds['train'].column_names if c not in ['text','labels']])

    tokenizer = AutoTokenizer.from_pretrained(args.model_name)

    def tok(batch):
        return tokenizer(batch['text'], truncation=True, padding='max_length', max_length=256)

    tokenized = DatasetDict({split: d.map(tok, batched=True) for split, d in ds.items()})
    tokenized = tokenized.rename_column('labels', 'label')
    tokenized.set_format('torch', columns=['input_ids','attention_mask','label'])

    num_labels = 3
    model = AutoModelForSequenceClassification.from_pretrained(args.model_name, num_labels=num_labels)

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

    # Evaluate on test
    test_metrics = trainer.evaluate(eval_dataset=tokenized['test'])
    os.makedirs(args.out_dir, exist_ok=True)
    trainer.save_model(args.out_dir)
    tokenizer.save_pretrained(args.out_dir)

    # Write metrics
    with open(os.path.join(args.out_dir, 'metrics.json'), 'w', encoding='utf-8') as f:
        import json
        json.dump(test_metrics, f, indent=2)

    print('Saved model to', args.out_dir)
    print('Test metrics:', test_metrics)

if __name__ == '__main__':
    main()
