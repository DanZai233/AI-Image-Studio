import { AIModelSettings, Message } from '../types';

export async function fetchImageGeneration(
  settings: AIModelSettings,
  prompt: string
): Promise<string> {
  const { endpoint, apiKey, imageModel } = settings;
  const baseUrl = endpoint.replace(/\/+$/, ''); // Remove trailing slashes
  
  const response = await fetch(`${baseUrl}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: imageModel,
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Image generation failed: ${response.statusText}`);
  }

  const data = await response.json();
  const b64 = data.data[0].b64_json;
  return `data:image/png;base64,${b64}`;
}

export async function* fetchChatCompletionStream(
  settings: AIModelSettings,
  systemPrompt: string,
  messages: any[]
) {
  const { endpoint, apiKey, chatModel } = settings;
  const baseUrl = endpoint.replace(/\/+$/, '');

  const payload = {
    model: chatModel,
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ]
  };

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Chat failed: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // keep the incomplete line in buffer

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6).trim();
        if (dataStr === '[DONE]') return;
        
        try {
          const data = JSON.parse(dataStr);
          const content = data.choices[0]?.delta?.content;
          if (content) {
             yield content;
          }
        } catch (e) {
          // Ignore invalid JSON from stream
        }
      }
    }
  }
}
