/**
 * URL Configuration Utility
 * Manages production and development URLs for different environments
 */

export interface UrlConfig {
  baseUrl: string;
  resetPasswordUrl: string;
  confirmEmailUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * Get the current environment configuration
 */
export const getUrlConfig = (): UrlConfig => {
  const hostname = window.location.hostname;
  const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('localhost');
  const isProduction = !isDevelopment;

  // Production URLs
  const productionBaseUrl = 'https://www.ezcar24.com';
  
  // Development URLs
  const developmentBaseUrl = window.location.origin;

  const baseUrl = isProduction ? productionBaseUrl : developmentBaseUrl;

  return {
    baseUrl,
    resetPasswordUrl: `${baseUrl}/reset-password`,
    confirmEmailUrl: `${baseUrl}/confirm-email`,
    isDevelopment,
    isProduction
  };
};

/**
 * Get the appropriate redirect URL for password reset
 */
export const getPasswordResetUrl = (): string => {
  const config = getUrlConfig();
  return config.resetPasswordUrl;
};

/**
 * Get the appropriate redirect URL for email confirmation
 */
export const getEmailConfirmUrl = (): string => {
  const config = getUrlConfig();
  return config.confirmEmailUrl;
};

/**
 * Get the base URL for the current environment
 */
export const getBaseUrl = (): string => {
  const config = getUrlConfig();
  return config.baseUrl;
};

/**
 * Check if we're in development mode
 */
export const isDevelopmentMode = (): boolean => {
  const config = getUrlConfig();
  return config.isDevelopment;
};

/**
 * Check if we're in production mode
 */
export const isProductionMode = (): boolean => {
  const config = getUrlConfig();
  return config.isProduction;
};

/**
 * Get environment-specific configuration for display
 */
export const getEnvironmentInfo = () => {
  const config = getUrlConfig();
  
  return {
    environment: config.isProduction ? 'Production' : 'Development',
    baseUrl: config.baseUrl,
    resetPasswordUrl: config.resetPasswordUrl,
    confirmEmailUrl: config.confirmEmailUrl,
    hostname: window.location.hostname,
    port: window.location.port,
    protocol: window.location.protocol
  };
};
