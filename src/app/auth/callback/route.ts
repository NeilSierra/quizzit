import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (code && url && key) {
    const cookieStore = await cookies();
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    });
    await supabase.auth.exchangeCodeForSession(code);
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const redirectBase =
    process.env.NODE_ENV === "development" || !forwardedHost
      ? origin
      : `https://${forwardedHost}`;

  return NextResponse.redirect(`${redirectBase}/`);
}
