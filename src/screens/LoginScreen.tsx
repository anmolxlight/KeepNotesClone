import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../services/authService';
import theme from '../styles/theme';

interface LoginScreenProps {
  onAuthSuccess: (user: any) => void;
}

export default function LoginScreen({ onAuthSuccess }: LoginScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      setIsCheckingSession(true);
      await authService.initialize();
      
      const currentUser = authService.getCurrentUser();
      if (currentUser && authService.isAuthenticated()) {
        console.log('✅ Existing session found:', currentUser.name);
        onAuthSuccess(currentUser);
        return;
      }
      
      console.log('👤 No existing session found');
    } catch (error) {
      console.error('❌ Session check failed:', error);
    } finally {
      setIsCheckingSession(false);
    }
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      console.log('🔐 Starting login process...');
      
      const user = await authService.login();
      
      if (user) {
        console.log('✅ Login successful:', user.name);
        onAuthSuccess(user);
      } else {
        Alert.alert(
          'Login Failed',
          'Unable to log in. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      let title = 'Login Error';
      let message = 'An error occurred during login. Please try again.';
      
      if (error.message?.includes('development build')) {
        title = 'Expo Go Limitation';
        message = 'Auth0 login requires a development build and cannot work in Expo Go. Please use "Continue as Guest" to test the app, or build the app for your device to use full authentication.';
      } else if (error.message?.includes('NativeModule')) {
        title = 'Auth0 Not Available';
        message = 'Auth0 authentication is not available in Expo Go. Please use "Continue as Guest" to test the app locally.';
      }
      
      Alert.alert(title, message, [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = () => {
    Alert.alert(
      'Guest Mode',
      'In guest mode, your notes will only be stored locally on this device. Sign in to sync your notes across devices and access AI features.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue as Guest',
          onPress: () => {
            // Create a mock user for guest mode
            const guestUser = {
              id: 'guest',
              name: 'Guest User',
              email: 'guest@example.com',
              avatar: '',
              emailVerified: false,
            };
            onAuthSuccess(guestUser);
          },
        },
      ]
    );
  };

  if (isCheckingSession) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={theme.colors.background} barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Checking session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.background} barStyle="light-content" />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="library-outline" size={64} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>Noted</Text>
          <Text style={styles.subtitle}>Your intelligent note-taking companion</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Ionicons name="cloud-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.featureText}>Sync across devices</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="sparkles-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.featureText}>AI-powered assistance</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="mic-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.featureText}>Voice transcription</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="search-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.featureText}>Smart search</Text>
          </View>
        </View>

        {/* Login Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.loginButton, styles.primaryButton]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.onPrimary} />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={24} color={theme.colors.onPrimary} />
                <Text style={styles.loginButtonText}>Sign In with Auth0</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, styles.secondaryButton]}
            onPress={handleGuestMode}
            disabled={isLoading}
          >
            <Ionicons name="person-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: theme.colors.onSurface,
    fontSize: 16,
    marginTop: theme.spacing.md,
  },

  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    justifyContent: 'center',
  },

  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl * 2,
  },

  logoContainer: {
    marginBottom: theme.spacing.lg,
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.sm,
  },

  subtitle: {
    fontSize: 16,
    color: theme.colors.secondaryText,
    textAlign: 'center',
    lineHeight: 24,
  },

  featuresContainer: {
    marginBottom: theme.spacing.xl * 2,
  },

  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },

  featureText: {
    color: theme.colors.onSurface,
    fontSize: 16,
    marginLeft: theme.spacing.md,
  },

  buttonContainer: {
    marginBottom: theme.spacing.xl,
  },

  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    minHeight: 56,
  },

  primaryButton: {
    backgroundColor: theme.colors.primary,
  },

  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },

  loginButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },

  guestButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },

  footer: {
    alignItems: 'center',
  },

  footerText: {
    color: theme.colors.secondaryText,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
}); 