import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '4rem 1.5rem' }}>
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="That page doesn't exist. Check the link, or head back to the Dashboard."
        action={
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm">Back to Dashboard</Button>
          </Link>
        }
      />
    </div>
  );
}
