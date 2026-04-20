import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ESTO REFRESCA EL TOKENN SI ESTA EXPIRADO
  const { data: { user } } = await supabase.auth.getUser()

  // --- LÓGICA DE PROTECCIÓN DE RUTAS ---
  const currentPath = request.nextUrl.pathname;

  // 1. Si no hay usuario y trata de entrar a admin o usuario, mandarlo a login
  if (!user && (currentPath.startsWith('/admin') || currentPath.startsWith('/usuario'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. Si hay usuario, validar roles
  if (user) {
    const userRole = user.app_metadata?.rol || 'usuario';

    // Si es usuario normal y quiere entrar a /admin, expulsarlo
    if (currentPath.startsWith('/admin') && userRole !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/usuario' // Lo mandamos a su zona permitida
      return NextResponse.redirect(url)
    }

    // Si está en /login o /registro ya autenticado, mandarlo a su dashboard
    if (currentPath === '/login' || currentPath === '/registro') {
      const url = request.nextUrl.clone()
      url.pathname = userRole === 'admin' ? '/admin' : '/usuario'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}