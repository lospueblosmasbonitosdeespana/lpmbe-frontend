import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const contentType = req.headers.get('content-type');
  if (!contentType || !contentType.includes('multipart/form-data')) {
    return NextResponse.json({ message: 'Se espera multipart/form-data' }, { status: 400 });
  }

  try {
    const API_BASE = getApiUrl();
    const res = await fetch(
      `${API_BASE}/admin/newsletter/institutional-contacts/import-vcf`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': contentType,
        },
        body: req.body,
        ...(req.body && ({ duplex: 'half' } as Record<string, string>)),
      },
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Error' }, { status: 500 });
  }
}
