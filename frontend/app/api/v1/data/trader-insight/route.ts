import { NextRequest, NextResponse } from 'next/server';
import { resolveApiBaseUrlForHostname } from '@/lib/api-base';

export async function GET(request: NextRequest) {
  const hostname = request.nextUrl.hostname;
  const apiBase = resolveApiBaseUrlForHostname(hostname);

  const id = request.nextUrl.searchParams.get('id')?.trim();
  const upstreamUrl = id
    ? `${apiBase}/api/v1/data/trader-insight?id=${encodeURIComponent(id)}`
    : `${apiBase}/api/v1/data/trader-insight`;

  const authHeader = request.headers.get('authorization');
  const cookieToken = request.cookies.get('auth_token')?.value;
  const bearerToken = authHeader ?? (cookieToken ? `Bearer ${cookieToken}` : null);

  if (!bearerToken) {
    return NextResponse.json(
      { error: 'Trader insight için giriş yapın.' },
      { status: 200 },
    );
  }

  const upstream = await fetch(upstreamUrl, {
    method: 'GET',
    headers: {
      ...(bearerToken ? { Authorization: bearerToken } : {}),
    },
    cache: 'no-store',
  });

  const bodyText = await upstream.text();

  if (upstream.status === 401 || upstream.status === 403) {
    return NextResponse.json(
      { error: 'Trader insight için yeniden giriş yapın.' },
      { status: 200 },
    );
  }

  return new NextResponse(bodyText, {
    status: upstream.status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}
