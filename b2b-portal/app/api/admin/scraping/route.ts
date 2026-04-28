/**
 * POST /api/admin/scraping
 * J'Info B2B Platform - Declanșează actualizarea circuitelor via GitHub Actions
 *
 * Securitate:
 *   - Doar adminii autentificați pot accesa acest endpoint
 *   - Folosește GITHUB_ACTIONS_TOKEN pentru a triggera workflow-ul
 *
 * GET /api/admin/scraping
 *   - Returnează statusul ultimului workflow run
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const GITHUB_TOKEN = process.env.GITHUB_ACTIONS_TOKEN;
const GITHUB_OWNER = 'gigibardan-dev';
const GITHUB_REPO = 'jinfo-b2b-platform';
const WORKFLOW_ID = 'update-circuits.yml';

// ── Verifică că userul e admin
async function isAdmin(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return false;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin' || profile?.role === 'superadmin';
}

// ── POST - Declanșează workflow
export async function POST(request: NextRequest) {
  if (!await isAdmin(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', message: 'Acces interzis.' },
      { status: 401 }
    );
  }

  if (!GITHUB_TOKEN) {
    return NextResponse.json(
      { success: false, error: 'Configuration Error', message: 'GITHUB_ACTIONS_TOKEN nu este configurat.' },
      { status: 500 }
    );
  }

  try {
    // Triggereaza workflow via GitHub API
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_ID}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            triggered_by: 'admin-dashboard'
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API error:', errorText);
      return NextResponse.json(
        {
          success: false,
          error: 'GitHub API Error',
          message: 'Nu s-a putut declanșa workflow-ul. Verificați token-ul GitHub.'
        },
        { status: 500 }
      );
    }

    // GitHub returnează 204 No Content la success
    return NextResponse.json({
      success: true,
      data: {
        message: 'Actualizarea circuitelor a fost declanșată cu succes!',
        status: 'running',
        details: 'Procesul durează 60-90 minute. Poți urmări progresul în tab-ul de status.',
        github_url: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_ID}`
      }
    });

  } catch (error) {
    console.error('Scraping trigger error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', message: 'Eroare la declanșarea actualizării.' },
      { status: 500 }
    );
  }
}

// ── GET - Status ultimul workflow run
export async function GET(request: NextRequest) {
  if (!await isAdmin(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', message: 'Acces interzis.' },
      { status: 401 }
    );
  }

  if (!GITHUB_TOKEN) {
    return NextResponse.json(
      { success: false, error: 'Configuration Error', message: 'GITHUB_ACTIONS_TOKEN nu este configurat.' },
      { status: 500 }
    );
  }

  try {
    // Obține ultimele runs ale workflow-ului
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_ID}/runs?per_page=5`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'GitHub API Error', message: 'Nu s-a putut obține statusul.' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const runs = data.workflow_runs || [];

    // Formatează runs pentru frontend
    const formattedRuns = runs.map((run: any) => ({
      id: run.id,
      status: run.status,           // queued, in_progress, completed
      conclusion: run.conclusion,   // success, failure, cancelled, null
      started_at: run.created_at,
      completed_at: run.updated_at,
      duration_seconds: run.created_at && run.updated_at
        ? Math.round((new Date(run.updated_at).getTime() - new Date(run.created_at).getTime()) / 1000)
        : null,
      triggered_by: run.event,      // workflow_dispatch, schedule
      url: run.html_url
    }));

    const latest = formattedRuns[0] || null;

    return NextResponse.json({
      success: true,
      data: {
        latest_run: latest,
        recent_runs: formattedRuns,
        workflow_url: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_ID}`
      }
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', message: 'Eroare la verificarea statusului.' },
      { status: 500 }
    );
  }
}