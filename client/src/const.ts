export const COOKIE_NAME = "session_token";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.OAUTH_SERVER_URL ?? "https://accounts.google.com";
  const clientId = import.meta.env.VITE_OAUTH_CLIENT_ID ?? "290803812530-tjnt8d546at1ov6s3o6i35117e35bgbo.apps.googleusercontent.com";
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/o/oauth2/v2/auth`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");

  return url.toString();
};
