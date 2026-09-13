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
    toast.success('Local cache cleared', `Cleared ${cleared} cached lecture${cleared === 1 ? '' : 's'} from this browser. Your account library remains safe.`);
  }, [count, toast]);

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem 1.5rem' }}>
        <div style={{ minWidth: 200, flex: '1 1 260px' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>
            Local Device Cache
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
            {count} cached lecture{count === 1 ? '' : 's'} mirrored on this device for offline speed.
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
          Clear local cache
        </Button>
      </div>

      <p style={{ margin: '0.9rem 0 0', fontSize: '0.8rem', lineHeight: 1.55, color: 'var(--text-muted)' }}>
        Your lecture library is permanently saved to your authenticated account in the cloud database.
        A local copy is mirrored in this browser for quick offline access. Clearing this cache removes the local copy
        without deleting any data from your account.
      </p>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Clear local browser cache?"
        description="This only clears cached copies on this device."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" icon={Trash2} onClick={handleConfirmClear}>
              Clear {count} cached item{count === 1 ? '' : 's'}
            </Button>
          </>
        }
      >
        <Alert tone="warning" icon={AlertTriangle}>
          Clears local browser cache of {count} lecture{count === 1 ? '' : 's'}. Your study packs and lecture records
          remain permanently saved in your LectraAI account and can be reloaded anytime.
        </Alert>
      </Modal>
    </>
  );
}
