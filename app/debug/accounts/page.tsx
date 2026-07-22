'use client';

import { useEffect, useState } from 'react';
import { getAccounts } from '@/lib/store';

export default function DebugAccountsPage() {
  const [accounts, setAccounts] = useState<Record<string, any>>({});
  const [copied, setCopied] = useState<string>('');

  useEffect(() => {
    setAccounts(getAccounts());
  }, []);

  const copyToClipboard = (email: string, password: string) => {
    const text = `Email: ${email}\nPassword: ${password}`;
    navigator.clipboard.writeText(text);
    setCopied(email);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🔐 Test Accounts</h1>
        <p className="text-gray-600 mb-8">Tous les comptes créés (stockés en localStorage)</p>

        {Object.keys(accounts).length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500">Aucun compte trouvé.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(accounts).map(([email, account]: [string, any]) => (
              <div key={email} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{account.name}</h2>
                    <p className="text-sm text-gray-500">{account.role}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(account.email, account.password)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      copied === email
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {copied === email ? '✓ Copié' : 'Copier'}
                  </button>
                </div>

                <div className="space-y-2 bg-gray-50 rounded-lg p-4 font-mono text-sm">
                  <div>
                    <span className="text-gray-600">Email: </span>
                    <span className="text-gray-900">{account.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Password: </span>
                    <span className="text-gray-900">{account.password}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">ID: </span>
                    <span className="text-gray-900 text-xs">{account.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
