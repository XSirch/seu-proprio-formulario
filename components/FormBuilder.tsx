
import React, { useState, useRef, useEffect } from 'react';
import { FormField, FieldType, FormTheme, Form, User } from '../types';
import { Icons } from './Icons';
import { FieldEditor } from './FieldEditor';
import { LivePreview } from './LivePreview';

const TOOLBOX_ITEMS: { type: FieldType; label: string; icon: React.FC<any> }[] = [
    { type: 'text', label: 'Texto Curto', icon: Icons.Text },
    { type: 'textarea', label: 'Texto Longo', icon: Icons.List },
    { type: 'select', label: 'Múltipla Escolha', icon: Icons.Check },
    { type: 'rating', label: 'Avaliação', icon: Icons.Star },
    { type: 'email', label: 'E-mail', icon: Icons.Mail },
    { type: 'date', label: 'Data', icon: Icons.Calendar },
    { type: 'file', label: 'Upload de Arquivo', icon: Icons.Upload },
];

interface FormBuilderProps {
    initialFields: FormField[];
    initialTitle: string;
    initialDescription?: string;
    initialTheme?: FormTheme;
    initialLogo?: string;
    formId?: string; // ID do formulário se já foi salvo
    onSave: (title: string, fields: FormField[], theme?: FormTheme, logoUrl?: string, description?: string) => void;
    onBack: () => void;
    onPreviewSubmit: (answers: Record<string, any>) => void;
    onSignup?: (xp: number) => void;
    user: User;
}

// Helper math functions for Bezier curves
interface Point { x: number; y: number; }

const getBezierMidpointAndRotation = (p0: Point, p1: Point, p2: Point, p3: Point) => {
    const t = 0.5; // Middle

    // Calculate Position B(t)
    // (1-t)^3*P0 + 3*(1-t)^2*t*P1 + 3*(1-t)*t^2*P2 + t^3*P3
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    const x = mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x;
    const y = mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y;

    // Calculate Tangent (Derivative) B'(t) to get rotation
    // 3(1-t)^2(P1-P0) + 6(1-t)t(P2-P1) + 3t^2(P3-P2)
    const tx = 3 * mt2 * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t2 * (p3.x - p2.x);
    const ty = 3 * mt2 * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t2 * (p3.y - p2.y);

    const rotation = Math.atan2(ty, tx) * (180 / Math.PI);

    return { x, y, rotation };
};

