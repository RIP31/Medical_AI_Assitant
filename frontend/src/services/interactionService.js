export const fetchInteractions = async (medications) => {
  const response = await fetch('/api/interactions/check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ meds: medications })
  });

  const rawBody = await response.text();
  let data = null;

  if (rawBody) {
    try {
      data = JSON.parse(rawBody);
    } catch (error) {
      data = null;
    }
  }

  if (!data) {
    const status = response.ok ? 'Unexpected response' : `Request failed (${response.status})`;
    throw new Error(`${status}. Make sure the backend is running and reachable.`);
  }

  if (!response.ok) {
    throw new Error(data?.message || 'Unable to fetch interaction data.');
  }

  return data;
};
