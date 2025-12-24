import OpenAI from 'openai';

// Inicializa o cliente OpenAI
// IMPORTANTE: Em produção, você NÃO deve usar a chave API no frontend.
// As chamadas devem ser feitas através do seu backend (Node.js/Python) para proteger a chave.
export const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true // Habilita uso no navegador (apenas para desenvolvimento)
});
