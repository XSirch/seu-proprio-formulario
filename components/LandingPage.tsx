import React from 'react';
import { Icons } from './Icons';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      
      {/* Navbar */}
      <nav className="flex items-center justify-between p-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                <Icons.Sparkles className="w-6 h-6" />
            </div>
            <span className="text-xl font-display font-bold">SPF</span>
        </div>
        <div className="flex items-center gap-4">
            <button 
                onClick={onLogin}
                className="text-slate-300 hover:text-white font-medium transition-colors"
            >
                Entrar
            </button>
            <button 
                onClick={onStart}
                className="px-5 py-2.5 bg-white text-slate-900 rounded-lg font-bold hover:bg-slate-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
                Criar Conta
            </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 md:py-24 relative">
        
        {/* Abstract Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] animate-pulse-ring" />
            <div className="absolute bottom-[-10%] right-[20%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono text-brand-400 mb-4">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                NOVA GERAÇÃO DE FORMULÁRIOS
            </div>
            
            <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight tracking-tight">
                Crie formulários <br/>
                <span className="text-white">Mágicos com IA</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Transforme pesquisas entediantes em conversas interativas. Utilize inteligência artificial para gerar insights poderosos e aumente suas taxas de resposta com gamificação.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                <button 
                    onClick={onStart}
                    className="group relative px-8 py-4 bg-gradient-to-r from-brand-600 to-indigo-600 rounded-xl font-bold text-lg text-white shadow-xl shadow-brand-900/40 hover:scale-105 transition-transform overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="relative flex items-center gap-2">
                        Começar Gratuitamente <Icons.Rocket className="w-5 h-5" />
                    </span>
                </button>
            </div>

            {/* Feature Pills */}
            <div className="pt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto text-left">
                <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400 mb-4">
                        <Icons.Brain className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-white mb-2">IA Integrada</h3>
                    <p className="text-sm text-slate-300">Geração automática de relatórios de BI e sugestões de melhoria para suas perguntas.</p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 mb-4">
                        <Icons.Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-white mb-2">Gamificação</h3>
                    <p className="text-sm text-slate-300">Aumente o engajamento com XP, barras de progresso e animações fluidas.</p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400 mb-4">
                        <Icons.BarChart className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-white mb-2">Insights Reais</h3>
                    <p className="text-sm text-slate-300">Dashboards automáticos que transformam dados brutos em decisões estratégicas.</p>
                </div>
            </div>
        </div>
      </main>

      <footer className="py-8 text-center text-slate-500 text-sm border-t border-slate-900 bg-slate-950 z-10">
        &copy; {new Date().getFullYear()} SPF - Seu Próprio Formulário. Todos os direitos reservados.
      </footer>
    </div>
  );
};