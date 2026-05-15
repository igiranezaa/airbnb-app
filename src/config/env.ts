const LOCAL_API_URL = 'http://localhost:3000/api/v1';
const RENDER_API_URL = 'https://airbnb-api-prisma.onrender.com/api/v1';

const isDev = import.meta.env.DEV as boolean;

export const config = {
  apiUrl: (import.meta.env.VITE_API_URL as string | undefined) || (isDev ? LOCAL_API_URL : RENDER_API_URL),
  isDev,
  isProd: import.meta.env.PROD as boolean,
} as const;
