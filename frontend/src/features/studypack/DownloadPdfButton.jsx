import React, { useState } from 'react';
import { Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { downloadPdfBlob } from '@/api/client';

/**
 * Downloads the backend-generated PDF (GET /download/{taskId}).
 * Uses the authenticated downloadPdfBlob helper to ensure the JWT
 * Authorization header is passed to the protected endpoint.
 */
export default function DownloadPdfButton({ taskId, size = 'sm', variant = 'outline', label = 'Download PDF' }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const download = async () => {
    if (!taskId || busy) return;
    setBusy(true);
    try {
      const blob = await downloadPdfBlob(taskId);
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = 'study_notes.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
    } catch (err) {
      console.warn('PDF download failed:', err);
      toast.error('Download failed', err.message || 'Could not download study guide PDF.');
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
      disabled={!taskId}
      title={taskId ? 'Download the printable study guide' : 'PDF not available'}
    >
      {busy ? 'Preparing…' : label}
    </Button>
  );
}
