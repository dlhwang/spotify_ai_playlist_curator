import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AuthService } from "@/server/services/auth-service";

export async function POST() {
  try {
    const authService = new AuthService();
    const cookieStore = await cookies();
    const session = authService.getSession(cookieStore);

    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    try {
      const refreshedSession = await authService.refreshSession(session.refreshToken);
      authService.setSession(cookieStore, refreshedSession);
      return NextResponse.json({ ok: true });
    } catch (refreshError) {
      console.error("Token refresh API handler failed:", refreshError);
      
      // Clear session cookie on refresh failure to prevent infinite loop of invalid requests
      authService.clearSession(cookieStore);
      return NextResponse.json({ error: "session_expired" }, { status: 401 });
    }
  } catch (error) {
    console.error("Session refresh route handler runtime error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
