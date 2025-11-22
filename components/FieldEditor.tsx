import React, { useState } from 'react';
import { FormField, LogicRule } from '../types';
import { Icons } from './Icons';
import { enhanceLabelWithAI } from '../services/gemini';

interface FieldEditorProps {
  field: FormField;
  allFields: FormField[];
  onUpdate: (id: string, updates: Partial<FormField>) => void;
  onDelete: (id: string) => void;
}

const COMMON_EXTENSIONS = [
  { label: 'PDF', value: '.pdf' },
  { label: 'Imagens (JPG/PNG)', value: '.jpg,.jpeg,.png' },
  { label: 'Word (DOCX)', value: '.docx,.doc' },
  { label: 'Excel (XLSX)', value: '.xlsx,.xls' },
  { label: 'PowerPoint (PPTX)', value: '.pptx' },
  { label: 'Texto (TXT)', value: '.txt' },
  { label: 'Zip', value: '.zip' },
];

export const FieldEditor: React.FC<FieldEditorProps> = ({ field, allFields, onUpdate, onDelete }) => {
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleAiEnhance = async () => {
    setIsEnhancing(true);
    const newLabel = await enhanceLabelWithAI(field.label);
    onUpdate(field.id, { label: newLabel });
    setIsEnhancing(false);
  };

  const handleLogicUpdate = (optionLabel: string, destinationId: string) => {
    const currentRules = field.logicRules || [];
    const otherRules = currentRules.filter(r => r.conditionValue !== optionLabel);
    
    if (destinationId === 'default') {
        onUpdate(field.id, { logicRules: otherRules });
    } else {
        onUpdate(field.id, { 
            logicRules: [...otherRules, { conditionValue: optionLabel, destinationId }] 
        });
    }
  };

  const getDestinationForOption = (label: string) => {
      return field.logicRules?.find(r => r.conditionValue === label)?.destinationId || 'default';
  };

  const handleExtensionToggle = (extValue: string) => {
    const currentExtensions = field.allowedExtensions || [];
    // Check if this group of extensions is already in the array.
    // Note: We are simplifying by checking if the first part of the value exists
    const firstExt = extValue.split(',')[0];
    const exists = currentExtensions.some(e => e.includes(firstExt));

    let newExtensions: string[];
    if (exists) {
        // Remove
        newExtensions = currentExtensions.filter(e => !extValue.includes(e));
    } else {
        // Add (split by comma and add individual exts)
        const extsToAdd = extValue.split(',');
        newExtensions = [...currentExtensions, ...extsToAdd];
    }
    onUpdate(field.id, { allowedExtensions: newExtensions });
  };

  const isExtensionSelected = (extValue: string) => {
      const firstExt = extValue.split(',')[0];
      return field.allowedExtensions?.some(e => e.includes(firstExt));
  };

  return (
    <div className="p-6 bg-slate-900 h-full flex flex-col gap-6 overflow-y-auto shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h3 className="font-display font-bold text-lg text-slate-200">Editar Campo</h3>
        <button 
          onClick={() => onDelete(field.id)}
          className="text-red-400 hover:bg-red-900/20 p-2 rounded-lg transition-colors"
          title="Excluir Campo"
        >
          <Icons.Trash className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Label Input with AI */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-400">Pergunta / Rótulo</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={field.label}
              onChange={(e) => onUpdate(field.id, { label: e.target.value })}
              className="flex-1 p-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none placeholder-slate-500"
            />
            <button
              onClick={handleAiEnhance}
              disabled={isEnhancing}
              className={`p-2 rounded-lg text-white transition-all ${
                isEnhancing ? 'bg-slate-700 cursor-wait' : 'bg-gradient-to-br from-purple-600 to-indigo-600 hover:shadow-lg hover:scale-105'
              }`}
              title="Deixar divertido com IA"
            >
              <Icons.Sparkles className={`w-5 h-5 ${isEnhancing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-xs text-slate-500">Clique na estrela para a IA tornar sua pergunta mais engajadora.</p>
        </div>

        {/* Description */}
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-400">Descrição (Subtítulo)</label>
            <input
                type="text"
                value={field.description || ''}
                onChange={(e) => onUpdate(field.id, { description: e.target.value })}
                className="w-full p-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none placeholder-slate-500"
                placeholder="Texto de ajuda opcional"
            />
        </div>

        {/* Placeholder */}
        {(field.type === 'text' || field.type === 'textarea' || field.type === 'email') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-400">Texto de Exemplo (Placeholder)</label>
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => onUpdate(field.id, { placeholder: e.target.value })}
              className="w-full p-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none placeholder-slate-500"
            />
          </div>
        )}

        {/* Options for Select */}
        {field.type === 'select' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-400">Opções</label>
            <div className="space-y-2">
              {field.options?.map((opt, idx) => (
                <div key={opt.id} className="flex gap-2">
                  <input
                    type="text"
                    value={opt.label}
                    onChange={(e) => {
                      const newOptions = [...(field.options || [])];
                      newOptions[idx] = { ...newOptions[idx], label: e.target.value };
                      onUpdate(field.id, { options: newOptions });
                    }}
                    className="flex-1 p-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                  <button 
                    onClick={() => {
                        const newOptions = field.options?.filter(o => o.id !== opt.id);
                        onUpdate(field.id, { options: newOptions });
                    }}
                    className="text-slate-500 hover:text-red-400"
                  >
                    <Icons.Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newOption = { id: Date.now().toString(), label: 'Nova Opção' };
                  onUpdate(field.id, { options: [...(field.options || []), newOption] });
                }}
                className="text-sm text-brand-400 font-medium hover:text-brand-300 hover:underline flex items-center gap-1"
              >
                <Icons.Plus className="w-4 h-4" /> Adicionar Opção
              </button>
            </div>
          </div>
        )}

        {/* File Extensions Config */}
        {field.type === 'file' && (
            <div className="space-y-3 border-t border-slate-800 pt-4">
                <div className="flex items-center gap-2">
                    <Icons.Upload className="w-4 h-4 text-brand-500" />
                    <label className="block text-sm font-bold text-slate-300">Extensões Permitidas</label>
                </div>
                <p className="text-xs text-slate-500">Selecione quais tipos de arquivo o usuário pode enviar.</p>
                
                <div className="flex flex-wrap gap-2">
                    {COMMON_EXTENSIONS.map((ext) => {
                        const isSelected = isExtensionSelected(ext.value);
                        return (
                            <button
                                key={ext.label}
                                onClick={() => handleExtensionToggle(ext.value)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                                    isSelected 
                                    ? 'bg-brand-900/50 border-brand-500 text-brand-200' 
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                }`}
                            >
                                {ext.label}
                            </button>
                        )
                    })}
                </div>
                {(!field.allowedExtensions || field.allowedExtensions.length === 0) && (
                     <p className="text-xs text-yellow-500/70 italic">Se nenhum for selecionado, todos os tipos serão aceitos.</p>
                )}
            </div>
        )}

        {/* Conditional Logic Section (Only for Select) */}
        {field.type === 'select' && !field.allowMultiple && (
            <div className="space-y-3 border-t border-slate-800 pt-4">
                <div className="flex items-center gap-2">
                    <Icons.GitBranch className="w-4 h-4 text-brand-500" />
                    <label className="block text-sm font-bold text-slate-300">Lógica de Fluxo</label>
                </div>
                <p className="text-xs text-slate-500">Direcione o usuário para perguntas diferentes com base na resposta.</p>
                
                <div className="space-y-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    {field.options?.map(opt => (
                        <div key={opt.id} className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span className="w-1.5 h-1.5 bg-slate-600 rounded-full"></span>
                                Se responder <span className="text-white font-medium">"{opt.label}"</span>, ir para:
                            </div>
                            <select 
                                value={getDestinationForOption(opt.label)}
                                onChange={(e) => handleLogicUpdate(opt.label, e.target.value)}
                                className="w-full p-2 text-xs bg-slate-900 border border-slate-700 text-slate-300 rounded hover:border-slate-600 focus:border-brand-500 outline-none"
                            >
                                <option value="default">Próxima Pergunta (Padrão)</option>
                                <option value="SUBMIT">Enviar Formulário (Finalizar)</option>
                                <optgroup label="Perguntas Específicas">
                                    {allFields
                                        .filter(f => f.id !== field.id)
                                        .map(f => (
                                            <option key={f.id} value={f.id}>
                                                {f.type === 'rating' ? '★ ' : ''} {f.label.substring(0, 25)}{f.label.length > 25 ? '...' : ''}
                                            </option>
                                        ))
                                    }
                                </optgroup>
                            </select>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Rating Max */}
        {field.type === 'rating' && (
            <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-400">Máximo de Estrelas</label>
                <select 
                    value={field.maxRating || 5}
                    onChange={(e) => onUpdate(field.id, { maxRating: parseInt(e.target.value) })}
                    className="w-full p-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                >
                    <option value="3">3 Estrelas</option>
                    <option value="5">5 Estrelas</option>
                    <option value="10">10 Estrelas</option>
                </select>
            </div>
        )}
        
        {/* Allow Multiple Toggle (Select only) */}
        {field.type === 'select' && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-300">Múltipla Escolha</span>
                    <span className="text-xs text-slate-500">Permitir selecionar várias opções</span>
                </div>
                <button
                    role="switch"
                    aria-checked={field.allowMultiple}
                    onClick={() => onUpdate(field.id, { allowMultiple: !field.allowMultiple })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                    field.allowMultiple ? 'bg-brand-500' : 'bg-slate-700'
                    }`}
                >
                    <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        field.allowMultiple ? 'translate-x-6' : 'translate-x-1'
                    }`}
                    />
                </button>
            </div>
        )}

        {/* Required Toggle */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-300">Campo Obrigatório</span>
            <span className="text-xs text-slate-500">Impede envio se vazio</span>
          </div>
          <button
            role="switch"
            aria-checked={field.required}
            onClick={() => onUpdate(field.id, { required: !field.required })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
              field.required ? 'bg-brand-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                field.required ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};