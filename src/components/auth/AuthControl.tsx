// src/components/auth/AuthControl.tsx
// Small login/logout UI for the sidebar header. Calls /auth/login and stores JWT.

import React, { useState } from 'react';
import api, { setAuthToken, getAuthToken, isAuthenticated } from '@/api/client';

export default function AuthControl() {
  const authed = isAuthenticated();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('guest@example.com');
  const [name, setName] = useState('Guest User');

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<{ access_token: string }>(`/auth/login`, { email, full_name: name });
      setAuthToken(res.access_token);
      setOpen(false);
      window.location.reload();
    } catch (err) {
      alert('Login failed');
    }
  };

  const onLogout = () => {
    setAuthToken(null);
    window.location.reload();
  };

  if (!authed) {
    return (
      <div className="mt-2">
        {open ? (
          <form onSubmit={onLogin} className="p-3 border rounded-md bg-white space-y-2">
            <div className="text-sm font-semibold">Sign In</div>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" className="w-full h-9 px-2 border rounded" />
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="full name" className="w-full h-9 px-2 border rounded" />
            <button className="h-9 px-3 rounded-md bg-black text-white text-sm">Get Token</button>
          </form>
        ) : (
          <button onClick={()=>setOpen(true)} className="w-full h-9 px-3 rounded-md bg-black text-white text-sm">Sign In</button>
        )}
      </div>
    );
  }

  // Logged in view
  return (
    <div className="mt-2 flex items-center gap-2">
      <span className="text-sm text-gray-600">Signed in</span>
      <button onClick={onLogout} className="h-9 px-3 rounded-md border border-black bg-white text-sm hover:bg-gray-50">Logout</button>
    </div>
  );
}
