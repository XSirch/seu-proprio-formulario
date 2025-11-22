
import React, { useState } from 'react';
import { Icons } from './Icons';

interface AuthPageProps {
  type: 'login' | 'signup';
  onAuthSuccess: (user: { name: string; email: string }) => void;
  onSwitchMode: (mode: 'login' | 'signup') => void;
  onBack: () => void;
  pendingXp?: number;
}

export const AuthPage: React.FC<AuthPageProps> = ({ type, onAuthSuccess, onSwitchMode, onBack, pendingXp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock Authentication Delay
    setTimeout(() => {
        setIsLoading(false);
        onAuthSuccess({
            name: name || (email.split('@')[0]),
            email: email
        });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px]" />
        </div>

        <button onClick={onBack} className="absolute top-8 left-8 text-slate-400 hover:text-white flex items-center gap-2 transition-colors z-20">
            <Icons.ChevronRight className="w-5 h-5 rotate-180" /> Voltar
        </button>

        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10 animate-scale-in">
            
            {/* Bonus XP Banner */}
            {pendingXp && pendingXp > 0 && type === 'signup' && (
                <div className="mb-6 bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4 flex items-center gap-3 animate-bounce-short">
                    <div className="p-2 bg-yellow-500 rounded-full text-yellow-900">
                        <Icons.Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-yellow-400 font-bold text-sm">Parabéns! Missão Cumprida.</p>
                        <p className="text-yellow-200 text-xs">Crie sua conta para resgatar seus <span className="font-bold">{pendingXp} XP</span>.</p>
                    </div>
                </div>
            )}

            <div className="text-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg mx-auto mb-4">
                    <Icons.Sparkles className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold text-white font-display">
                    {type === 'login' ? 'Bem-vindo de volta!' : 'Crie sua conta'}
                </h2>
                <p className="text-slate-400 mt-2 text-sm">
                    {type === 'login' ? 'Entre para gerenciar seus formulários.' : 'Comece a criar formulários mágicos hoje.'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {type === 'signup' && (
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
                        <div className="relative">
                            <Icons.User className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder-slate-600"
                                placeholder="Seu nome"
                                required
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">E-mail</label>
                    <div className="relative">
                        <Icons.Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder-slate-600"
                            placeholder="seu@email.com"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Senha</label>
                    <div className="relative">
                        <Icons.Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder-slate-600"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 mt-6 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-brand-900/20 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processando...
                        </>
                    ) : (
                        type === 'login' ? 'Entrar na Plataforma' : (pendingXp && pendingXp > 0 ? `Criar Conta e Ganhar ${pendingXp} XP` : 'Criar Conta Grátis')
                    )}
                </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-800 text-center">
                <p className="text-sm text-slate-400">
                    {type === 'login' ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}
                    <button 
                        onClick={() => onSwitchMode(type === 'login' ? 'signup' : 'login')}
                        className="ml-2 text-brand-400 hover:text-brand-300 font-bold hover:underline"
                    >
                        {type === 'login' ? 'Cadastre-se' : 'Fazer Login'}
                    </button>
                </p>
            </div>
        </div>
    </div>
  );
};
