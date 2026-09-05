import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardBody } from '@/components/ui/Card';

/**
 * Consistent "titled card" wrapper for each Settings section, so every
 * section (Appearance, Preferences, Local Data, About) shares the same
 * heading hierarchy, spacing and card styling.
 */
export default function SettingsSection({ icon: Icon, title, description, children }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {Icon && <Icon size={17} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />}
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardBody>{children}</CardBody>
    </Card>
  );
}
