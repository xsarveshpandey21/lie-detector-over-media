import { useState, useRef, useCallback } from 'react';
import { analyze } from '../api/client';
import { Report } from '../types';

export type AnalyzeStatus = 'idle' | 'loading' | 'success' | 'error';

const ROTATING_MESSAGES = [
  'Reading your content…',
  'Looking for fact-checks…',
  'Examining writing patterns…',
  'Inspecting file properties…',
  'Preparing your result…'
];

export function useAnalyze() {
  const [status, setStatus] = useState<AnalyzeStatus>('idle');
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>(ROTATING_MESSAGES[0]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<number | null>(null);

  const startRotatingMessages = useCallback(() => {
    let index = 0;
    setLoadingMessage(ROTATING_MESSAGES[0]);
    intervalRef.current = window.setInterval(() => {
      index = (index + 1) % ROTATING_MESSAGES.length;
      setLoadingMessage(ROTATING_MESSAGES[index]);
    }, 2500);
  }, []);

  const stopRotatingMessages = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const runAnalysis = useCallback(async (payload: {
    type: string;
    text?: string;
    url?: string;
    file?: File | null;
    language?: string;
  }) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus('loading');
    setError(null);
    setErrorCode(null);
    startRotatingMessages();

    try {
      const report = await analyze(payload, controller.signal);
      setData(report);
      setStatus('success');
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        setStatus('idle');
        return;
      }

      const axiosErr = err as {
        response?: { status?: number; data?: { error?: string; message?: string } };
        message?: string;
      };

      const serverMsg = axiosErr?.response?.data?.message;
      const serverCode = axiosErr?.response?.data?.error;
      const statusNum = axiosErr?.response?.status;

      let fallback = 'Could not verify content. Please check your internet connection and try again.';
      if (statusNum === 413) {
        fallback = 'File is too large. Maximum upload size is 4 MB.';
      } else if (statusNum === 429) {
        fallback = 'Too many requests. Please wait a few minutes before checking again.';
      } else if (statusNum === 504) {
        fallback = 'The check took too long. Please try again with shorter text or a smaller file.';
      }

      setErrorCode(serverCode || String(statusNum || 'error'));
      setError(serverMsg || fallback);
      setStatus('error');
    } finally {
      stopRotatingMessages();
      abortControllerRef.current = null;
    }
  }, [startRotatingMessages, stopRotatingMessages]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    stopRotatingMessages();
    setStatus('idle');
  }, [stopRotatingMessages]);

  const reset = useCallback(() => {
    cancel();
    setData(null);
    setError(null);
    setErrorCode(null);
    setStatus('idle');
  }, [cancel]);

  return {
    status,
    data,
    error,
    errorCode,
    loadingMessage,
    runAnalysis,
    cancel,
    reset,
    setData
  };
}

