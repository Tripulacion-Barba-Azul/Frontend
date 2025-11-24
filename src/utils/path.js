// path.js
export const URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
export const wsURL =
  import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000/ws";
