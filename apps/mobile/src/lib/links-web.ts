/** The public website, for pages the app links out to (Valley Ride Capital, full terms). */
export const WEB_URL = (__DEV__ ? process.env.EXPO_PUBLIC_WEB_URL || 'http://localhost:3000' : 'https://valleyride.in').replace(/\/+$/, '');
