import { Role, AuthProvider } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { JWT_CONFIG } from '../../config/jwt';
import { OAUTH_CONFIG, SupportedOAuthProvider } from '../../config/oauth';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { JwtPayload } from '../../types/auth';

export interface OAuthUserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export class OAuthService {
  /**
   * Mapea el string del proveedor al enum AuthProvider de Prisma
   */
  mapProviderToEnum(provider: SupportedOAuthProvider): AuthProvider {
    switch (provider) {
      case 'google':
        return AuthProvider.GOOGLE;
      case 'github':
        return AuthProvider.GITHUB;
      case 'facebook':
        return AuthProvider.FACEBOOK;
      case 'apple':
        return AuthProvider.APPLE;
    }
  }

  /**
   * Chequea si el proveedor tiene credenciales reales de producción válidas
   */
  isRealProviderConfigured(provider: SupportedOAuthProvider): boolean {
    switch (provider) {
      case 'google': {
        const id = OAUTH_CONFIG.google.clientId;
        return Boolean(id && !id.startsWith('mock-') && !id.startsWith('surf-rental-') && id.includes('.apps.googleusercontent.com'));
      }
      case 'github': {
        const id = OAUTH_CONFIG.github.clientId;
        return Boolean(id && !id.startsWith('mock-') && !id.startsWith('surf-rental-'));
      }
      case 'facebook': {
        const id = OAUTH_CONFIG.facebook.clientId;
        return Boolean(id && !id.startsWith('mock-') && !id.startsWith('surf-rental-'));
      }
      case 'apple': {
        const id = OAUTH_CONFIG.apple.clientId;
        return Boolean(id && !id.startsWith('mock-') && !id.startsWith('com.surfrental.mdp.web'));
      }
    }
  }

  /**
   * Construye la URL de autorización para el proveedor
   */
  getAuthorizationUrl(provider: SupportedOAuthProvider, customRedirectUri?: string): string {
    const defaultRedirect = `${OAUTH_CONFIG.callbackBaseUrl}/auth/oauth/${provider}/callback`;
    const redirectUri = customRedirectUri || defaultRedirect;

    // Si no cuenta con Client ID real de producción y no estamos en entorno de testing unitario,
    // redirigir a la pantalla de consentimiento del Sandbox
    if (process.env.NODE_ENV !== 'test' && !this.isRealProviderConfigured(provider)) {
      return `${OAUTH_CONFIG.callbackBaseUrl}/auth/oauth/${provider}/consent?redirectUri=${encodeURIComponent(redirectUri)}`;
    }

    switch (provider) {
      case 'google': {
        const params = new URLSearchParams({
          client_id: OAUTH_CONFIG.google.clientId,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: OAUTH_CONFIG.google.scope.join(' '),
          access_type: 'offline',
          prompt: 'select_account',
        });
        return `${OAUTH_CONFIG.google.authUrl}?${params.toString()}`;
      }
      case 'github': {
        const params = new URLSearchParams({
          client_id: OAUTH_CONFIG.github.clientId,
          redirect_uri: redirectUri,
          scope: OAUTH_CONFIG.github.scope.join(' '),
        });
        return `${OAUTH_CONFIG.github.authUrl}?${params.toString()}`;
      }
      case 'facebook': {
        const params = new URLSearchParams({
          client_id: OAUTH_CONFIG.facebook.clientId,
          redirect_uri: redirectUri,
          scope: OAUTH_CONFIG.facebook.scope.join(','),
          response_type: 'code',
        });
        return `${OAUTH_CONFIG.facebook.authUrl}?${params.toString()}`;
      }
      case 'apple': {
        const params = new URLSearchParams({
          client_id: OAUTH_CONFIG.apple.clientId,
          redirect_uri: redirectUri,
          response_type: 'code id_token',
          scope: OAUTH_CONFIG.apple.scope.join(' '),
          response_mode: 'form_post',
        });
        return `${OAUTH_CONFIG.apple.authUrl}?${params.toString()}`;
      }
    }
  }

