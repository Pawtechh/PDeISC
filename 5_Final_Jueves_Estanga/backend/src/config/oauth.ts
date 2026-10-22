export const OAUTH_CONFIG = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id.apps.googleusercontent.com',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock-google-client-secret',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
    scope: ['openid', 'profile', 'email'],
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || 'mock-github-client-id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'mock-github-client-secret',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scope: ['read:user', 'user:email'],
  },
  facebook: {
    clientId: process.env.FACEBOOK_APP_ID || 'mock-facebook-app-id',
    clientSecret: process.env.FACEBOOK_APP_SECRET || 'mock-facebook-app-secret',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    userInfoUrl: 'https://graph.facebook.com/me?fields=id,name,email,picture',
    scope: ['public_profile', 'email'],
  },
  apple: {
    clientId: process.env.APPLE_CLIENT_ID || 'com.surfrental.mdp.web',
    teamId: process.env.APPLE_TEAM_ID || 'mock-apple-team-id',
    keyId: process.env.APPLE_KEY_ID || 'mock-apple-key-id',
    privateKey: process.env.APPLE_PRIVATE_KEY || 'mock-apple-private-key',
    authUrl: 'https://appleid.apple.com/auth/authorize',
    tokenUrl: 'https://appleid.apple.com/auth/token',
    scope: ['name', 'email'],
  },
  callbackBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
  mobileDeepLinkScheme: 'surfrental://auth/callback',
} as const;

export type SupportedOAuthProvider = 'google' | 'github' | 'facebook' | 'apple';
