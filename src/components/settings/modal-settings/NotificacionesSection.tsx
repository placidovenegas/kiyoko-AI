'use client';

import { useState } from 'react';
import { Switch } from '@heroui/react';
import { SectionTitle, SectionDescription, SettingsCard, Row } from './shared';

export function NotificacionesSection() {
  const [prefs, setPrefs] = useState({
    email_activity: true,
    email_digest: false,
    inapp_comments: true,
    inapp_updates: true,
  });
  const toggle = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div>
      <SectionTitle>Notificaciones</SectionTitle>
      <SectionDescription>Decide cuándo y cómo quieres recibir notificaciones.</SectionDescription>

      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">Email</p>
          <SettingsCard>
            <Row label="Actividad del proyecto" description="Comentarios, menciones y cambios importantes">
              <Switch isSelected={prefs.email_activity} onChange={() => toggle('email_activity')} size="sm" aria-label="Email actividad" />
            </Row>
            <Row label="Resumen semanal" description="Resumen de actividad de tu organización">
              <Switch isSelected={prefs.email_digest} onChange={() => toggle('email_digest')} size="sm" aria-label="Email resumen" />
            </Row>
          </SettingsCard>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">En la app</p>
          <SettingsCard>
            <Row label="Comentarios y menciones" description="Cuando alguien te menciona o comenta en tu trabajo">
              <Switch isSelected={prefs.inapp_comments} onChange={() => toggle('inapp_comments')} size="sm" aria-label="In-app comentarios" />
            </Row>
            <Row label="Actualizaciones del sistema" description="Nuevas funciones y mejoras de Kiyoko AI">
              <Switch isSelected={prefs.inapp_updates} onChange={() => toggle('inapp_updates')} size="sm" aria-label="In-app actualizaciones" />
            </Row>
          </SettingsCard>
        </div>
      </div>
    </div>
  );
}
