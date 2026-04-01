import express, { Express, Request, Response } from "express";
import axios from "axios";
import qs from "querystring";
import cookieParser from "cookie-parser";

const COOKIE_NAME = "session_token";
const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

const CLIENT_ID = process.env.VITE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.VITE_OAUTH_CLIENT_SECRET;
const REDIRECT_URI = process.env.VITE_OAUTH_REDIRECT_URI ?? "http://localhost:5173/api/oauth/callback";

function getSessionCookieOptions(req: Request) {
  return {
    httpOnly: true,
    secure: req.protocol === "https",
    sameSite: "lax" as const,
    path: "/",
  };
}

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.use(cookieParser());

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await axios.post(
        "https://oauth2.googleapis.com/token",
        qs.stringify({
          code,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const { access_token } = tokenResponse.data;

      const userInfoResponse = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const userInfo = userInfoResponse.data;

      const sessionToken = Buffer.from(`${userInfo.sub}:${Date.now()}`).toString("base64");

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error: any) {
      console.error("[OAuth] Callback failed", error.response?.data || error.message);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
