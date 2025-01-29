import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";

async function refreshAccessToken(token: JWT) {
  try {
    const response = await fetch("https://api.ticktick.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.TICKTICK_CLIENT_ID}:${process.env.TICKTICK_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      expiresAt: Date.now() + refreshedTokens.expires_in * 1000,
    };
  } catch (error) {
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "ticktick",
      name: "TickTick",
      type: "oauth",
      authorization: {
        url: "https://ticktick.com/oauth/authorize",
        params: {
          scope: "tasks:write tasks:read",
          response_type: "code",
        },
      },
      token: {
        url: "https://api.ticktick.com/oauth/token",
      },
      userinfo: {
        url: "https://api.ticktick.com/api/v2/user/profile",
      },
      clientId: process.env.TICKTICK_CLIENT_ID,
      clientSecret: process.env.TICKTICK_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.userId,
          name: profile.username,
          email: profile.email,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Initial sign in
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at ? account.expires_at * 1000 : 0,
        };
      }

      // Return previous token if the access token has not expired yet
      if (token.expiresAt && Date.now() < token.expiresAt) {
        return token;
      }

      // Access token has expired, try to refresh it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.expiresAt = token.expiresAt;
      session.error = token.error;
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  debug: process.env.NODE_ENV === "development",
};
