import { StyleSheet } from 'react-native';

export const theme = {
  colors: {
    // Dark theme colors matching Google Keep
    background: '#202124',
    surface: '#303134',
    surfaceVariant: '#404246',
    primary: '#8ab4f8',
    onPrimary: '#1a1c1e',
    secondary: '#81c995',
    onSecondary: '#1a1c1e',
    onSurface: '#e8eaed',
    onSurfaceVariant: '#bdc1c6',
    outline: '#5f6368',
    searchBackground: '#303134',
    cardBackground: '#303134',
    fabBackground: '#8ab4f8',
    menuBackground: '#303134',
    divider: '#5f6368',
    headerText: '#e8eaed',
    bodyText: '#e8eaed',
    secondaryText: '#9aa0a6',
    placeholderText: '#5f6368',
    success: '#81c995',
    warning: '#fdd663',
    error: '#f28b82',
  },
  
  // Light theme colors for comparison
  lightColors: {
    background: '#ffffff',
    surface: '#ffffff',
    surfaceVariant: '#f1f3f4',
    primary: '#1a73e8',
    onPrimary: '#ffffff',
    secondary: '#34a853',
    onSecondary: '#ffffff',
    onSurface: '#3c4043',
    onSurfaceVariant: '#5f6368',
    outline: '#dadce0',
    searchBackground: '#f1f3f4',
    cardBackground: '#ffffff',
    fabBackground: '#1a73e8',
    menuBackground: '#ffffff',
    divider: '#e8eaed',
    headerText: '#3c4043',
    bodyText: '#3c4043',
    secondaryText: '#5f6368',
    placeholderText: '#9aa0a6',
    success: '#34a853',
    warning: '#fbbc04',
    error: '#ea4335',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 50,
  },

  typography: {
    h1: {
      fontSize: 28,
      fontWeight: '600' as const,
      lineHeight: 34,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 30,
    },
    h3: {
      fontSize: 20,
      fontWeight: '500' as const,
      lineHeight: 26,
    },
    body1: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 22,
    },
    body2: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
    button: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 20,
    },
  },

  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  shadow: {
    ...theme.shadows.md,
  },
});

export default theme; 