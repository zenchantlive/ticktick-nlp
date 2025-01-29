import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      // Protect all routes except auth-related ones
      const path = req.nextUrl.pathname;
      if (path.startsWith("/auth/")) {
        return true;
      }
      return !!token;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     * - auth files (authentication routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|auth).*)",
  ],
};
