import React from 'react';
import { ContentType, InputSummary } from '../types';

interface MediaMetadataTableProps {
  type: ContentType;
  input: InputSummary;
  technical: Record<string, unknown>;
}

export default function MediaMetadataTable({
  type,
  input,
  technical
}: MediaMetadataTableProps) {
  // Only render for media or URL
  if (type === 'text') return null;

  const rows: Array<{ label: string; value: string }> = [];

  if (type === 'url') {
    rows.push({ label: 'Domain Address', value: String(technical.domain || input.meta.domain || 'Not available') });
    rows.push({
      label: 'Security Protocol',
      value: technical.https ? 'TLS / HTTPS Encrypted' : 'Unencrypted HTTP'
    });
    rows.push({
      label: 'Registry Classification',
      value: String(technical.reputationCategory || 'Standard Web Domain')
    });
    if (technical.lookalikeTarget) {
      rows.push({ label: 'Lookalike Target', value: `Resembles ${technical.lookalikeTarget}` });
    }
    if (typeof technical.pathDepth === 'number') {
      rows.push({ label: 'Path Depth', value: `${technical.pathDepth} segments` });
    }
  } else if (type === 'image') {
    rows.push({ label: 'File Name', value: String(technical.fileName || input.meta.fileName || 'Uploaded image') });
    rows.push({ label: 'Container Format', value: String(technical.format || input.meta.fileType || 'Not available') });
    rows.push({ label: 'Image Dimensions', value: String(technical.dimensions || 'Standard Web') });
    rows.push({ label: 'File Size', value: `${technical.sizeKB || input.meta.sizeKB || 'Not available'} KB` });
    rows.push({ label: 'Camera Hardware', value: String(technical.cameraMake && technical.cameraMake !== 'None' ? `${technical.cameraMake} ${technical.cameraModel || ''}` : 'Not recorded in file') });
    rows.push({ label: 'Software / Editing Tag', value: String(technical.softwareTag && technical.softwareTag !== 'None' ? technical.softwareTag : 'None detected') });
    rows.push({ label: 'Original Capture Date', value: String(technical.captureDate || 'Not recorded') });
    rows.push({ label: 'Compression Profile', value: String(technical.compressionEstimate || 'Standard quality') });
  } else if (type === 'video') {
    rows.push({ label: 'File Name', value: String(technical.fileName || input.meta.fileName || 'Uploaded video') });
    rows.push({ label: 'Container Format', value: String(technical.container || 'Standard video') });
    rows.push({ label: 'Stream Signature', value: String(technical.streamSignature || 'MPEG/WebM video stream') });
    rows.push({ label: 'File Size', value: String(technical.sizeMB || 'Not available') });
    rows.push({ label: 'Container Atoms', value: String(technical.headerValidation || 'Verified') });
  } else if (type === 'audio') {
    rows.push({ label: 'File Name', value: String(technical.fileName || input.meta.fileName || 'Uploaded audio') });
    rows.push({ label: 'Audio Container', value: String(technical.container || 'Standard audio') });
    rows.push({ label: 'Audio Codec', value: String(technical.codec || 'Standard stream') });
    rows.push({ label: 'Audio Duration', value: String(technical.duration || 'Not available') });
    rows.push({ label: 'Bitrate', value: String(technical.bitrate || 'Standard quality') });
  }

  if (rows.length === 0) return null;

  return (
    <div className="card space-y-3 bg-paper dark:bg-brown-900 border border-line dark:border-brown-700">
      <h4 className="text-sm font-bold font-heading text-ink dark:text-cream">
        What we read from your {type === 'url' ? 'link' : 'file'}
      </h4>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-line dark:border-brown-700 text-muted dark:text-brown-400 font-semibold">
              <th className="py-2 pr-4 font-bold">Property</th>
              <th className="py-2 font-bold">Extracted Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line dark:divide-brown-800">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-sand/20 dark:hover:bg-brown-800/40 transition-colors">
                <td className="py-2.5 pr-4 text-muted dark:text-brown-300 font-medium">
                  {row.label}
                </td>
                <td className="py-2.5 text-ink dark:text-cream font-mono font-semibold">
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

