import axios from 'axios';
import * as vscode from 'vscode';

interface LLMRequestOptions {
  type: 'autocomplete' | 'comment' | 'refactor' | 'ask';
  content: string;
  temperature?: number;
  max_tokens?: number;
}

const config = vscode.workspace.getConfiguration('localLLM');
const MODEL = config.get<string>('model');
const API_URL = config.get<string>('url') + '/api/chat/completions';
const API_TOKEN = config.get<string>('token');

const systemPrompts: Record<LLMRequestOptions['type'], string> = {
  autocomplete: "You are an intelligent coding assistant. Complete the given code snippet **without explanation** or formatting.",
  comment: "You are an intelligent coding assistant. Add helpful comments to the code snippet without changing the logic.",
  refactor: "You are an intelligent coding assistant. Refactor the given code to be cleaner and more efficient without changing its behavior.",
  ask: "You are a coding expert. Answer the following question in a clear and concise manner.",
};

export async function queryLLM({
  type,
  content,
  temperature = 0.3,
  max_tokens = 100,
}: LLMRequestOptions): Promise<string> {
  try {
    const systemPrompt = systemPrompts[type];

    const payload = {
      model:MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content },
      ],
      temperature,
      max_tokens,
    };

    const headers = {
        Authorization: API_TOKEN ? `Bearer ${API_TOKEN}` : '',
        'Content-Type': 'application/json',
      };

    if(API_URL != undefined && content != undefined){
        
        // ✅ DEBUG LOGGING
        console.log('📡 Axios Request Debug:');
        console.log('➡️ URL:', API_URL);
        console.log('➡️ Headers:', headers);
        console.log('➡️ Payload:', JSON.stringify(payload, null, 2));
        const res = await axios.post(API_URL, payload, { headers });

        return res.data.choices?.[0]?.message?.content?.trim() || '';
    }else{
        return '';
    }

  } catch (err: any) {
    // ✅ Print detailed Axios error response
    if (err.response) {
        console.error('❌ LLM Error Response Status:', err.response.status);
        console.error('❌ LLM Error Response Headers:', err.response.headers);
        console.error('❌ LLM Error Response Data:', JSON.stringify(err.response.data, null, 2));
    } else if (err.request) {
        console.error('❌ No response received from LLM API.');
        console.error(err.request);
    } else {
        console.error('❌ Error setting up request:', err.message);
    }

    vscode.window.showErrorMessage(`LLM Error: ${err.message}`);
    return 'Error: ' + err.message;
  }
}
