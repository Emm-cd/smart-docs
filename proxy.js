import { updateSession } from '@/app/lib/supabase/middleware'

export async function proxy(request) { // <--- Cambiado a "proxy"
   return await updateSession(request)
}