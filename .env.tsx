
// Environment variables for Supabase configuration, defined as TypeScript constants to prevent parsing errors.
export const NEXT_PUBLIC_SUPABASE_URL = "https://avmbwggilwebofyroqol.supabase.co";
export const NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bWJ3Z2dpbHdlYm9meXJvcW9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNzkwNDIsImV4cCI6MjA4MTk1NTA0Mn0.DR5himNJgYL6T03Vf0tC5rL1EL50XX8Jx8VIY04mIbU";

SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET="<client-secret>"
[auth.external.google]
enabled = true
client_id = "<client-id>"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET)"
skip_nonce_check = false

{
  "external_google_enabled": true,
  "external_google_client_id": "547969903508-nqefolsuoa7784eefogocbfigaeqtnf2.apps.googleusercontent.com",
  "external_google_secret": "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"
}
await supabase.auth.signInWithOAuth(
  OAuthProvider.google,
  redirectTo: kIsWeb ? null : 'my.scheme://my-host', // Optionally set the redirect link to bring back the user via deeplink.
  authScreenLaunchMode:
      kIsWeb ? LaunchMode.platformDefault : LaunchMode.externalApplication, // Launch the auth screen in a new webview on mobile.
);