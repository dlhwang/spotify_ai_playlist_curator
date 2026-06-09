import { cookies } from "next/headers";
import { AuthService } from "@/server/services/auth-service";
import { HomePage } from "@/features/home/home-page";

export default async function Page() {
  const cookieStore = await cookies();
  const authService = new AuthService();
  const session = authService.getSession(cookieStore);
  const isAuthenticated = !!session;

  return <HomePage isAuthenticated={isAuthenticated} />;
}
