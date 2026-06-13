const MAX_CONTEXT_CHARS = 9000;

function trimText(value, max = MAX_CONTEXT_CHARS) {
  if (!value || typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

function extractTextFromResponse(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();
  const chunks = [];
  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === 'string') chunks.push(content.text);
      if (typeof content?.value === 'string') chunks.push(content.value);
    }
  }
  return chunks.join('\n').trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'IA não configurada. Adicione OPENAI_API_KEY nas variáveis de ambiente da Vercel.'
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const appTitle = trimText(body.appTitle, 120) || 'SIMM Suite';
    const appSubtitle = trimText(body.appSubtitle, 180);
    const mode = trimText(body.mode, 80) || 'Explicar tela';
    const userQuestion = trimText(body.userQuestion, 1200);
    const pageContext = trimText(body.pageContext, MAX_CONTEXT_CHARS);

    const systemPrompt = `Você é o SIMM AI, camada de inteligência artificial da SIMM Suite.
Responda sempre em português do Brasil, com tom objetivo, clínico e seguro.
Você é uma camada consultiva/educacional: não substitui avaliação médica, protocolo local, dupla checagem, cálculo determinístico do app ou decisão do responsável.
Não invente valores, doses, fórmulas, protocolos, faixas terapêuticas, interpretações não sustentadas pelo contexto visível do app ou condutas específicas.
Não altere cálculos do app. Quando o usuário pedir dose, vazão, prescrição ou conduta, explique que deve usar o valor determinístico exibido no app/protocolo local e ofereça checklist de conferência.
Use apenas o contexto da tela recebido e a pergunta do usuário. Se faltar dado, diga exatamente o que falta.
Formato preferido: resposta curta, com no máximo 5 bullets, e uma frase final de segurança quando envolver decisão clínica.`;

    const userPrompt = `App: ${appTitle}
Subtítulo: ${appSubtitle}
Ação solicitada: ${mode}
Pergunta do usuário: ${userQuestion || '(sem pergunta livre)'}

Contexto visível atual da tela:
${pageContext || '(sem contexto capturado)'}

Tarefa: responda à ação solicitada sem criar conteúdo clínico novo nem modificar cálculos.`;

    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
    const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: 'system',
            content: [{ type: 'input_text', text: systemPrompt }]
          },
          {
            role: 'user',
            content: [{ type: 'input_text', text: userPrompt }]
          }
        ],
        temperature: 0.2,
        max_output_tokens: 900
      })
    });

    const data = await openaiResponse.json();
    if (!openaiResponse.ok) {
      return res.status(openaiResponse.status).json({
        error: data?.error?.message || 'Falha ao chamar a IA.'
      });
    }

    const answer = extractTextFromResponse(data) || 'Não consegui gerar uma resposta útil com o contexto atual.';
    return res.status(200).json({ answer });
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Erro interno ao processar IA.' });
  }
}
