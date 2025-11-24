
import React, { useState, useEffect } from 'react';
import { FormField, FormTheme } from '../types';
import { Icons } from './Icons';
import { LivePreview } from './LivePreview';

interface PublicFormViewProps {
  formId: string;
}

export const PublicFormView: React.FC<PublicFormViewProps> = ({ formId }) => {
  const [form, setForm] = useState<{ title: string; fields: FormField[]; theme?: FormTheme; logoUrl?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadForm();
  }, [formId]);

  const loadForm = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/forms/${formId}/public`);
      
      if (!response.ok) {
        throw new Error('Formulário não encontrado');
      }

      const data = await response.json();
      setForm(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar formulário');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (answers: Record<string, any>) => {
    try {
      const response = await fetch('http://localhost:3001/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId, answers }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar resposta');
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Submit error:', err);
      alert('Erro ao enviar formulário. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 text-lg">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center space-y-4">
          <Icons.AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Formulário não encontrado</h2>
          <p className="text-slate-400">{error || 'Este formulário não existe ou foi removido.'}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <Icons.Check className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-white">Obrigado!</h2>
          <p className="text-slate-400 text-lg">Sua resposta foi enviada com sucesso.</p>
        </div>
      </div>
    );
  }

  return (
    <LivePreview
      fields={form.fields}
      title={form.title}
      theme={form.theme}
      logoUrl={form.logoUrl}
      onClose={() => {}}
      onSubmit={handleSubmit}
      isUserLoggedIn={false}
    />
  );
};

