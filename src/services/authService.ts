import React from 'react';
import Auth0, { Credentials } from 'react-native-auth0';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';

import config from './config';
import { generateId } from '../utils/helpers';

const { auth0Domain, auth0ClientId } = config;

// User interface for our app
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  emailVerified: boolean;
}

class AuthService {
  private auth0: Auth0;
  private currentUser: AuthUser | null = null;
  private credentials: Credentials | null = null;
  private initialized = false;

  constructor() {
    this.auth0 = new Auth0({
      domain: auth0Domain!,
      clientId: auth0ClientId!,
    });
  }

  async initialize(): Promise<void> {
    try {
      console.log('🔐 Initializing Auth Service...');
      
      // Check for stored credentials
      const storedCredentials = await AsyncStorage.getItem('auth0_credentials');
      const storedUser = await AsyncStorage.getItem('currentUser');
      
      if (storedCredentials && storedUser) {
        this.credentials = JSON.parse(storedCredentials);
        this.currentUser = JSON.parse(storedUser);
        console.log('✅ Restored auth session for:', this.currentUser?.email);
      } else {
        console.log('👤 No existing auth session found');
      }
      
      this.initialized = true;
      this.notifyListeners();
      console.log('✅ Auth Service initialized');
    } catch (error) {
      console.error('❌ Auth Service initialization failed:', error);
      this.initialized = true; // Still mark as initialized even if restoration failed
    }
  }

  async login(): Promise<AuthUser | null> {
    try {
      console.log('🔐 Starting Auth0 login...');
      
      // Trigger Auth0 login
      const credentials = await this.auth0.webAuth.authorize({
        scope: 'openid profile email',
        audience: `https://${auth0Domain}/api/v2/`,
      });
      
      console.log('✅ Auth0 credentials received');
      this.credentials = credentials;
      
      // Get user info
      const user = await this.getUserInfo();
      if (user) {
        this.currentUser = user;
        
        // Store credentials and user
        await AsyncStorage.setItem('auth0_credentials', JSON.stringify(credentials));
        await AsyncStorage.setItem('currentUser', JSON.stringify(user));
        
        this.notifyListeners();
        console.log('✅ Login successful for:', user.email);
        return user;
      }
      
      throw new Error('Failed to get user info');
    } catch (error) {
      console.error('❌ Login failed:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('🔐 Starting logout...');
      
      // Clear Auth0 session
      if (this.credentials) {
        await this.auth0.webAuth.clearSession();
      }
      
      // Clear local storage
      await AsyncStorage.multiRemove([
        'auth0_credentials',
        'currentUser',
      ]);
      
      // Clear instance variables
      this.credentials = null;
      this.currentUser = null;
      
      this.notifyListeners();
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Even if logout fails, clear local state
      this.credentials = null;
      this.currentUser = null;
      this.notifyListeners();
    }
  }

  async refreshTokens(): Promise<boolean> {
    try {
      if (!this.credentials?.refreshToken) {
        console.log('No refresh token available');
        return false;
      }
      
      console.log('🔄 Refreshing tokens...');
      const newCredentials = await this.auth0.auth.refreshToken({
        refreshToken: this.credentials.refreshToken,
      });
      
      this.credentials = { ...this.credentials, ...newCredentials };
      await AsyncStorage.setItem('auth0_credentials', JSON.stringify(this.credentials));
      
      console.log('✅ Tokens refreshed successfully');
      return true;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      return false;
    }
  }

  private async getUserInfo(): Promise<AuthUser | null> {
    try {
      if (!this.credentials?.accessToken) {
        throw new Error('No access token available');
      }
      
      console.log('📝 Getting user info...');
      const userInfo = await this.auth0.auth.userInfo({
        token: this.credentials.accessToken,
      });
      
      // Map Auth0 user to our AuthUser interface
      const user: AuthUser = {
        id: userInfo.sub || generateId(),
        email: userInfo.email || '',
        name: userInfo.name || userInfo.nickname || 'User',
        avatar: userInfo.picture || '',
        emailVerified: userInfo.email_verified || false,
      };
      
      console.log('✅ User info retrieved:', user.email);
      return user;
    } catch (error) {
      console.error('❌ Failed to get user info:', error);
      return null;
    }
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  getAccessToken(): string | null {
    return this.credentials?.accessToken || null;
  }

  getIdToken(): string | null {
    return this.credentials?.idToken || null;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser && !!this.credentials;
  }

  async updateUserProfile(updates: Partial<AuthUser>): Promise<AuthUser | null> {
    try {
      if (!this.currentUser) {
        throw new Error('Not authenticated');
      }

      // Update local user object
      this.currentUser = { ...this.currentUser, ...updates };
      
      // Save to local storage
      await AsyncStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      
      // Note: In a real implementation, you'd also update the user in Auth0
      // using the Management API
      
      this.notifyListeners();
      console.log('✅ User profile updated');
      return this.currentUser;
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      return null;
    }
  }

  async deleteAccount(): Promise<boolean> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated');
      }

      console.log('🗑️ Initiating account deletion...');
      
      // Note: Actual account deletion would require Auth0 Management API
      // For now, just logout the user
      await this.logout();
      
      console.log('⚠️ Account deletion initiated (requires backend implementation)');
      return true;
    } catch (error) {
      console.error('❌ Account deletion failed:', error);
      return false;
    }
  }

  // Get user permissions/roles (if using Auth0 RBAC)
  getUserPermissions(): string[] {
    if (!this.credentials?.idToken) return [];
    
    try {
      // Decode JWT token to get permissions
      const payload = JSON.parse(
        Buffer.from(this.credentials.idToken.split('.')[1], 'base64').toString()
      );
      
      return payload.permissions || payload['https://myapp.example.com/permissions'] || [];
    } catch (error) {
      console.error('Failed to parse permissions:', error);
      return [];
    }
  }

  // Check if user has specific permission
  hasPermission(permission: string): boolean {
    const permissions = this.getUserPermissions();
    return permissions.includes(permission);
  }

  // Auth state listeners
  private listeners: Array<(user: AuthUser | null) => void> = [];

  addAuthStateListener(callback: (user: AuthUser | null) => void): () => void {
    this.listeners.push(callback);
    
    // Immediately call with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentUser);
      } catch (error) {
        console.error('Auth state listener error:', error);
      }
    });
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      return this.initialized && !!auth0Domain && !!auth0ClientId;
    } catch {
      return false;
    }
  }

  // Get service info for debugging
  getServiceInfo(): object {
    return {
      initialized: this.initialized,
      hasCredentials: !!this.credentials,
      hasUser: !!this.currentUser,
      domain: auth0Domain ? 'configured' : 'missing',
      clientId: auth0ClientId ? 'configured' : 'missing',
      userId: this.currentUser?.id || null,
      userName: this.currentUser?.name || null,
    };
  }

  // Session management
  async refreshSession(): Promise<AuthUser | null> {
    try {
      // In a real implementation, this would refresh the auth token
      return this.currentUser;
    } catch (error) {
      console.error('Session refresh error:', error);
      return null;
    }
  }

  async validateSession(): Promise<boolean> {
    try {
      // In a real implementation, this would validate the auth token
      return !!this.currentUser;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  // Integration helper for future social login features
  async handleSocialLogin(provider: 'google' | 'facebook' | 'apple'): Promise<void> {
    try {
      console.log(`Social login with ${provider} - ready for implementation`);
      
      // In a real implementation, this would use Auth0's social connections
      throw new Error(`${provider} login not yet implemented`);
    } catch (error) {
      console.error(`${provider} login error:`, error);
      throw error;
    }
  }
}

export const authService = new AuthService(); 