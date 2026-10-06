// How often every subscribed calendar is re-downloaded.
export const REFRESH_MINUTES = 5

// Subscribed calendars. Feed URLs are NOT stored here: each one is read from the
// CAL_<ID>_URL variable in .env.local (e.g. CAL_HABS_URL) and served by the Vite
// proxy at /feeds/<id>, so the URL never reaches the browser and CORS doesn't apply.
// `name` is optional: the feed's X-WR-CALNAME is used when omitted.
export const CALENDARS = [
  { id: 'habs', name: 'Canadiens de Montréal', color: '#d6203a' },
  { id: 'oilers', name: "Oilers d'Edmonton", color: '#2f6fdb' },
]

export const feedEnvVar = (id) => `CAL_${id.toUpperCase()}_URL`
export const feedPath = (id) => `/feeds/${id}`
