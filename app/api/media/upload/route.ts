import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

// IMPORTANTE: Configurar límite de body para Vercel
// El límite default de 4.5MB es muy pequeño para imágenes
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

export const runtime = 'nodejs';
export const maxDuration = 60;

// Alias de /api/admin/uploads para uso más general
export async function POST(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const API_BASE = getApiUrl();
  
  try {
    const formData = await req.formData();
    
    const upstream = await fetch(`${API_BASE}/media/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
      cache: 'no-store',
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
    });
  } catch (error: any) {
    console.error('[media/upload] Error:', error);
    if (error.message?.includes('body size')) {
      return NextResponse.json({ 
        error: 'Archivo demasiado grande. El límite es 25MB.' 
      }, { status: 413 });
    }
    return NextResponse.json({ 
      error: error.message || 'Error al subir archivo' 
    }, { status: 500 });
  }
}
