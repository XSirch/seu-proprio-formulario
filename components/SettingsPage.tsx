import React from 'react';
import { User } from '../types';
import { Icons } from './Icons';
import { getAuthToken } from '../services/api';

interface SettingsPageProps {
  user: User;
  onBack: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ user, onBack }) => {
  const [geminiApiKey, setGeminiApiKey] = React.useState('');
  const [isSavingGeminiKey, setIsSavingGeminiKey] = React.useState(false);
  const [geminiKeySaved, setGeminiKeySaved] = React.useState(false);
  const [hasGeminiKey, setHasGeminiKey] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    fetch('http://localhost:3001/api/user/settings/gemini', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load Gemini settings');
        return res.json();
      })
      .then((data) => {
        setHasGeminiKey(!!data.hasGeminiKey);
      })
      .catch((err) => {
        console.error('Erro ao carregar status da chave Gemini:', err);
      });
  }, []);

  const handleSaveGeminiKey = async () => {
    try {
      setIsSavingGeminiKey(true);
      const token = getAuthToken();
      if (!token) {
        console.error('Usuário não autenticado');
        return;
      }

      const value = geminiApiKey.trim();
      if (!value) {
        console.error('Chave Gemini vazia');
        setIsSavingGeminiKey(false);
        return;
      }

      const res = await fetch('http://localhost:3001/api/user/settings/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ geminiApiKey: value }),
      });

      if (!res.ok) {
        throw new Error('Falha ao salvar chave Gemini');
      }

      setGeminiKeySaved(true);
      setHasGeminiKey(true);
      setTimeout(() => setGeminiKeySaved(false), 2000);
    } catch (err) {
      console.error('Erro ao salvar chave Gemini:', err);
    } finally {
      setIsSavingGeminiKey(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-slate-200 text-sm hover:bg-slate-700"
          >
            <Icons.ArrowRight className="w-4 h-4 rotate-180" />
            Voltar para o painel
          </button>

          <div className="flex items-center gap-3 text-right">
            <div className="hidden md:block">
              <p className="text-white font-medium text-sm">{user.name}</p>
              <p className="text-slate-500 text-xs">{user.email}</p>
            </div>
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center border border-slate-600 text-slate-300 overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <Icons.User className="w-5 h-5" />
              )}
            </div>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Configurações da Conta</h1>
          <p className="text-slate-400 text-sm">Gerencie as configurações da sua conta e da integração com IA.</p>
        </div>

        {/* Gemini API Key Config */}
        <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
              <Icons.Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Configuração da IA (Gemini)</h3>
              <p className="text-xs text-slate-400">
                Informe sua chave da API Gemini para habilitar melhorias de rótulos, descrições e insights de BI.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="password"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="GEMINI_API_KEY..."
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/70"
            />
            <button
              onClick={handleSaveGeminiKey}
              disabled={isSavingGeminiKey}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium hover:from-purple-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {geminiKeySaved ? 'Salvo!' : isSavingGeminiKey ? 'Salvando...' : 'Salvar chave'}
            </button>
          </div>
          {hasGeminiKey === false && (
            <p className="text-[11px] text-amber-400 flex items-center gap-1">
              <Icons.AlertCircle className="w-3 h-3" />
              Sem chave configurada, os recursos de IA usam apenas o texto padrão.
            </p>
          )}
          {hasGeminiKey === true && (
            <p className="text-[11px] text-emerald-400 flex items-center gap-1">
              <Icons.Check className="w-3 h-3" />
              Chave configurada! Recursos de IA estão ativos para sua conta.
            </p>
          )}
        </div>

        {/* Placeholder para outras configurações futuras */}
        <div className="p-4 bg-slate-900 rounded-2xl border border-dashed border-slate-700 text-slate-500 text-sm">
          Outras configurações da conta poderão ser adicionadas aqui futuramente.
        </div>
      </div>
    </div>
  );
};

