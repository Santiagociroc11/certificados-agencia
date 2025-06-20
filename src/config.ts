function getBaseUrl() {
    if (import.meta.env.VITE_API_BASE_URL) {
        let url = import.meta.env.VITE_API_BASE_URL;
        // remove trailing slash
        if (url.endsWith('/')) {
            return url.slice(0, -1);
        }
        return url;
    }
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    return 'http://localhost:3001';
}

export const BASE_URL = getBaseUrl();
export const API_URL = `${BASE_URL}/api`; 