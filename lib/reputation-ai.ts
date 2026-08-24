import 'server-only';
import OpenAI from 'openai';
import type { ReputationItem } from '@/lib/reputation';

function fallbackDraft(item: ReputationItem) {
  const name = item.author && !item.author.startsWith('@') ? `, ${item.author}` : '';
  if (item.priority === 'alta' || item.priority === 'urgente' || item.kind === 'reclamacao') {
    return `Olá${name}. Obrigado por nos contar o que aconteceu. Queremos entender o caso com cuidado e verificar as informações antes de qualquer conclusão. Por favor, fale conosco pelo canal oficial da Pint Services para que a equipe responsável possa localizar o atendimento e retornar com segurança.`;
  }
  if (item.rating && item.rating >= 4) {
    return `Olá${name}. Muito obrigado pela avaliação e pela confiança na Pint Services. Ficamos felizes em saber que sua experiência foi positiva e esperamos receber você novamente quando precisar.`;
  }
  return `Olá${name}. Obrigado pela mensagem. Vamos verificar as informações com a equipe responsável para te orientar corretamente, sem adiantar algo que ainda precise de confirmação.`;
}

export async function generateReputationDraft(item: ReputationItem) {
  // Enquanto o login/RBAC ainda não está na produção principal, o endpoint público
  // usa um rascunho seguro local para evitar consumo indevido da chave da OpenAI.
  if (!process.env.OPENAI_API_KEY || process.env.REPUTATION_AI_DRAFTS_ENABLED !== 'true') {
    return { text: fallbackDraft(item), source: 'fallback' as const };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
    store: false,
    instructions: `Você redige respostas públicas e privadas para a Pint Services, oficina brasileira de funilaria e pintura.
Escreva em português do Brasil, com tom profissional, humano e objetivo.
Nunca invente fatos, status de veículo, culpa, diagnóstico, preço, desconto, prazo, data de entrega, peça recebida ou promessa de solução.
Nunca admita responsabilidade jurídica ou dano sem confirmação humana.
Para reclamações, avaliações de 1 a 3 estrelas, ameaça de processo, preço/prazo, dano ou cliente irritado: reconheça a preocupação, diga que a equipe vai verificar os fatos e convide para o canal oficial. Não discuta publicamente detalhes pessoais.
Para elogios, agradeça sem exagero.
Não use emojis.
No máximo 4 frases. Entregue apenas o texto da resposta.`,
    input: JSON.stringify({
      canal: item.channel,
      tipo: item.kind,
      autor: item.author,
      nota: item.rating,
      prioridade: item.priority,
      mensagem: item.message,
    }),
  });
  const text = response.output_text.trim();
  return { text: text || fallbackDraft(item), source: text ? 'openai' as const : 'fallback' as const };
}
