// src/lib/wallet.ts
export async function getWalletBalance(token: string): Promise<number> {
    const res = await fetch('/api/wallet', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return parseFloat(data.balance);
  }
  
  export async function topUpWallet(token: string, amount: number) {
    await fetch('/api/wallet/topup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    });
  }
  
  export async function withdrawWallet(token: string, amount: number) {
    await fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    });
  }
  