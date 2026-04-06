'use client';

import { useState } from 'react';
import { getAccessTokenFromCookies } from '@/lib/supabase/get-token';

export default function TestUploadPage() {
  const [log, setLog] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  function addLog(msg: string) {
    console.log('[test-upload]', msg);
    setLog((prev) => [...prev, `${new Date().toLocaleTimeString()} — ${msg}`]);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    addLog(`File: ${file.name} (${file.size} bytes, ${file.type})`);

    addLog('Step 1: reading token from cookies...');
    const token = getAccessTokenFromCookies();
    if (!token) {
      addLog('ERROR: Could not extract token from cookies');
      setUploading(false);
      return;
    }
    addLog(`Token OK: ${token.slice(0, 30)}...`);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!;
    const path = `test/${Date.now()}.${file.name.split('.').pop()}`;

    addLog(`Step 2: uploading to kiyoko-storage/${path}...`);
    try {
      const res = await fetch(`${supabaseUrl}/storage/v1/object/kiyoko-storage/${path}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseKey,
        },
        body: file,
      });

      addLog(`Response: ${res.status} ${res.statusText}`);
      const body = await res.text();
      addLog(`Body: ${body}`);

      if (res.ok) {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/kiyoko-storage/${path}`;
        addLog(`SUCCESS! URL: ${publicUrl}`);
      }
    } catch (err) {
      addLog(`FETCH ERROR: ${err instanceof Error ? err.message : String(err)}`);
    }

    setUploading(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-8">
      <h1 className="text-xl font-bold text-foreground">Test Upload</h1>
      <input
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleUpload(f); }}
        className="text-foreground"
      />
      {uploading && <p className="text-sm text-yellow-500">Subiendo...</p>}
      <div className="rounded-lg border border-border bg-background p-4 max-h-96 overflow-y-auto">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Log:</p>
        {log.length === 0 ? (
          <p className="text-xs text-muted-foreground">Selecciona un archivo para probar</p>
        ) : (
          <pre className="space-y-1 text-xs text-foreground whitespace-pre-wrap break-all">{log.map((l, i) => <div key={i}>{l}</div>)}</pre>
        )}
      </div>
    </div>
  );
}
