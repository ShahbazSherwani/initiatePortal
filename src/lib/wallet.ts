// src/lib/wallet.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export async function getWalletBalance(token: string): Promise<number> {
    const res = await fetch(`${API_BASE_URL}/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return parseFloat(data.balance);
  }
  
  export async function topUpWallet(token: string, amount: number) {
    await fetch(`${API_BASE_URL}/wallet/topup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    });
  }
  
  export async function withdrawWallet(token: string, amount: number) {
    await fetch(`${API_BASE_URL}/wallet/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    });
  }
  