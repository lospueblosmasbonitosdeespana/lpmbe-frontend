import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'url required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${API_BASE}/public/youtube/resolve?url=${encodeURIComponent(url)}`,
      { cache: 'no-store' },
    );
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    });
  } catch {
    return NextResponse.json(
      { status: 'none', videoId: null, title: null, thumbnail: null, channelTitle: null },
      { status: 200 },
    );
  }
}
