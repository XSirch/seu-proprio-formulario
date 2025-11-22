
import React from 'react';
import { Form, User, getXpProgress } from '../types';
import { Icons } from './Icons';

interface HomePageProps {
  forms: Form[];
  user: User;
  onCreateForm: () => void;
  onEditForm: (form: Form) => void;
  onViewResponses: (form: Form) => void;
  onDeleteForm: (id: string) => void;
  onLogout: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ 
  forms, 
  user,
  onCreateForm, 
  onEditForm, 
  onViewResponses, 
  onDeleteForm,
  onLogout
}) => {
  return (
    <div className="min-h-screen bg-slate-950 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <Icons.Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-white">FormFlow AI</h1>
                <p className="text-slate-400 text-sm">Painel de Controle</p>
              </div>
          </div>

          <div className="flex items-center gap-6">
              {/* User Stats (Level & XP) */}
              <div className="hidden md:flex flex-col items-end gap-1">
                   <div className="flex items-center gap-2">
                       <span className="text-yellow-400 font-bold text-sm flex items-center gap-1">
                           <Icons.Sparkles className="w-3 h-3" /> {user.xp} XP
                       </span>
                       <span className="text-slate-500 text-xs">|</span>
                       <span className="text-white font-bold text-sm">Nível {user.level}</span>
                   </div>
                   <div className="w-32 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                       <div 
                            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500" 
                            style={{ width: `${getXpProgress(user.xp)}%` }}
                       />
                   </div>
              </div>

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
              <div className="h-8 w-px bg-slate-700 mx-2 hidden md:block"></div>
              <button 
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Sair"
              >
                  <Icons.LogOut className="w-5 h-5" />
              </button>
          </div>
        </div>

        <div className="flex justify-between items-end">
             <h2 className="text-2xl font-bold text-white">Visão Geral</h2>
             <button
                onClick={onCreateForm}
                className="group flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-bold shadow-lg shadow-white/5 transition-all hover:scale-105 hover:bg-slate-200"
              >
                <Icons.Plus className="w-5 h-5" />
                Criar Novo
              </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
                        <Icons.List className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-medium">Total de Formulários</p>
                        <p className="text-2xl font-bold text-white">{forms.length}</p>
                    </div>
                </div>
            </div>
            <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
                        <Icons.Check className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-medium">Total de Respostas</p>
                        <p className="text-2xl font-bold text-white">
                            {forms.reduce((acc, form) => acc + form.responseCount, 0)}
                        </p>
                    </div>
                </div>
            </div>
             <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-lg">
                        <Icons.Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm font-medium">Taxa de Conclusão</p>
                        <p className="text-2xl font-bold text-white">94%</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Forms Grid */}
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-300 uppercase text-xs tracking-wider">Seus Projetos</h3>
            
            {forms.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icons.Text className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-300">Nenhum formulário ainda</h3>
                    <p className="text-slate-500 mb-6">Crie seu primeiro formulário interativo para começar.</p>
                    <button onClick={onCreateForm} className="text-brand-400 hover:text-brand-300 font-medium">Criar Formulário &rarr;</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {forms.map(form => (
                        <div key={form.id} className="group bg-slate-900 rounded-xl border border-slate-800 hover:border-brand-500/50 transition-all hover:shadow-xl hover:shadow-brand-900/10 flex flex-col overflow-hidden">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-brand-400 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                                        <Icons.Text className="w-5 h-5" />
                                    </div>
                                    <div className="relative">
                                         <button onClick={() => onDeleteForm(form.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors" title="Excluir Formulário">
                                            <Icons.Trash className="w-4 h-4" />
                                         </button>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{form.title}</h3>
                                <p className="text-sm text-slate-400">Criado: {new Date(form.createdAt).toLocaleDateString('pt-BR')}</p>
                                <div className="mt-4 flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-950/50 p-2 rounded border border-slate-800">
                                    <span>ID: {form.id.slice(0, 8)}...</span>
                                    <span className="w-1 h-1 bg-slate-600 rounded-full" />
                                    <span>{form.fields.length} Campos</span>
                                </div>
                            </div>
                            
                            <div className="bg-slate-950 p-4 border-t border-slate-800 grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => onEditForm(form)}
                                    className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-sm font-medium transition-colors"
                                >
                                    Editar
                                </button>
                                <button 
                                    onClick={() => onViewResponses(form)}
                                    className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/50 hover:text-indigo-200 text-sm font-medium transition-colors border border-indigo-900/50"
                                >
                                    {form.responseCount} Respostas
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
