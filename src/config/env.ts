export const config = {
  apiUrl: import.meta.env.VITE_API_URL as string | undefined,
  isDev: import.meta.env.DEV as boolean,
  isProd: import.meta.env.PROD as boolean,
} as const;
