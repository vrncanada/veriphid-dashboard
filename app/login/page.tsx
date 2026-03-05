// Server Component — dynamic export works here to skip static prerendering
export const dynamic = "force-dynamic"

import { LoginClient } from "./LoginClient"

export default function LoginPage() {
  return <LoginClient />
}
