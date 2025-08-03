// src/lib/profile.ts
export async function upsertProfile(token: string, fullName: string) {
  const res = await fetch('http://localhost:4000/api/profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fullName }),
  });
  if (!res.ok) throw new Error('Failed to save profile');
}

export async function fetchProfile(token: string) {
  const res = await fetch('http://localhost:4000/api/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Profile API ${res.status}: ${text}`);
  }
  return res.json();
}
