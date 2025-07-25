export const Environment = {
  isProduction: typeof __IS_PRODUCTION__ !== 'undefined' ? __IS_PRODUCTION__ : false,
  isDevelopment: typeof __IS_PRODUCTION__ !== 'undefined' ? !__IS_PRODUCTION__ : true,
  version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.1.1'
};

export const isProd = () => Environment.isProduction;
export const isDev = () => Environment.isDevelopment;