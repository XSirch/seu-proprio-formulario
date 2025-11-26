
import React, { useState, useEffect } from 'react';
import { FormField, FormTheme, calculateLevel } from '../types';
import { Icons } from './Icons';
import { generateFormDescription } from '../services/gemini';

interface LivePreviewProps {
    fields: FormField[];
    title: string;
    description?: string;
    theme?: FormTheme;
    logoUrl?: string;
    onClose: () => void;
    onSubmit: (answers: Record<string, any>) => void;
    onSignup?: (xp: number) => void;
    isUserLoggedIn?: boolean;
    isPublicView?: boolean;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
    fields,
    title,
    description,
    theme,
    logoUrl,
    onClose,
    onSubmit,
    onSignup,
    isUserLoggedIn = false,
    isPublicView = false
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isCompleted, setIsCompleted] = useState(false);
    const [displayDescription] = useState(description || "Um formulário personalizado criado especialmente para você.");
    const [isStarted, setIsStarted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<number[]>([]); // Stack to track navigation path

    // Gamification States
    const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
    const [xp, setXp] = useState(0);
    const [lastXpGain, setLastXpGain] = useState(0);
    const [showXpGain, setShowXpGain] = useState(false);

    const progress = Math.round(((currentIndex) / fields.length) * 100);

    // Default Theme Fallback
    const currentTheme = theme || {
        backgroundColor: '#0f172a', // slate-900
        primaryColor: '#14b8a6', // teal-500
        textColor: '#ffffff'
    };



    const currentField = fields[currentIndex];

    const validate = (value: any) => {
        if (currentField.required) {
            if (currentField.allowMultiple && Array.isArray(value)) {
                if (value.length === 0) return "Selecione pelo menos uma opção.";
            } else if (!value || (typeof value === 'string' && !value.trim())) {
                return "Esta pergunta é obrigatória para prosseguir.";
            }
        }
        if (currentField.type === 'email' && value && typeof value === 'string') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return "Por favor, insira um e-mail válido.";
            }
        }
        // File extension validation (double check, though input accept handles UI)
        if (currentField.type === 'file' && value && currentField.allowedExtensions && currentField.allowedExtensions.length > 0) {
            const ext = "." + value.split('.').pop()?.toLowerCase();
            // Simple check: checks if any allowed extension matches the end of the filename
            const isValid = currentField.allowedExtensions.some(allowed =>
                value.toLowerCase().endsWith(allowed.toLowerCase())
            );
            if (!isValid) {
                return `Tipo de arquivo inválido. Permitidos: ${currentField.allowedExtensions.join(', ')}`;
            }
        }
        return null;
    };

    // triggerValue allows passing the value immediately (e.g. from a click) 
    // instead of waiting for state update, fixing race conditions in logic
    const handleNext = (triggerValue?: any) => {
        const val = triggerValue !== undefined ? triggerValue : answers[currentField.id];
        const validationError = validate(val);

        if (validationError) {
            setError(validationError);
            return;
        }

        // Check for Logic Rules
        let nextIndex = currentIndex + 1;
        let shouldSubmit = false;

        if (currentField.logicRules && currentField.logicRules.length > 0) {
            // Check if the answer matches any rule
            const matchingRule = currentField.logicRules.find(r => r.conditionValue === val);

            if (matchingRule) {
                if (matchingRule.destinationId === 'SUBMIT') {
                    shouldSubmit = true;
                } else {
                    const targetIndex = fields.findIndex(f => f.id === matchingRule.destinationId);
                    if (targetIndex !== -1) {
                        nextIndex = targetIndex;
                    }
                }
            }
        }

        // Award XP
        const points = 100 + Math.floor(Math.random() * 50);
        setXp(prev => prev + points);
        setLastXpGain(points);
        setShowXpGain(true);
        setTimeout(() => setShowXpGain(false), 800);

        setDirection('forward');

        if (shouldSubmit) {
            setTimeout(() => {
                setIsCompleted(true);
                onSubmit({ ...answers, [currentField.id]: val });
            }, 400);
        } else if (nextIndex < fields.length) {
            // Push current index to history before moving
            setHistory(prev => [...prev, currentIndex]);
            setTimeout(() => setCurrentIndex(nextIndex), 200);
        } else {
            // Default end of form behavior
            setTimeout(() => {
                setIsCompleted(true);
                onSubmit({ ...answers, [currentField.id]: val });
            }, 400);
        }
    };

    const handlePrev = () => {
        setDirection('backward');
        setError(null);

        if (history.length > 0) {
            // Pop last index from history
            const newHistory = [...history];
            const prevIndex = newHistory.pop();
            setHistory(newHistory);
            if (prevIndex !== undefined) {
                setCurrentIndex(prevIndex);
            }
        } else if (currentIndex > 0) {
            // Fallback if history is empty (shouldn't happen in normal flow but good safety)
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleAnswer = (value: any) => {
        setAnswers(prev => ({ ...prev, [currentField.id]: value }));
        if (error) setError(null);
    };

    // Helper to render input based on type
    const renderInput = () => {
        const val = answers[currentField.id] || '';

        switch (currentField.type) {
            case 'text':
            case 'email':
                return (
                    <input
                        type={currentField.type}
                        value={val}
                        onChange={(e) => handleAnswer(e.target.value)}
                        placeholder={currentField.placeholder}
                        className={`w-full text-2xl md:text-4xl bg-transparent border-b-2 ${error ? 'border-red-400 placeholder-red-300/50' : 'border-white/30 placeholder-white/40'} focus:border-white focus:outline-none py-4 transition-all text-center animate-fade-in-up`}
                        style={{ color: currentTheme.textColor }}
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') handleNext(); }}
                    />
                );
            case 'date':
                return (
                    <div className="flex justify-center animate-fade-in-up">
                        <input
                            type="date"
                            value={val}
                            onChange={(e) => handleAnswer(e.target.value)}
                            className={`text-2xl md:text-3xl bg-white/10 border-2 ${error ? 'border-red-400' : 'border-white/20'} rounded-xl focus:border-white focus:outline-none px-6 py-4 transition-all text-center min-w-[300px]`}
                            style={{ color: currentTheme.textColor }}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleNext(); }}
                        />
                    </div>
                );
            case 'file':
                const acceptTypes = currentField.allowedExtensions?.join(',');
                const displayTypes = currentField.allowedExtensions?.map(e => e.replace('.', '').toUpperCase()).join(', ') || "Todos os arquivos";

                return (
                    <div className="flex justify-center animate-fade-in-up">
                        <div className="w-full max-w-md">
                            <label
                                htmlFor={`file-${currentField.id}`}
                                className={`
                            relative flex flex-col items-center justify-center w-full h-48 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300
                            ${val
                                        ? 'bg-white/10 border-current'
                                        : `bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/40 ${error ? 'border-red-400' : ''}`
                                    }
                        `}
                                style={{ borderColor: val ? currentTheme.primaryColor : undefined }}
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    {val ? (
                                        <>
                                            <div
                                                className="w-12 h-12 rounded-full flex items-center justify-center mb-3 text-white animate-bounce-short"
                                                style={{ backgroundColor: currentTheme.primaryColor }}
                                            >
                                                <Icons.Check className="w-6 h-6" />
                                            </div>
                                            <p className="mb-2 text-lg font-medium break-all px-4 text-center" style={{ color: currentTheme.textColor }}>
                                                {val}
                                            </p>
                                            <p className="text-xs opacity-70" style={{ color: currentTheme.textColor }}>Clique para alterar</p>
                                        </>
                                    ) : (
                                        <>
                                            <Icons.Upload className="w-10 h-10 mb-3 opacity-50" style={{ color: currentTheme.textColor }} />
                                            <p className="mb-2 text-sm" style={{ color: currentTheme.textColor }}>
                                                <span className="font-semibold">Clique para enviar</span> ou arraste
                                            </p>
                                            <p className="text-xs opacity-50 text-center px-4" style={{ color: currentTheme.textColor }}>
                                                {displayTypes}
                                            </p>
                                        </>
                                    )}
                                </div>
                                <input
                                    id={`file-${currentField.id}`}
                                    type="file"
                                    className="hidden"
                                    accept={acceptTypes}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            // Validation happens here briefly or in next step
                                            handleAnswer(file.name);
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                );
            case 'textarea':
                return (
                    <textarea
                        value={val}
                        onChange={(e) => handleAnswer(e.target.value)}
                        placeholder={currentField.placeholder}
                        rows={3}
                        className={`w-full text-xl md:text-2xl bg-white/10 rounded-xl border-2 ${error ? 'border-red-400' : 'border-white/10'} placeholder-white/40 focus:border-white focus:bg-white/20 focus:outline-none p-6 transition-all text-center resize-none animate-fade-in-up`}
                        style={{ color: currentTheme.textColor }}
                        autoFocus
                    />
                );
            case 'select':
                const isMulti = currentField.allowMultiple;

                return (
                    <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
                        {currentField.options?.map((opt, idx) => {
                            const isSelected = isMulti
                                ? Array.isArray(val) && val.includes(opt.label)
                                : val === opt.label;

                            return (
                                <button
                                    key={opt.id}
                                    style={{
                                        animationDelay: `${idx * 100}ms`,
                                        animationFillMode: 'backwards',
                                        color: isSelected ? '#fff' : currentTheme.textColor,
                                        backgroundColor: isSelected ? currentTheme.primaryColor : 'rgba(255,255,255,0.1)',
                                        borderColor: isSelected ? currentTheme.primaryColor : 'rgba(255,255,255,0.3)'
                                    }}
                                    onClick={() => {
                                        if (isMulti) {
                                            const prev = Array.isArray(val) ? val : [];
                                            const newVal = prev.includes(opt.label)
                                                ? prev.filter((i: string) => i !== opt.label)
                                                : [...prev, opt.label];
                                            handleAnswer(newVal);
                                        } else {
                                            // For single select, immediately trigger next
                                            handleAnswer(opt.label);
                                        }
                                    }}
                                    className={`p-4 rounded-xl text-xl border-2 transition-all duration-200 text-left flex items-center justify-between group animate-fade-in-up hover:scale-105 shadow-md`}
                                >
                                    <span className="font-medium flex items-center gap-3">
                                        <span
                                            className={`w-8 h-8 ${isMulti ? 'rounded-md' : 'rounded-full'} flex items-center justify-center text-sm font-bold transition-all`}
                                            style={{
                                                backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                                                color: isSelected ? '#fff' : currentTheme.textColor
                                            }}
                                        >
                                            {isMulti
                                                ? (isSelected ? <Icons.Check className="w-5 h-5" /> : null)
                                                : String.fromCharCode(65 + idx)
                                            }
                                        </span>
                                        {opt.label}
                                    </span>
                                    {!isMulti && isSelected && <Icons.Check className="w-6 h-6 animate-scale-in" />}
                                </button>
                            );
                        })}
                        <div className="text-center text-sm opacity-70 mt-2 animate-fade-in-up" style={{ animationDelay: '500ms', color: currentTheme.textColor }}>
                            Selecione a opção e clique em Continuar
                        </div>
                    </div>
                );
            case 'rating':
                return (
                    <div className="flex gap-2 justify-center">
                        {Array.from({ length: currentField.maxRating || 5 }).map((_, i) => (
                            <button
                                key={i}
                                style={{
                                    animationDelay: `${i * 70}ms`,
                                    animationFillMode: 'backwards'
                                }}
                                onClick={() => {
                                    handleAnswer(i + 1);
                                }}
                                className="group relative focus:outline-none transition-transform hover:scale-110 animate-pop"
                            >
                                <Icons.Star
                                    className={`w-12 h-12 md:w-16 md:h-16 transition-all duration-300`}
                                    style={{
                                        color: (val || 0) > i ? currentTheme.primaryColor : 'rgba(255,255,255,0.2)',
                                        filter: (val || 0) > i ? `drop-shadow(0 0 10px ${currentTheme.primaryColor})` : 'none'
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                )
            default:
                return null;
        }
    };

    if (!isStarted) {
        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden w-screen h-screen transition-colors duration-500"
                style={{ backgroundColor: currentTheme.backgroundColor, color: currentTheme.textColor }}
            >
                {/* Ambient Background based on theme */}
                <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[128px]" style={{ backgroundColor: currentTheme.primaryColor }} />
                </div>

                <div className="max-w-2xl w-full text-center space-y-8 animate-fade-in-up relative z-10 flex flex-col items-center">
                    {logoUrl && (
                        <img src={logoUrl} alt="Logo" className="h-24 object-contain mb-4 animate-scale-in" />
                    )}

                    {!logoUrl && (
                        <div className="inline-block p-4 rounded-full bg-white/5 border border-white/10 mb-4 animate-bounce-short">
                            <Icons.Sparkles className="w-12 h-12" style={{ color: currentTheme.primaryColor }} />
                        </div>
                    )}

                    <h1 className="text-5xl md:text-7xl font-display font-bold pb-2" style={{ color: currentTheme.textColor }}>
                        {title}
                    </h1>
                    <p className="text-xl md:text-2xl opacity-80 leading-relaxed font-light max-w-lg mx-auto">
                        {displayDescription}
                    </p>
                    <div className="pt-8">
                        <button
                            onClick={() => setIsStarted(true)}
                            className="group relative inline-flex items-center justify-center px-12 py-5 font-bold transition-all duration-200 font-lg rounded-full hover:scale-105 focus:outline-none hover:shadow-lg"
                            style={{
                                backgroundColor: currentTheme.primaryColor,
                                color: '#fff',
                                boxShadow: `0 0 20px ${currentTheme.primaryColor}40`
                            }}
                        >
                            <span className="text-xl">Iniciar Missão</span>
                            <Icons.ChevronRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {!isPublicView && (
                        <button
                            onClick={onClose}
                            className="block mx-auto text-sm hover:underline mt-8 opacity-60 hover:opacity-100"
                            style={{ color: currentTheme.textColor }}
                        >
                            Sair da Pré-visualização
                        </button>
                    )}
                </div>
            </div>
        )
    }

    if (isCompleted) {
        const level = calculateLevel(xp);

        return (
            <div
                className="fixed top-0 left-0 w-screen h-screen z-[100] flex items-center justify-center animate-fade-in overflow-hidden"
                style={{ backgroundColor: currentTheme.backgroundColor, color: currentTheme.textColor }}
            >
                {/* Confetti-like background effects */}
                <div className="absolute inset-0 opacity-30 pointer-events-none">
                    <div className="absolute top-10 left-20 w-32 h-32 rounded-full blur-[64px]" style={{ backgroundColor: currentTheme.primaryColor }} />
                    <div className="absolute bottom-10 right-20 w-32 h-32 bg-pink-500 rounded-full blur-[64px]" />
                </div>

                <div className="text-center space-y-8 p-8 relative z-10 max-w-lg w-full flex flex-col items-center">
                    {logoUrl && <img src={logoUrl} alt="Logo" className="h-16 object-contain mb-4" />}

                    <div className="relative inline-block">
                        <div className="w-32 h-32 rounded-full flex items-center justify-center mx-auto animate-scale-in" style={{ backgroundColor: currentTheme.primaryColor }}>
                            <Icons.Check className="w-16 h-16 text-white" />
                        </div>
                        <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-yellow-900 border-4 animate-bounce" style={{ borderColor: currentTheme.backgroundColor }}>
                            Nível {level}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-5xl font-bold font-display" style={{ color: currentTheme.textColor }}>Missão Cumprida!</h2>
                        <p className="text-xl opacity-80">Você mandou bem. Obrigado por suas respostas.</p>
                    </div>

                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm w-full">
                        <div className="text-sm opacity-70 uppercase tracking-widest mb-2">Pontuação Total</div>
                        <div className="text-4xl font-mono font-bold text-yellow-400 flex justify-center items-center gap-2">
                            <Icons.Sparkles className="w-6 h-6" /> {xp.toLocaleString()} XP
                        </div>
                        {!isUserLoggedIn && (
                            <div className="mt-4 text-xs text-white/60">
                                Cadastre-se agora para não perder este progresso!
                            </div>
                        )}
                    </div>

                    {!isUserLoggedIn && onSignup ? (
                        <button
                            onClick={() => onSignup(xp)}
                            className="mt-8 px-10 py-4 rounded-full font-bold text-lg transition-transform hover:scale-105 shadow-xl hover:bg-opacity-90 flex items-center gap-2 animate-pulse-ring"
                            style={{ backgroundColor: '#fff', color: currentTheme.primaryColor }}
                        >
                            <Icons.User className="w-5 h-5" />
                            Salvar {xp} XP e Criar Conta
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="mt-8 px-10 py-4 bg-white rounded-full font-bold text-lg transition-transform hover:scale-105 shadow-xl hover:bg-opacity-90"
                            style={{ color: currentTheme.backgroundColor }}
                        >
                            Voltar ao Painel
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col transition-colors duration-500 w-screen h-screen"
            style={{ backgroundColor: currentTheme.backgroundColor, color: currentTheme.textColor }}
        >
            {/* Header */}
            <div className="flex justify-between items-center p-6 relative z-20">
                <div className="flex items-center gap-4">
                    {/* Progress Circle */}
                    <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path className="opacity-20" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                            <path
                                className="transition-all duration-1000 ease-out"
                                strokeDasharray={`${progress}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke={currentTheme.primaryColor}
                                strokeWidth="4"
                            />
                        </svg>
                        <span className="absolute text-[10px] font-bold">{Math.round(progress)}%</span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-xs opacity-60 uppercase tracking-wider font-semibold">Quest {Math.floor(currentIndex / 3) + 1}</span>
                        <span className="text-sm font-bold">Pergunta {currentIndex + 1} / {fields.length}</span>
                    </div>
                </div>

                {logoUrl && (
                    <img src={logoUrl} alt="Logo" className="h-8 md:h-10 object-contain absolute left-1/2 -translate-x-1/2 hidden md:block" />
                )}

                <div className="flex items-center gap-4">
                    {/* XP Counter */}
                    <div className="relative group">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5">
                            <Icons.Sparkles className="w-4 h-4 text-yellow-400" />
                            <span className="font-mono font-bold text-yellow-400">{xp}</span>
                        </div>
                        {showXpGain && (
                            <div className="absolute top-full right-0 mt-2 text-green-400 font-bold animate-fade-in-up whitespace-nowrap">
                                +{lastXpGain} XP
                            </div>
                        )}
                    </div>

                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors opacity-60 hover:opacity-100">
                        <Icons.Text className="w-6 h-6 rotate-45" />
                    </button>
                </div>
            </div>

            {/* Progress Bar (Thin) */}
            <div className="absolute top-0 left-0 w-full h-1 opacity-20 bg-white" />
            <div
                className="absolute top-0 left-0 h-1 transition-all duration-700 ease-out"
                style={{ width: `${progress}%`, backgroundColor: currentTheme.primaryColor, boxShadow: `0 0 10px ${currentTheme.primaryColor}` }}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full relative overflow-hidden">

                {/* Animated Question Container */}
                <div
                    key={currentIndex}
                    className={`w-full space-y-12 ${direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}
                >
                    <div className="space-y-6 text-center">
                        <h2 className="text-3xl md:text-5xl font-display font-bold leading-tight">
                            {currentField.label}
                            {currentField.required && <span className="ml-2 text-3xl align-top" style={{ color: currentTheme.primaryColor }}>*</span>}
                        </h2>
                        {currentField.description && (
                            <p className="text-xl opacity-70 font-light max-w-2xl mx-auto leading-relaxed">{currentField.description}</p>
                        )}
                    </div>

                    <div className="w-full relative z-10">
                        {renderInput()}
                        {error && (
                            <div className="mt-6 text-red-400 font-medium animate-bounce-short flex items-center justify-center gap-2 bg-red-900/20 py-2 px-4 rounded-lg inline-flex mx-auto border border-red-500/30">
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center justify-center gap-4 mt-16">
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className={`p-4 rounded-full border border-white/20 opacity-50 hover:opacity-100 hover:bg-white/10 transition-all ${currentIndex === 0 ? 'opacity-0 pointer-events-none' : ''}`}
                    >
                        <Icons.ChevronRight className="w-6 h-6 rotate-180" />
                    </button>

                    <button
                        onClick={() => handleNext()}
                        className="group px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all flex items-center gap-3 shadow-lg"
                        style={{
                            backgroundColor: currentTheme.primaryColor,
                            color: '#fff',
                            boxShadow: `0 0 20px ${currentTheme.primaryColor}40`
                        }}
                    >
                        <span>{currentIndex === fields.length - 1 ? 'Finalizar' : 'Continuar'}</span>
                        <Icons.ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            <div className="p-6 text-center text-xs opacity-40 font-mono uppercase tracking-widest">
                Powered by SPF
            </div>
        </div>
    );
};
