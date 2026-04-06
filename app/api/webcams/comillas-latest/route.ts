import { NextResponse } from 'next/server';

const COMILLAS_BASE = 'https://comillas.es/comillas/camaras';
const FOLDER_REGEX = /^camara\d+$/i;

interface ComillasLatestResponse {
  success?: boolean;
  image_path?: string;
  filename?: string;
  subfolder?: string;
  upload_time?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const folder = (searchParams.get('folder') || '').trim();

  if (!FOLDER_REGEX.test(folder)) {
    return NextResponse.json(
      { success: false, error: 'folder inválido' },
      { status: 400 },
    );
  }

  const upstreamUrl = `${COMILLAS_BASE}/get_latest_image.php?folder=${encodeURIComponent(folder)}&format=json`;

  try {
    const res = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Referer:
          'https://comillas.es/comillas/web_php/index.php?contenido=subapartados_coconut&id_boto=82&title=webcams-comillas',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Error upstream (${res.status})` },
        { status: 502 },
      );
    }

    const data = (await res.json()) as ComillasLatestResponse;
    if (!data?.success || !data.image_path) {
      return NextResponse.json(
        { success: false, error: 'Respuesta inválida de Comillas' },
        { status: 502 },
      );
    }

    const imageUrl = `${COMILLAS_BASE}/${data.image_path.replace(/^\/+/, '')}`;

    return NextResponse.json({
      success: true,
      imageUrl,
      filename: data.filename ?? null,
      uploadTime: data.upload_time ?? null,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'No se pudo consultar Comillas' },
      { status: 502 },
    );
  }
}
