import '@testing-library/jest-dom';

// JSDOM does not implement URL.createObjectURL or revokeObjectURL
if (typeof window !== 'undefined') {
  window.URL.createObjectURL = (_blob: Blob | MediaSource) => 'blob:mock-url';
  window.URL.revokeObjectURL = () => {};
}