  /**
   * Obtiene o simula el perfil del usuario a partir del código de autorización
   */
  async fetchUserProfile(
    provider: SupportedOAuthProvider,
    codeOrToken: string,
    redirectUri?: string
  ): Promise<OAuthUserProfile> {
    // Si viene de la pantalla de consentimiento Sandbox (código sandbox-oauth-)
    if (codeOrToken.startsWith('sandbox-oauth-')) {
      try {
        const prefix = `sandbox-oauth-${provider}-`;
        const rawPayload = codeOrToken.startsWith(prefix) ? codeOrToken.replace(prefix, '') : codeOrToken;
        const jsonStr = decodeURIComponent(Buffer.from(rawPayload, 'base64').toString('utf-8'));
        const data = JSON.parse(jsonStr);
        return {
          id: `oauth-${provider}-${Buffer.from(data.email).toString('hex').slice(0, 12)}`,
          email: String(data.email).toLowerCase(),
          name: data.name || `Surfista ${provider.toUpperCase()}`,
          avatarUrl: `https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=150`,
        };
      } catch {
        return {
          id: `oauth-${provider}-${Date.now()}`,
          email: `surfista.${provider}@surfrental.mdp`,
          name: `Surfista ${provider.toUpperCase()}`,
          avatarUrl: `https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=150`,
        };
      }
    }

    // Si es un token de prueba o entorno de testing
    if (codeOrToken.startsWith('mock-') || process.env.NODE_ENV === 'test') {
      return {
        id: `oauth-${provider}-123456`,
        email: `surfista.${provider}@surfrental.mdp`,
        name: `Surfista ${provider.toUpperCase()}`,
        avatarUrl: `https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=150`,
      };
    }

    // Flujo real de Google
    if (provider === 'google') {
      try {
        let accessToken = codeOrToken;
        if (!codeOrToken.startsWith('ya29.')) {
          const tokenRes = await fetch(OAUTH_CONFIG.google.tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              code: codeOrToken,
              client_id: OAUTH_CONFIG.google.clientId,
              client_secret: OAUTH_CONFIG.google.clientSecret,
              redirect_uri: redirectUri || `${OAUTH_CONFIG.callbackBaseUrl}/auth/oauth/google/callback`,
              grant_type: 'authorization_code',
            }).toString(),
          });
          if (tokenRes.ok) {
            const tokenJson = (await tokenRes.json()) as any;
            if (tokenJson.access_token) accessToken = tokenJson.access_token;
          }
        }

