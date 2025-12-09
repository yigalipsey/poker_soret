'use client';

import { login } from '@/app/actions';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';

export default function LoginPage() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError('');

        const res = await login(formData);

        if (res.success) {
            router.push('/admin');
            router.refresh();
        } else {
            setError('שם משתמש או סיסמה שגויים');
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-slate-800 rounded-full text-amber-500">
                        <Lock size={32} />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-center mb-8 text-slate-200">כניסה למנהלים</h1>

                <form action={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">שם משתמש</label>
                        <input
                            name="name"
                            type="text"
                            required
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">סיסמה</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition"
                        />
                    </div>

                    {error && (
                        <div className="text-rose-500 text-sm text-center bg-rose-500/10 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <button
                        disabled={loading}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-bold text-lg transition flex justify-center items-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin w-5 h-5" />}
                        כניסה
                    </button>
                </form>
            </div>
        </div>
    );
}
