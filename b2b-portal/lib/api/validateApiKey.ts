/**
 * validateApiKey.ts
 * J'Info B2B Platform - Validare API Key pentru endpoint-uri externe
 * 
 * Folosire în orice route.ts:
 *   import { validateApiKey, unauthorizedResponse } from '@/lib/api/validateApiKey';
 *   const isValid = validateApiKey(request);
 *   if (!isValid) return unauthorizedResponse();
 * 
 * API Key-ul se setează în .env.local:
 *   JINFO_API_KEY=cheia_ta_secreta
 * 
 * QuickSell trimite în fiecare request header-ul:
 *   X-API-Key: cheia_ta_secreta
 * 
 * Notă: Putem upgrada la JWT tokens dacă QuickSell suportă,
 * dar API Key simplu în header e suficient și profesional.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Validează API Key-ul din header-ul requestului
 * Returnează true dacă e valid, false dacă nu
 */
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('X-API-Key');

  if (!apiKey) return false;

  const validKey = process.env.JINFO_API_KEY;

  if (!validKey) {
    console.error('⚠️  JINFO_API_KEY nu e setat în .env.local!');
    return false;
  }

  return apiKey === validKey;
}

/**
 * Răspuns standard pentru request-uri neautorizate
 */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Unauthorized',
      message: 'API Key lipsă sau invalid. Trimite header-ul X-API-Key.'
    },
    { status: 401 }
  );
}

/**
 * Răspuns standard pentru erori de server
 */
export function serverErrorResponse(message: string = 'Eroare internă server'): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Internal Server Error',
      message
    },
    { status: 500 }
  );
}
