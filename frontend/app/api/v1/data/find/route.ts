import { NextRequest, NextResponse } from 'next/server';
import { resolveApiBaseUrlForHostname } from '@/lib/api-base';

function toSafeFilename(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '');
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')?.trim() ?? '';

  if (!id) {
    return new NextResponse('', {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  }

  const hostname = request.nextUrl.hostname;
  const apiBase = resolveApiBaseUrlForHostname(hostname);
  const upstreamUrl = `${apiBase}/api/v1/data/file?id=${encodeURIComponent(id)}`;

  const upstream = await fetch(upstreamUrl, { cache: 'no-store' });

  if (!upstream.ok) {
    return new NextResponse('', {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  }

  const csvData = await upstream.text();
  const upstreamContentType = upstream.headers.get('content-type') ?? '';
  const isHtmlLike = upstreamContentType.includes('text/html');

  if (isHtmlLike || csvData.length === 0) {
    return new NextResponse('', {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  }

  const safeId = toSafeFilename(id) || 'data';

  return new NextResponse(csvData, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeId}.csv"`,
    },
  });
}
