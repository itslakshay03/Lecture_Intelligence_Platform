import React, { useCallback, useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import { useToast } from '@/components/ui/Toast';
import { MAX_STORED_LECTURES, readRecentLectures, clearLocalLectureHistory } from '../lib/localData';

/**
 * What LectraAI actually stores on this device, and a safe, explicit way to
 * clear it. Scoped to `lectra_recent_lectures` only — never touches theme or
 * other preferences, and never calls a backend endpoint (no delete API
 * exists; nothing on the server is affected either way).
 */
export default function LocalDataCard() {
  const toast = useToast();
  const [lectures, setLectures] = useState(readRecentLectures);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const count = lectures.length;

  const handleConfirmClear = useCallback(() => {
    const cleared = count;
    clearLocalLectureHistory();
    setLectures([]);
    setConfirmOpen(false);
    toast.success('Lecture history cleared', `Removed ${cleared} lecture${cleared === 1 ? '' : 's'} from this device.`);
  }, [count, toast]);

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem 1.5rem' }}>
        <div style={{ minWidth: 200, flex: '1 1 260px' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>
            Lecture history
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
            {count} of {MAX_STORED_LECTURES} lecture{MAX_STORED_LECTURES === 1 ? '' : 's'} stored on this device. Shown on
            Dashboard and in the Lecture Library.
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={Trash2}
          disabled={count === 0}
          onClick={() => setConfirmOpen(true)}
          style={{ color: 'var(--danger)', borderColor: count === 0 ? 'var(--border-color)' : 'var(--danger)' }}
        >
          Clear history
        </Button>
      </div>

      <p style={{ margin: '0.9rem 0 0', fontSize: '0.8rem', lineHeight: 1.55, color: 'var(--text-muted)' }}>
        Each processed lecture's title, video ID and completion time are saved in this browser's local storage so
        Dashboard and Library can list your history — there is no account and nothing is uploaded. Clearing your
        browser data, or the action above, removes it from this device.
      </p>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Clear lecture history?"
        description="This only affects this device."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" icon={Trash2} onClick={handleConfirmClear}>
              Clear {count} lecture{count === 1 ? '' : 's'}
            </Button>
          </>
        }
      >
        <Alert tone="warning" icon={AlertTriangle}>
          Removes all {count} locally stored lecture{count === 1 ? '' : 's'} from Dashboard and the Lecture Library on
          this device. You'll need to process a video again to get a new study pack — this doesn't change anything on
          the server, and your theme and other preferences are kept.
        </Alert>
      </Modal>
    </>
  );
}
