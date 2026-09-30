import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Legacy PKCE code-exchange handler, kept only so magic links sent before the
// switch to /auth/confirm (token-hash flow) still resolve. New links use
// /auth/confirm, which isn't tied to the browser that requested the link.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  // Supabase can also hand back an error directly (expired or already-used link).
  const providerError = searchParams.get('error_description') || searchParams.get('error');
  if (providerError) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(providerError)}`);
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('That link did not contain a login code.')}`
    );
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Most common cause: the link was opened in a different browser, device, or
    // an email app's in-app browser, so the PKCE code verifier stored when the
    // link was requested isn't available here to complete the exchange.
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  return NextResponse.redirect(`${origin}/`);
}
