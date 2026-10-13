const baseUrl = import.meta.env.VITE_API_URL || "/api";
export async function api(path, options = {}) {
  const token = sessionStorage.getItem("lab_token");
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const data = await response
    .json()
    .catch(() => ({ message: "Unexpected server response" }));
  if (!response.ok) {
    if (response.status === 401 && token) {
      sessionStorage.removeItem("lab_token");
      window.dispatchEvent(new Event("lab:logout"));
    }
    throw new Error(data.message || "Request failed");
  }
  return data;
}
