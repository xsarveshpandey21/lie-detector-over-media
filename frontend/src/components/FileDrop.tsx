import React, { useState, useRef, useEffect } from 'react';
import { ContentType } from '../types';

interface FileDropProps {
  type: ContentType;
  file: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
  t: {
    dropzones: {
      photo: string;
      video: string;
      audio: string;
      limit: string;
    };
    buttons: {
      remove: string;
    };
  };
  onError: (msg: string) => void;
}

const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB

export default function FileDrop({
  type,
  file,
  onFileSelect,
  disabled,
  t,
  onError
}: FileDropProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate preview for images
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  const acceptMap: Record<string, string> = {
    image: 'image/jpeg,image/png,image/webp,image/gif',
    video: 'video/mp4,video/webm,video/quicktime',
    audio: 'audio/mpeg,audio/wav,audio/ogg,audio/m4a,audio/mp3'
  };

  const labelMap: Record<string, string> = {
    image: t.dropzones.photo,
    video: t.dropzones.video,
    audio: t.dropzones.audio
  };

  function validateAndSet(selectedFile: File) {
    if (selectedFile.size > MAX_FILE_BYTES) {
      onError('File is too large. Please select a file under 4 MB.');
      return;
    }

    if (type === 'image' && !selectedFile.type.startsWith('image/')) {
      onError('Please select an image file (JPEG, PNG, WebP).');
      return;
    }
    if (type === 'video' && !selectedFile.type.startsWith('video/')) {
      onError('Please select a video file (MP4, WebM).');
      return;
    }
    if (type === 'audio' && !selectedFile.type.startsWith('audio/')) {
      onError('Please select an audio file (MP3, WAV).');
      return;
    }

    onFileSelect(selectedFile);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      validateAndSet(dropped);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      validateAndSet(selected);
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptMap[type] || '*/*'}
        disabled={disabled}
        onChange={handleChange}
        className="hidden"
      />

      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-brown-600 bg-sand dark:bg-brown-800'
              : 'border-line dark:border-brown-700 bg-paper dark:bg-brown-900 hover:bg-sand/40 dark:hover:bg-brown-800/40'
          }`}
        >
          <div className="text-3xl mb-2" aria-hidden="true">
            {type === 'image' ? '📸' : type === 'video' ? '🎬' : '🎙'}
          </div>
          <p className="font-semibold text-sm text-ink dark:text-cream">
            {labelMap[type] || 'Choose a file'}
          </p>
          <p className="text-xs text-muted dark:text-brown-300 mt-1">
            {t.dropzones.limit} (JPEG, PNG, WebP, MP4, MP3)
          </p>
        </div>
      ) : (
        /* Selected file card */
        <div className="card p-4 flex items-center justify-between gap-4 bg-sand/40 dark:bg-brown-900 border border-line dark:border-brown-700">
          <div className="flex items-center gap-3 overflow-hidden">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Selected preview"
                className="w-14 h-14 object-cover rounded-xl border border-line"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-sand dark:bg-brown-800 flex items-center justify-center text-2xl shrink-0">
                {type === 'video' ? '🎥' : '🎵'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink dark:text-cream truncate">
                {file.name}
              </p>
              <p className="text-xs text-muted dark:text-brown-300">
                {(file.size / 1024).toFixed(0)} KB • {file.type || 'file'}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={() => onFileSelect(null)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-line dark:border-brown-700 text-bad hover:bg-bad-bg/50 transition-colors shrink-0"
          >
            {t.buttons.remove}
          </button>
        </div>
      )}
    </div>
  );
}

