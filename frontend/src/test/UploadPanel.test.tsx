import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UploadPanel from '../components/UploadPanel';
import enTranslations from '../i18n/en.json';

describe('UploadPanel Component', () => {
  const defaultProps = {
    onCheck: vi.fn(),
    loading: false,
    loadingMessage: 'Analyzing...',
    onCancel: vi.fn(),
    onError: vi.fn(),
    t: enTranslations
  };

  it('switches tabs and clears selected file when moving between tabs', () => {
    const mockFile = new File(['dummy photo'], 'photo.png', { type: 'image/png' });
    render(
      <UploadPanel
        {...defaultProps}
        initialValues={{ type: 'image', file: mockFile }}
      />
    );

    // Initial state: photo file is displayed
    expect(screen.getByText('photo.png')).toBeInTheDocument();

    // Click on Video tab
    const videoTab = screen.getByRole('tab', { name: /video/i });
    fireEvent.click(videoTab);

    // File card should no longer be rendered, dropzone for video appears
    expect(screen.queryByText('photo.png')).not.toBeInTheDocument();
    expect(screen.getByText(/drop your video here/i)).toBeInTheDocument();
  });

  it('rejects files larger than 4 MB with a friendly error message', () => {
    const onError = vi.fn();
    render(
      <UploadPanel
        {...defaultProps}
        initialValues={{ type: 'image' }}
        onError={onError}
      />
    );

    // Create 5 MB mock file
    const largeFile = new File([new Uint8Array(5 * 1024 * 1024)], 'huge.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(onError).toHaveBeenCalledWith('File is too large. Please select a file under 4 MB.');
  });

  it('rejects wrong MIME type files on the client side', () => {
    const onError = vi.fn();
    render(
      <UploadPanel
        {...defaultProps}
        initialValues={{ type: 'image' }}
        onError={onError}
      />
    );

    // Provide text/plain instead of image/*
    const textFile = new File(['hello world'], 'doc.txt', { type: 'text/plain' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [textFile] } });

    expect(onError).toHaveBeenCalledWith('Please select an image file (JPEG, PNG, WebP).');
  });

  it('submits valid text input when Check button is clicked', () => {
    const onCheck = vi.fn();
    render(
      <UploadPanel
        {...defaultProps}
        initialValues={{ type: 'text', text: 'Vaccines cause magnetism' }}
        onCheck={onCheck}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /^Check now$/i });
    fireEvent.click(submitBtn);

    expect(onCheck).toHaveBeenCalledWith({
      type: 'text',
      text: 'Vaccines cause magnetism'
    });
  });
});
