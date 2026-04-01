export const COOKIE_NAME = "prontuario_session";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

export const getLoginUrl = () => {
  const oauthServerUrl = import.meta.env.VITE_OAUTH_SERVER_URL ?? "https://accounts.google.com";
  const clientId = import.meta.env.VITE_OAUTH_CLIENT_ID ?? "290803812530-tjnt8d546at1ov6s3o6i35117e35bgbo.apps.googleusercontent.com";
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthServerUrl}/o/oauth2/v2/auth`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url
