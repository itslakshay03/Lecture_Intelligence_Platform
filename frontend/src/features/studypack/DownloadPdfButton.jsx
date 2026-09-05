import React, { useState } from 'react';
import { Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { getDownloadUrl } from '@/api/client';

/**
 * Downloads the real backend-generated PDF (GET /download/{taskId}).
 * Fetches it as a blob so the button can show a "Preparing…" state; if the
 * fetch is blocked for any reason it falls back to opening the endpoint URL
 * directly (same behaviour as before this component existed).
 */
export default function DownloadPdfButton({ taskId, size = 'sm', variant = 'outline', label = 'Download PDF' }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const url = taskId ? getDownloadUrl(taskId) : null;

  const openDirect = () => {
    if (url) window.open(url, '_blank', 'noopener');
  };

  const download = async () => {
    if (!url || busy) return;
    setBusy(true);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Server returned ${res.status}`);
      }
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = 'study_notes.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
    } catch (err) {
      // Network/CORS/parse issue — fall back to a plain new-tab open.
      console.warn('PDF blob download failed, opening endpoint directly:', err);
      toast.info('Opening PDF', 'Your study guide is opening in a new tab.');
      openDirect();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      icon={Download}
      onClick={download}
      isLoading={busy}
      disabled={!url}
      title={url ? 'Download the printable study guide' : 'PDF not available'}
    >
      {busy ? 'Preparing…' : label}
    </Button>
  );
}