        const res = await fetch(OAUTH_CONFIG.google.userInfoUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error('Error al consultar perfil de Google');
        const data = (await res.json()) as any;
        return {
          id: data.sub || data.id,
          email: data.email,
          name: data.name || data.given_name || 'Usuario Google',
          avatarUrl: data.picture,
        };
      } catch (err: any) {
        throw new Error(`Google OAuth error: ${err.message}`);
      }
    }

    // Flujo real de GitHub
    if (provider === 'github') {
      try {
        let accessToken = codeOrToken;
        if (!codeOrToken.startsWith('ghu_') && !codeOrToken.startsWith('gho_')) {
          const tokenRes = await fetch(OAUTH_CONFIG.github.tokenUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              client_id: OAUTH_CONFIG.github.clientId,
              client_secret: OAUTH_CONFIG.github.clientSecret,
              code: codeOrToken,
              redirect_uri: redirectUri,
            }),
          });
          if (tokenRes.ok) {
            const tokenJson = (await tokenRes.json()) as any;
            if (tokenJson.access_token) accessToken = tokenJson.access_token;
          }
        }

        const res = await fetch(OAUTH_CONFIG.github.userInfoUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'User-Agent': 'SurfRental-MDP-App',
          },
        });
        if (!res.ok) throw new Error('Error al consultar perfil de GitHub');
        const data = (await res.json()) as any;

        let email = data.email;
        if (!email) {
          const emailRes = await fetch('https://api.github.com/user/emails', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'User-Agent': 'SurfRental-MDP-App',
            },
          });
          if (emailRes.ok) {
            const emails = (await emailRes.json()) as any[];
            const primary = emails.find((e: any) => e.primary && e.verified) || emails[0];
            if (primary?.email) email = primary.email;
          }
        }

        return {
          id: String(data.id),
          email: email || `${data.login || 'user'}@github.surfrental.mdp`,
          name: data.name || data.login || 'Usuario GitHub',
          avatarUrl: data.avatar_url,
        };
      } catch (err: any) {
        throw new Error(`GitHub OAuth error: ${err.message}`);
      }
    }

    // Flujo real de Facebook
    if (provider === 'facebook') {
      try {
        const res = await fetch(`${OAUTH_CONFIG.facebook.userInfoUrl}&access_token=${codeOrToken}`);
        if (!res.ok) throw new Error('Error al consultar perfil de Facebook');
        const data = (await res.json()) as any;
        return {
          id: data.id,
          email: data.email || `${data.id}@facebook.surfrental.mdp`,
          name: data.name || 'Usuario Facebook',
          avatarUrl: data.picture?.data?.url,
        };
      } catch (err: any) {
        throw new Error(`Facebook OAuth error: ${err.message}`);
      }
    }

    // Flujo Apple
    return {
      id: `apple-sub-${Date.now()}`,
      email: `user.apple@surfrental.mdp`,
      name: 'Usuario Apple',
    };
  }

  /**
   * Genera tokens JWT (Access + Refresh)
   */
  private async generateTokens(user: { id: string; email: string; role: Role }) {
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, JWT_CONFIG.accessSecret, {
      expiresIn: JWT_CONFIG.accessExpiresIn,
    });

    const refreshToken = jwt.sign({ ...payload, jti: randomUUID() }, JWT_CONFIG.refreshSecret, {
      expiresIn: JWT_CONFIG.refreshExpiresIn,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + JWT_CONFIG.refreshDays);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: JWT_CONFIG.accessExpiresIn,
    };
  }

  /**
   * Lógica de vinculación o creación de usuario con OAuth
   */
  async handleOAuthUser(provider: SupportedOAuthProvider, profile: OAuthUserProfile) {
    const providerEnum = this.mapProviderToEnum(provider);

    // 1. Buscar si ya existe usuario con este oauthId y provider
    let user = await prisma.user.findFirst({
      where: {
        oauthId: profile.id,
        authProvider: providerEnum,
      },
    });

    if (user) {
      if (!user.activo) {
        const error: any = new Error('Tu cuenta se encuentra inactiva o suspendida');
        error.statusCode = 403;
        error.code = 'ACCOUNT_DISABLED';
        throw error;
      }

      const tokens = await this.generateTokens(user);
      return { user, tokens, merged: false, isNew: false };
    }

    // 2. Lógica de merge: si existe un usuario con el mismo email, vincularlo
    const userWithEmail = await prisma.user.findUnique({
      where: { email: profile.email.toLowerCase() },
    });

    if (userWithEmail) {
      if (!userWithEmail.activo) {
        const error: any = new Error('Tu cuenta se encuentra inactiva o suspendida');
        error.statusCode = 403;
        error.code = 'ACCOUNT_DISABLED';
        throw error;
      }

      // Vincular cuenta existente
      user = await prisma.user.update({
        where: { id: userWithEmail.id },
        data: {
          oauthId: profile.id,
          authProvider: userWithEmail.authProvider === AuthProvider.LOCAL ? providerEnum : userWithEmail.authProvider,
        },
      });

      const tokens = await this.generateTokens(user);
      return { user, tokens, merged: true, isNew: false };
    }

    // 3. Si no existe ni por oauthId ni por email, crear usuario nuevo con rol CONSUMER
    user = await prisma.user.create({
      data: {
        email: profile.email.toLowerCase(),
        nombre: profile.name,
        role: Role.CONSUMER,
        authProvider: providerEnum,
        oauthId: profile.id,
        dniFotoUrl: profile.avatarUrl,
      },
    });

    const tokens = await this.generateTokens(user);
    return { user, tokens, merged: false, isNew: true };
  }
}

export const oauthService = new OAuthService();