// Componente interno para visualizar o fluxo
const FlowDiagram: React.FC<{ fields: FormField[] }> = ({ fields }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svgDimensions, setSvgDimensions] = useState({ width: '100%', height: '100%' });
    const [lines, setLines] = useState<{
        d: string;
        color: string;
        dashed?: boolean;
        arrow: { x: number; y: number; rotation: number; }
    }[]>([]);

    const calculateLines = () => {
        if (!containerRef.current) return;

        const newLines: typeof lines = [];
        const containerRect = containerRef.current.getBoundingClientRect();
        const scrollX = containerRef.current.scrollLeft;
        const scrollY = containerRef.current.scrollTop;
        const scrollHeight = containerRef.current.scrollHeight;
        const scrollWidth = containerRef.current.scrollWidth;

        setSvgDimensions({ width: `${scrollWidth}px`, height: `${scrollHeight}px` });

        // Helper to get coordinates relative to container
        const getPos = (id: string, position: 'top' | 'bottom' | 'right' | 'left'): Point | null => {
            const el = document.getElementById(id);
            if (!el) return null;
            const rect = el.getBoundingClientRect();

            // Offset by container scroll and subtract container position to get local coords
            const xOffset = scrollX - containerRect.left;
            const yOffset = scrollY - containerRect.top;

            if (position === 'top') return { x: rect.left + rect.width / 2 + xOffset, y: rect.top + yOffset };
            if (position === 'bottom') return { x: rect.left + rect.width / 2 + xOffset, y: rect.bottom + yOffset };
            if (position === 'right') return { x: rect.right + xOffset, y: rect.top + rect.height / 2 + yOffset };
            if (position === 'left') return { x: rect.left + xOffset, y: rect.top + rect.height / 2 + yOffset };
            return { x: 0, y: 0 };
        };

        fields.forEach((field, index) => {
            const nodeId = `flow-node-${field.id}`;
            const hasLogic = field.logicRules && field.logicRules.length > 0;

            // 1. Default Sequential Flow (Next Question)
            // Only show default flow if there is NO branching logic
            if (index < fields.length - 1 && !hasLogic) {
                const start = getPos(nodeId, 'bottom');
                const end = getPos(`flow-node-${fields[index + 1].id}`, 'top');

                if (start && end) {
                    const p1 = { x: start.x, y: start.y + 40 };
                    const p2 = { x: end.x, y: end.y - 40 };

                    const arrowData = getBezierMidpointAndRotation(start, p1, p2, end);

                    newLines.push({
                        d: `M ${start.x} ${start.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${end.x} ${end.y}`,
                        color: '#475569', // slate-600
                        arrow: arrowData
                    });
                }
            }

            // 2. Conditional Logic (Branching)
            if (hasLogic) {
                field.logicRules?.forEach((rule, ruleIdx) => {
                    let targetId = '';
                    if (rule.destinationId === 'SUBMIT') targetId = 'flow-node-end';
                    else targetId = `flow-node-${rule.destinationId}`;

                    const start = getPos(nodeId, 'right');
                    const end = getPos(targetId, 'right') || getPos(targetId, 'top');

                    if (start && end) {
                        // Generate a color based on rule index
                        const colors = ['#f472b6', '#c084fc', '#22d3ee'];
                        const color = colors[ruleIdx % colors.length];

                        const p1 = { x: start.x + 60, y: start.y };
                        const p2 = { x: end.x + 60, y: end.y };

                        const arrowData = getBezierMidpointAndRotation(start, p1, p2, end);

                        newLines.push({
                            d: `M ${start.x} ${start.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${end.x} ${end.y}`,
                            color: color,
                            dashed: true,
                            arrow: arrowData
                        });
                    }
                });
            }
        });

        setLines(newLines);
    };

    useEffect(() => {
        // Add delay to allow DOM to paint
        const timer = setTimeout(calculateLines, 100);
        window.addEventListener('resize', calculateLines);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', calculateLines);
        }
    }, [fields]);

    return (
        <div ref={containerRef} className="w-full h-full bg-slate-950 relative overflow-auto custom-scrollbar p-10 flex justify-center">
            {/* SVG Layer */}
            <svg
                className="absolute top-0 left-0 pointer-events-none z-0"
                style={{ width: svgDimensions.width, height: svgDimensions.height }}
            >
                {lines.map((line, i) => (
                    <React.Fragment key={i}>
                        {/* The Line */}
                        <path
                            d={line.d}
                            stroke={line.color}
                            strokeWidth="2"
                            fill="none"
                            strokeDasharray={line.dashed ? "5,5" : ""}
                        />
                        {/* The Arrow Head in the Middle */}
                        <g transform={`translate(${line.arrow.x}, ${line.arrow.y}) rotate(${line.arrow.rotation})`}>
                            <polygon
                                points="-6,-5 6,0 -6,5"
                                fill={line.color}
                                stroke={line.color}
                                strokeWidth="1"
                            />
                        </g>
                    </React.Fragment>
                ))}
            </svg>

            {/* Nodes Container - Centered Column */}
            <div className="flex flex-col items-center gap-16 relative z-10 w-full max-w-md">

                {/* Start Node */}
                <div className="px-6 py-2 bg-green-900/50 border border-green-500/50 rounded-full text-green-400 text-xs font-bold uppercase tracking-widest shadow-lg shadow-green-900/20">
                    Início
                </div>

                {fields.map((field, index) => (
                    <div
                        key={field.id}
                        id={`flow-node-${field.id}`}
                        className="w-full bg-slate-900 rounded-xl border border-slate-700 p-4 shadow-lg relative group hover:border-brand-500 transition-colors z-10"
                    >
                        {/* Sequence Number */}
                        <div className="absolute -left-3 -top-3 w-6 h-6 bg-slate-800 rounded-full border border-slate-600 flex items-center justify-center text-xs font-mono text-slate-400 z-20">
                            {index + 1}
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                                {field.type === 'select' ? <Icons.List className="w-4 h-4" /> :
                                    field.type === 'rating' ? <Icons.Star className="w-4 h-4" /> :
                                        field.type === 'file' ? <Icons.Upload className="w-4 h-4" /> :
                                            field.type === 'date' ? <Icons.Calendar className="w-4 h-4" /> :
                                                <Icons.Text className="w-4 h-4" />}
                            </div>
                            <div>
                                <p className="font-bold text-slate-200 text-sm line-clamp-1">{field.label}</p>
                                <p className="text-xs text-slate-500 capitalize">{field.type}</p>
                            </div>
                        </div>

                        {/* Logic Indicators */}
                        {field.logicRules && field.logicRules.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-800 space-y-1">
                                {field.logicRules.map((rule, rIdx) => (
                                    <div key={rIdx} className="flex items-center justify-between text-xs">
                                        <span className="text-slate-400">Se "{rule.conditionValue}"</span>
                                        <span className="text-brand-400 flex items-center gap-1">
                                            <Icons.ArrowRight className="w-3 h-3" />
                                            {rule.destinationId === 'SUBMIT' ? 'Fim' : `Q${fields.findIndex(f => f.id === rule.destinationId) + 1}`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {/* End Node */}
                <div id="flow-node-end" className="px-6 py-2 bg-red-900/50 border border-red-500/50 rounded-full text-red-400 text-xs font-bold uppercase tracking-widest shadow-lg shadow-red-900/20">
                    Fim
                </div>
            </div>
        </div>
    );
};

interface SavedPreset {
    name: string;
    theme: FormTheme;
}

const THEME_PRESETS: SavedPreset[] = [
    { name: 'Padrão', theme: { backgroundColor: '#0f172a', primaryColor: '#14b8a6', textColor: '#ffffff' } }, // slate-900, teal-500
    { name: 'Oceano', theme: { backgroundColor: '#0c4a6e', primaryColor: '#38bdf8', textColor: '#f0f9ff' } }, // sky-900, sky-400
    { name: 'Floresta', theme: { backgroundColor: '#14532d', primaryColor: '#4ade80', textColor: '#f0fdf4' } }, // green-900, green-400
    { name: 'Meia-noite', theme: { backgroundColor: '#000000', primaryColor: '#6366f1', textColor: '#e0e7ff' } }, // black, indigo-500
    { name: 'Romance', theme: { backgroundColor: '#4c0519', primaryColor: '#fb7185', textColor: '#fff1f2' } }, // rose-950, rose-400
];

export const FormBuilder: React.FC<FormBuilderProps> = ({
    initialFields,
    initialTitle,
    initialDescription,
    initialTheme,
    initialLogo,
    formId,
    onSave,
    onBack,
    onPreviewSubmit,
    onSignup,
    user
}) => {
    const [fields, setFields] = useState<FormField[]>(initialFields);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [formTitle, setFormTitle] = useState(initialTitle);
    const [formDescription, setFormDescription] = useState(initialDescription || '');
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [viewMode, setViewMode] = useState<'editor' | 'flow' | 'design'>('editor');
    const [copiedLink, setCopiedLink] = useState(false);

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dropIndex, setDropIndex] = useState<number | null>(null);

    // Design State
    const [theme, setTheme] = useState<FormTheme>(initialTheme || THEME_PRESETS[0].theme);

    const handleCopyLink = () => {
        if (!formId) return;
        const url = `${window.location.origin}/form/${formId}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        });
    };
    const [logoUrl, setLogoUrl] = useState<string | undefined>(initialLogo);

    // Custom Preset State
    const [customPresets, setCustomPresets] = useState<SavedPreset[]>([]);
    const [newPresetName, setNewPresetName] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('formflow_custom_presets');
        if (saved) {
            try {
                setCustomPresets(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load custom presets");
            }
        }
    }, []);

    const handleAddField = (type: FieldType) => {
        const newField: FormField = {
            id: Date.now().toString(),
            type,
            label: type === 'rating' ? 'Avalie sua experiência' :
                type === 'file' ? 'Anexe um arquivo' :
                    type === 'date' ? 'Selecione uma data' :
                        'Nova Pergunta',
            placeholder: type === 'email' ? 'exemplo@email.com' : 'Digite aqui...',
            required: false,
            options: type === 'select' ? [{ id: '1', label: 'Opção 1' }, { id: '2', label: 'Opção 2' }] : undefined,
            allowedExtensions: type === 'file' ? [] : undefined,
        };
        setFields([...fields, newField]);
        setSelectedFieldId(newField.id);
    };

    const updateField = (id: string, updates: Partial<FormField>) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const deleteField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
        if (selectedFieldId === id) setSelectedFieldId(null);
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null) return;
        if (draggedIndex === index) {
            setDropIndex(null);
            return;
        }
        setDropIndex(index);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (draggedIndex === null || dropIndex === null || draggedIndex === dropIndex) {
            handleDragEnd();
            return;
        }

        const newFields = [...fields];
        const [movedItem] = newFields.splice(draggedIndex, 1);
        newFields.splice(dropIndex, 0, movedItem);

        setFields(newFields);
        handleDragEnd();
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDropIndex(null);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSavePreset = () => {
        if (!newPresetName.trim()) return;

        const newPreset: SavedPreset = {
            name: newPresetName,
            theme: { ...theme }
        };

        const updatedPresets = [...customPresets, newPreset];
        setCustomPresets(updatedPresets);
        localStorage.setItem('formflow_custom_presets', JSON.stringify(updatedPresets));
        setNewPresetName('');
    };

    const allPresets = [...THEME_PRESETS, ...customPresets];

    return (
        <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans">
            {/* Header */}
            <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <Icons.ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                    <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-brand-900/20">
                        <Icons.Sparkles className="w-5 h-5" />
                    </div>
                    <input
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="text-lg font-bold font-display text-slate-100 bg-transparent hover:bg-slate-800 focus:bg-slate-800 px-2 py-1 rounded outline-none border border-transparent focus:border-slate-700 transition-all"
                    />
                </div>

                {/* Mode Toggles */}
                <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex">
                    <button
                        onClick={() => setViewMode('editor')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-all ${viewMode === 'editor' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Icons.List className="w-4 h-4" /> Editor
                    </button>
                    <button
                        onClick={() => setViewMode('flow')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-all ${viewMode === 'flow' ? 'bg-brand-900/30 text-brand-400 border border-brand-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Icons.Workflow className="w-4 h-4" /> Fluxo
                    </button>
                    <button
                        onClick={() => setViewMode('design')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-all ${viewMode === 'design' ? 'bg-purple-900/30 text-purple-400 border border-purple-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Icons.Palette className="w-4 h-4" /> Design
                    </button>
                </div>

                <div className="flex gap-3">
                    {formId && (
                        <button
                            onClick={handleCopyLink}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all hover:shadow-lg text-sm font-medium"
                            title="Compartilhar formulário"
                        >
                            {copiedLink ? (
                                <>
                                    <Icons.Check className="w-4 h-4 text-green-400" />
                                    <span className="text-green-400">Copiado!</span>
                                </>
                            ) : (
                                <>
                                    <Icons.Link className="w-4 h-4" />
                                    Compartilhar
                                </>
                            )}
                        </button>
                    )}
                    <button
                        onClick={() => setIsPreviewMode(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all hover:shadow-lg text-sm font-medium"
                    >
                        <Icons.Play className="w-4 h-4" />
                        Visualizar
                    </button>
                    <button
                        onClick={() => onSave(formTitle, fields, theme, logoUrl, formDescription)}
                        className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-500 transition-all text-sm font-medium shadow-brand-500/20 shadow-lg border border-brand-500/50"
                    >
                        Salvar
                    </button>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left Sidebar: Toolbox (Only visible in Editor Mode) */}
                {viewMode === 'editor' && (
                    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-0">
                        <div className="p-4 border-b border-slate-800">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Elementos</h3>
                        </div>
                        <div className="p-4 space-y-2 overflow-y-auto">
                            {TOOLBOX_ITEMS.map((item) => (
                                <button
                                    key={item.type}
                                    onClick={() => handleAddField(item.type)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:border-brand-500 hover:bg-slate-800 hover:text-brand-400 hover:shadow-md transition-all group text-left"
                                >
                                    <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-brand-900/30 text-slate-400 group-hover:text-brand-400 transition-colors">
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium text-sm">{item.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-auto p-4 bg-slate-950 border-t border-slate-800">
                            <p className="text-xs text-slate-500 text-center leading-relaxed">
                                Arraste os campos no canvas para reordenar. <br /> Clique para editar.
                            </p>
                        </div>
                    </aside>
                )}

                {/* Center Content */}
                <main
                    className={`flex-1 bg-slate-950 overflow-hidden flex flex-col relative ${viewMode === 'design' ? 'items-center' : ''}`}
                >
                    {viewMode === 'editor' ? (
                        <div
                            className="flex-1 overflow-y-auto p-8 flex justify-center custom-scrollbar"
                            onDragOver={(e) => e.preventDefault()}
                        >
                            <div className="w-full max-w-2xl space-y-4 pb-20">

                                {fields.length === 0 && (
                                    <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
                                        <p className="text-slate-500">Seu formulário está vazio. Adicione campos da esquerda!</p>
                                    </div>
                                )}

                                {fields.map((field, index) => (
                                    <div
                                        key={field.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDrop={handleDrop}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => setSelectedFieldId(field.id)}
                                        className={`group relative bg-slate-900 rounded-xl border-2 transition-all cursor-pointer
                            ${selectedFieldId === field.id
                                                ? 'border-brand-500 shadow-lg shadow-black/20 ring-1 ring-brand-500/50 z-10'
                                                : 'border-transparent shadow-sm hover:border-slate-700 hover:shadow-md'
                                            }
                            ${draggedIndex === index ? 'opacity-40' : 'opacity-100'}
                            `}
                                    >
                                        {draggedIndex !== null && dropIndex === index && draggedIndex !== index && (
                                            <div className={`absolute left-0 right-0 h-1 bg-brand-400 rounded-full shadow-[0_0_10px_rgba(45,212,191,0.8)] z-50 pointer-events-none transition-all duration-300
                                    ${draggedIndex < index ? '-bottom-2.5' : '-top-2.5'}
                                `} />
                                        )}

                                        <div className="p-6 flex gap-4">
                                            <div className="mt-1 text-slate-600 cursor-grab active:cursor-grabbing hover:text-slate-400 transition-colors">
                                                <Icons.GripVertical className="w-5 h-5" />
                                            </div>

                                            <div className="flex-1 space-y-3 pointer-events-none">
                                                <div className="flex justify-between items-center">
                                                    <label className="block text-lg font-medium text-slate-200">
                                                        {field.label}
                                                        {field.required && <span className="text-brand-500 ml-1">*</span>}
                                                    </label>
                                                    {field.logicRules && field.logicRules.length > 0 && (
                                                        <div className="flex items-center gap-1 text-xs text-brand-400 bg-brand-900/20 px-2 py-1 rounded">
                                                            <Icons.GitBranch className="w-3 h-3" />
                                                            <span>Fluxo Dinâmico</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {field.description && <p className="text-sm text-slate-400">{field.description}</p>}

                                                <div className="opacity-80">
                                                    {field.type === 'text' && <div className="h-10 bg-slate-800 rounded-lg border border-slate-700 w-full" />}
                                                    {field.type === 'textarea' && <div className="h-24 bg-slate-800 rounded-lg border border-slate-700 w-full" />}
                                                    {field.type === 'email' && (
                                                        <div className="h-10 bg-slate-800 rounded-lg border border-slate-700 w-full flex items-center px-3 gap-3">
                                                            <Icons.Mail className="w-5 h-5 text-slate-500" />
                                                            <span className="text-slate-500 text-sm italic">{field.placeholder || 'exemplo@email.com'}</span>
                                                        </div>
                                                    )}
                                                    {field.type === 'date' && (
                                                        <div className="h-10 bg-slate-800 rounded-lg border border-slate-700 w-48 flex items-center px-3 gap-3">
                                                            <Icons.Calendar className="w-5 h-5 text-slate-500" />
                                                            <span className="text-slate-500 text-sm">DD/MM/AAAA</span>
                                                        </div>
                                                    )}
                                                    {field.type === 'file' && (
                                                        <div className="h-24 bg-slate-800 rounded-lg border-2 border-dashed border-slate-700 w-full flex flex-col items-center justify-center gap-2 relative overflow-hidden">
                                                            <Icons.Upload className="w-6 h-6 text-slate-500" />
                                                            <span className="text-slate-500 text-xs">Área de Upload de Arquivo</span>
                                                            {field.allowedExtensions && field.allowedExtensions.length > 0 && (
                                                                <div className="absolute bottom-2 flex gap-1">
                                                                    {field.allowedExtensions.slice(0, 3).map((ext, i) => (
                                                                        <span key={i} className="text-[9px] px-1 bg-slate-700 rounded text-slate-300">{ext.replace('.', '').toUpperCase()}</span>
                                                                    ))}
                                                                    {field.allowedExtensions.length > 3 && <span className="text-[9px] text-slate-500">...</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {field.type === 'select' && (
                                                        <div className="space-y-2">
                                                            {field.options?.map(opt => (
                                                                <div key={opt.id} className="flex items-center gap-2">
                                                                    <div className={`w-4 h-4 border border-slate-600 bg-slate-800 ${field.allowMultiple ? 'rounded-sm' : 'rounded-full'}`} />
                                                                    <span className="text-slate-400">{opt.label}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {field.type === 'rating' && (
                                                        <div className="flex gap-2">
                                                            {[1, 2, 3, 4, 5].slice(0, field.maxRating || 5).map(i => (
                                                                <Icons.Star key={i} className="w-8 h-8 text-slate-700" />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <div className="h-12"></div>
                            </div>
                        </div>
                    ) : viewMode === 'flow' ? (
                        <FlowDiagram fields={fields} />
                    ) : (
                        // Design Mode
                        <div className="w-full max-w-4xl p-8 overflow-y-auto custom-scrollbar flex gap-8">
                            {/* Design Controls */}
                            <div className="w-1/3 space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Icons.Palette className="w-6 h-6 text-purple-400" /> Personalização
                                    </h3>
                                    <p className="text-slate-400 text-sm">Defina as cores e identidade visual do seu formulário.</p>
                                </div>

                                {/* Logo Upload */}
                                <div className="space-y-3 bg-slate-900 p-5 rounded-xl border border-slate-800">
                                    <label className="block text-sm font-bold text-white mb-2">Logotipo da Empresa</label>
                                    <div className="flex items-center gap-4">
                                        {logoUrl ? (
                                            <div className="relative w-20 h-20 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center overflow-hidden">
                                                <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                                                <button
                                                    onClick={() => setLogoUrl(undefined)}
                                                    className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg hover:bg-red-600"
                                                >
                                                    <Icons.Trash className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-20 h-20 bg-slate-800 rounded-lg border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-500">
                                                <Icons.Upload className="w-6 h-6" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <label className="cursor-pointer inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700">
                                                Carregar Imagem
                                                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                            </label>
                                            <p className="text-xs text-slate-500 mt-2">Recomendado: PNG transparente</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Description */}
                                <div className="space-y-3 bg-slate-900 p-5 rounded-xl border border-slate-800">
                                    <label className="block text-sm font-bold text-white mb-2">Descrição do Formulário</label>
                                    <textarea
                                        value={formDescription}
                                        onChange={(e) => setFormDescription(e.target.value)}
                                        placeholder="Um formulário personalizado criado especialmente para você."
                                        rows={3}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
                                    />
                                    <p className="text-xs text-slate-500">Texto exibido na tela inicial do formulário</p>
                                </div>

                                {/* Color Presets */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-bold text-white">Temas Prontos</label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {allPresets.map(preset => (
                                            <button
                                                key={preset.name}
                                                onClick={() => setTheme(preset.theme)}
                                                className="w-full aspect-square rounded-full border-2 border-slate-700 hover:scale-110 transition-transform focus:ring-2 ring-offset-2 ring-offset-slate-950 ring-white relative group"
                                                style={{ backgroundColor: preset.theme.backgroundColor }}
                                                title={preset.name}
                                            >
                                                <span className="block w-1/2 h-1/2 rounded-full mx-auto mt-[25%]" style={{ backgroundColor: preset.theme.primaryColor }} />

                                                {/* Tooltip for custom names */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                                                    {preset.name}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Custom Colors */}
                                <div className="space-y-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
                                    <label className="block text-sm font-bold text-white border-b border-slate-800 pb-2">Cores Personalizadas</label>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-300">Cor de Fundo</span>
                                        <input
                                            type="color"
                                            value={theme.backgroundColor}
                                            onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                                            className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-300">Cor Primária (Botões/Destaques)</span>
                                        <input
                                            type="color"
                                            value={theme.primaryColor}
                                            onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                                            className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-300">Cor do Texto</span>
                                        <input
                                            type="color"
                                            value={theme.textColor}
                                            onChange={(e) => setTheme({ ...theme, textColor: e.target.value })}
                                            className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                                        />
                                    </div>

                                    {/* Save Custom Theme */}
                                    <div className="pt-4 border-t border-slate-800 flex gap-2">
                                        <input
                                            type="text"
                                            value={newPresetName}
                                            onChange={(e) => setNewPresetName(e.target.value)}
                                            placeholder="Nome do tema..."
                                            className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                                        />
                                        <button
                                            onClick={handleSavePreset}
                                            disabled={!newPresetName.trim()}
                                            className="px-3 py-1.5 bg-slate-700 hover:bg-brand-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Salvar
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Mini Preview */}
                            <div className="flex-1 flex flex-col items-center justify-center bg-black/20 rounded-2xl border border-slate-800 p-8 relative overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                                    <span className="text-9xl font-bold">PREVIEW</span>
                                </div>

                                {/* Mock Phone/Card */}
                                <div
                                    className="w-full max-w-sm aspect-[9/16] rounded-[2.5rem] shadow-2xl border-8 border-slate-900 overflow-hidden relative flex flex-col"
                                    style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}
                                >
                                    {/* Header */}
                                    <div className="p-6 pt-10 flex items-center justify-between">
                                        <div className="w-8 h-8 rounded-full" style={{ border: `2px solid ${theme.textColor}`, opacity: 0.3 }} />
                                        {logoUrl && <img src={logoUrl} alt="Logo" className="h-8 object-contain" />}
                                    </div>

                                    {/* Progress */}
                                    <div className="px-6">
                                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full w-1/3" style={{ backgroundColor: theme.primaryColor }} />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-6 flex flex-col justify-center gap-6">
                                        <h3 className="text-2xl font-bold text-center">Como você avalia nosso serviço?</h3>
                                        <div className="flex justify-center gap-2">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <Icons.Star key={i} className="w-6 h-6" style={{ color: i <= 3 ? theme.primaryColor : 'rgba(255,255,255,0.2)' }} />
                                            ))}
                                        </div>
                                        <button
                                            className="w-full py-3 rounded-full font-bold shadow-lg mt-4"
                                            style={{ backgroundColor: theme.primaryColor, color: theme.backgroundColor === '#ffffff' || theme.backgroundColor === '#f0fdf4' || theme.backgroundColor === '#f0f9ff' || theme.backgroundColor === '#fff1f2' ? '#fff' : theme.textColor }}
                                        >
                                            Continuar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* Right Sidebar: Properties (Only visible in Editor Mode) */}
                {viewMode === 'editor' && (
                    <aside className="w-80 bg-slate-900 border-l border-slate-800 z-0">
                        {selectedFieldId ? (
                            <FieldEditor
                                field={fields.find(f => f.id === selectedFieldId)!}
                                allFields={fields}
                                onUpdate={updateField}
                                onDelete={deleteField}
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                    <Icons.Sparkles className="w-6 h-6 text-slate-400" />
                                </div>
                                <p>Selecione um campo no canvas para editar suas propriedades ou aprimorá-lo com IA.</p>
                            </div>
                        )}
                    </aside>
                )}
            </div>

            {/* Full Screen Preview Modal */}
            {isPreviewMode && (
                <LivePreview
                    fields={fields}
                    title={formTitle}
                    description={formDescription}
                    theme={theme}
                    logoUrl={logoUrl}
                    onClose={() => setIsPreviewMode(false)}
                    onSubmit={(answers) => {
                        onPreviewSubmit(answers);
                    }}
                    onSignup={onSignup}
                    isUserLoggedIn={!!user}
                />
            )}
        </div>
    );
};
