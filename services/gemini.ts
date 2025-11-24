import { GoogleGenAI } from "@google/genai";
import { Form, Submission } from '../types';

// Initialize the client only if API key is available
// Note: Em produção, idealmente as chamadas seriam feitas via backend para não expor a chave.
const ENV_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

function getApiKey(): string {
  // Permite sobrescrever a chave via painel do usuário (localStorage)
  if (typeof window === 'undefined') {
    return ENV_API_KEY;
  }
  try {
    const stored = window.localStorage.getItem('geminiApiKey');
    return (stored && stored.trim()) || ENV_API_KEY;
  } catch (err) {
    console.warn('Não foi possível acessar o localStorage para a chave Gemini:', err);
    return ENV_API_KEY;
  }
}

function getClient(): GoogleGenAI | null {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({ apiKey });
  } catch (err) {
    console.error('Erro ao inicializar cliente Gemini:', err);
    return null;
  }
}

const MODEL_NAME = 'gemini-2.5-flash';

export const enhanceLabelWithAI = async (currentLabel: string, context: string = 'general'): Promise<string> => {
  const ai = getClient();
  if (!ai) {
    console.warn("API Key do Gemini não configurada");
    return currentLabel; // Fallback
  }

  try {
    const prompt = `
      Você é um especialista em UX Copywriting e Gamificação brasileiro.
      Reescreva o rótulo do campo de formulário abaixo para ser mais engajador, espirituoso ou conversacional (em Português do Brasil).
      Mantenha curto (máximo 10 palavras).

      Contexto: ${context}
      Rótulo Original: "${currentLabel}"

      Retorne APENAS o texto do novo rótulo.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text ? response.text.trim() : currentLabel;
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return currentLabel;
  }
};

export const generateFormDescription = async (title: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return "Um formulário personalizado criado especialmente para você.";

  try {
    const prompt = `Escreva uma descrição curta, acolhedora e motivadora de 1 frase para um formulário intitulado "${title}". O texto deve ser em Português do Brasil.`;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text ? response.text.trim() : "Por favor, preencha este formulário.";
  } catch (e) {
    return "Por favor, preencha este formulário.";
  }
}

export const generateResponseInsights = async (form: Form, submissions: Submission[]): Promise<string> => {
  const ai = getClient();
  if (!ai) return "API Key não configurada para gerar insights.";
  if (submissions.length === 0) return "Não há dados suficientes para gerar insights.";

  // Simplify data for the prompt to avoid token limits
  const simplifiedData = submissions.map(s => s.answers);
  const questions = form.fields.map(f => `${f.id}: ${f.label} (${f.type})`).join('\n');
  const dataString = JSON.stringify(simplifiedData).substring(0, 10000); // Limit size

  try {
    const prompt = `
            Atue como um Analista de BI (Business Intelligence) Sênior.
            Analise os dados de submissão do formulário abaixo e forneça um relatório executivo curto em Português do Brasil.

            Título do Formulário: ${form.title}

            Perguntas:
            ${questions}

            Respostas (JSON):
            ${dataString}

            Forneça:
            1. Um resumo geral do sentimento (Positivo, Neutro, Negativo).
            2. 3 Principais tendências ou padrões identificados.
            3. Uma recomendação de ação baseada nos dados.

            Use formatação Markdown simples (negrito, listas). Seja direto e profissional.
        `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "Não foi possível gerar insights no momento.";
  } catch (e) {
    console.error("Error generating insights", e);
    return "Erro ao processar insights com IA. Tente novamente mais tarde.";
  }
}