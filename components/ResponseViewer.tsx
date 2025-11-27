
import React, { useState } from 'react';
import { Form, Submission, FormField } from '../types';
import { Icons } from './Icons';
import { generateResponseInsights } from '../services/gemini';

interface ResponseViewerProps {
    form: Form;
    submissions: Submission[];
    onBack: () => void;
}

export const ResponseViewer: React.FC<ResponseViewerProps> = ({ form, submissions, onBack }) => {
    const [activeTab, setActiveTab] = useState<'table' | 'bi'>('table');
    const [aiReport, setAiReport] = useState<string | null>(null);
    const [loadingAi, setLoadingAi] = useState(false);

    const handleGenerateInsights = async () => {
        setLoadingAi(true);
        const report = await generateResponseInsights(form, submissions);
        setAiReport(report);
        setLoadingAi(false);
    };

    const renderVisualizations = () => {
        return (
            <div className="space-y-8 animate-fade-in-up">

                {/* AI Insights Section */}
                <div className="bg-slate-900 rounded-xl border border-indigo-500/30 p-6 shadow-lg shadow-indigo-900/20">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                <Icons.Brain className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Inteligência Artificial de Negócios</h3>
                        </div>
                        {!aiReport && (
                            <button
                                onClick={handleGenerateInsights}
                                disabled={loadingAi}
                                className={`px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:shadow-lg transition-all ${loadingAi ? 'opacity-70 cursor-wait' : 'hover:scale-105'}`}
                            >
                                {loadingAi ? (
                                    <><Icons.Sparkles className="w-4 h-4 animate-spin" /> Analisando...</>
                                ) : (
                                    <><Icons.Sparkles className="w-4 h-4" /> Gerar Insights</>
                                )}
                            </button>
                        )}
                    </div>

                    {aiReport ? (
                        <div className="prose prose-invert prose-sm max-w-none bg-slate-950/50 p-6 rounded-lg border border-slate-800">
                            <div className="whitespace-pre-wrap leading-relaxed text-slate-300">
                                {aiReport}
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
                                <button onClick={() => setAiReport(null)} className="text-xs text-slate-500 hover:text-white">Gerar Novamente</button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-slate-500 text-sm italic">
                            Clique no botão para usar a IA e descobrir padrões ocultos, análise de sentimento e recomendações estratégicas baseadas nas respostas.
                        </div>
                    )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {form.fields.map(field => {
                        // Logic to aggregate data based on type
                        if (field.type === 'select' || field.type === 'rating') {
                            const counts: Record<string, number> = {};
                            let total = 0;
                            let sum = 0;

                            submissions.forEach(sub => {
                                const val = sub.answers[field.id];
                                if (val !== undefined && val !== null && val !== '') {
                                    if (Array.isArray(val)) {
                                        val.forEach(v => {
                                            counts[v] = (counts[v] || 0) + 1;
                                            total++;
                                        });
                                    } else {
                                        counts[val] = (counts[val] || 0) + 1;
                                        total++;
                                        if (typeof val === 'number') sum += val;
                                    }
                                }
                            });

                            return (
                                <div key={field.id} className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                                    <h4 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
                                        {field.type === 'rating' ? <Icons.Star className="w-4 h-4 text-yellow-500" /> : <Icons.BarChart className="w-4 h-4 text-brand-500" />}
                                        {field.label}
                                    </h4>

                                    {field.type === 'rating' && total > 0 && (
                                        <div className="flex items-end gap-2 mb-6">
                                            <span className="text-5xl font-display font-bold text-white">{(sum / total).toFixed(1)}</span>
                                            <span className="text-slate-500 mb-2">/ {field.maxRating || 5} média</span>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        {field.type === 'select' && field.options ? (
                                            field.options.map(opt => {
                                                const count = counts[opt.label] || 0;
                                                const percent = total > 0 ? (count / total) * 100 : 0;
                                                return (
                                                    <div key={opt.id}>
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span className="text-slate-400">{opt.label}</span>
                                                            <span className="text-slate-300 font-mono">{count} ({Math.round(percent)}%)</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-brand-500 rounded-full transition-all duration-1000"
                                                                style={{ width: `${percent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            /* Dynamic visualization for rating or ad-hoc values */
                                            Object.entries(counts).map(([key, count]) => {
                                                const percent = total > 0 ? (count / total) * 100 : 0;
                                                return (
                                                    <div key={key}>
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span className="text-slate-400">{field.type === 'rating' ? `${key} Estrelas` : key}</span>
                                                            <span className="text-slate-300 font-mono">{count} ({Math.round(percent)}%)</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                                                style={{ width: `${percent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        } else if (field.type === 'text' || field.type === 'textarea') {
                            // Qualitative sample
                            const recentAnswers = submissions
                                .map(s => s.answers[field.id])
                                .filter(a => a)
                                .slice(0, 3);

                            return (
                                <div key={field.id} className="bg-slate-900 rounded-xl border border-slate-800 p-6 flex flex-col">
                                    <h4 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
                                        <Icons.Text className="w-4 h-4 text-slate-400" />
                                        {field.label}
                                    </h4>
                                    <div className="space-y-3 flex-1">
                                        {recentAnswers.length > 0 ? (
                                            recentAnswers.map((ans, idx) => (
                                                <div key={idx} className="p-3 bg-slate-950 rounded border border-slate-800 text-sm text-slate-300 italic">
                                                    "{String(ans).slice(0, 100)}{String(ans).length > 100 ? '...' : ''}"
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-slate-600 text-sm">Sem respostas textuais.</div>
                                        )}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-800 text-center">
                                        <span className="text-xs text-brand-400">Use o botão de IA para analisar estes textos</span>
                                    </div>
                                </div>
                            )
                        }
                        return null;
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-950 p-8 font-sans flex flex-col h-screen">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                        <Icons.ChevronRight className="w-6 h-6 rotate-180" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{form.title}</h1>
                        <p className="text-slate-400 text-sm">Visualizando {submissions.length} respostas</p>
                    </div>
                </div>

                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 self-start md:self-auto">
                    <button
                        onClick={() => setActiveTab('table')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'table' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Icons.List className="w-4 h-4" />
                        Dados
                    </button>
                    <button
                        onClick={() => setActiveTab('bi')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'bi' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Icons.BarChart className="w-4 h-4" />
                        Insights (BI)
                    </button>
                </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {submissions.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-slate-900 rounded-xl border border-slate-800">
                        <Icons.List className="w-12 h-12 mb-4 opacity-50" />
                        <p>Nenhuma resposta enviada ainda para gerar visualizações.</p>
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto custom-scrollbar pr-2">
                        {activeTab === 'bi' ? (
                            renderVisualizations()
                        ) : (
                            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-bold sticky top-0 z-10">
                                            <tr>
                                                <th className="p-4 border-b border-slate-800 w-48 bg-slate-950">Enviado em</th>
                                                {form.fields.map(field => (
                                                    <th key={field.id} className="p-4 border-b border-slate-800 min-w-[200px] bg-slate-950">
                                                        {field.label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                                            {submissions.map(sub => (
                                                <tr key={sub.id} className="hover:bg-slate-800/50 transition-colors">
                                                    <td className="p-4 whitespace-nowrap text-slate-500">
                                                        {new Date(sub.submittedAt).toLocaleString('pt-BR')}
                                                    </td>
                                                    {form.fields.map(field => {
                                                        const answer = sub.answers[field.id];
                                                        const handleDownloadFile = async (url: string, fileName: string) => {
                                                            try {
                                                                const response = await fetch(url);
                                                                const blob = await response.blob();

                                                                const link = document.createElement('a');
                                                                link.href = window.URL.createObjectURL(blob);
                                                                link.download = fileName;
                                                                document.body.appendChild(link);
                                                                link.click();
                                                                link.remove();
                                                            } catch (err) {
                                                                console.error(err);
                                                                alert('Erro ao baixar arquivo');
                                                            }
                                                        };
                                                        return (
                                                            <td key={field.id} className="p-4">
                                                                {field.type === 'file' && answer ? (
                                                                    (() => {
                                                                        const file = answer as { url: string; originalName?: string; filename?: string };

                                                                        const url =
                                                                            typeof answer === 'string'
                                                                                ? answer
                                                                                : file.url;

                                                                        const fileName =
                                                                            file.originalName || file.filename || 'arquivo';

                                                                        return (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDownloadFile(url, fileName)}
                                                                                className="text-brand-400 hover:text-brand-300 underline flex items-center gap-1"
                                                                            >
                                                                                <Icons.Download className="w-4 h-4" />
                                                                                Baixar
                                                                            </button>
                                                                        );
                                                                    })()
                                                            ) : Array.isArray(answer)
                                                                    ? answer.join(', ')
                                                                    : String(answer || '-')}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};