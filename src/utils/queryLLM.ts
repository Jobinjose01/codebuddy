import axios from 'axios';
import * as vscode from 'vscode';
import { parseLLMResponseProviderLevel, preparePayloadProviderLevel } from './providerLevelHandler';
import { payloadDTO } from '../dto/payloadDTO';

interface LLMRequestOptions {
  type: 'autocomplete' | 'comment' | 'refactor' | 'ask';
  content: string;
  temperature?: number;
  max_tokens?: number;
}


const systemPrompts: Record<LLMRequestOptions['type'], string> = {
  autocomplete: `You are an intelligent code completion engine. Given a partial line of code, return only the most likely code completion for the current programming language. 
Respond with raw code only, with no explanation, comments, or extra formatting. Do not include code blocks, markdown, or descriptions.
Always infer the programming language based on the given code snippet and return an accurate continuation.
`,
  comment: `You are an intelligent coding assistant. Add concise inline comments to the following code to explain what it does.
Do not modify the logic, structure, or formatting.
Do not include any explanations, markdown formatting, or text outside the code.
Just return the raw code with comments.`,
  refactor: `You are an intelligent coding assistant. Refactor the given code to be cleaner and more efficient without changing its behavior.
Return only the refactored code without any explanations, comments, or code block formatting.`,
  ask: "You are a coding expert. Answer the following question in a clear and concise manner.",
};

export async function queryLLM({
  type,
  content,
  temperature = 0.3,
  max_tokens = 500,
}: LLMRequestOptions): Promise<string> {
  try {
    const systemPrompt = systemPrompts[type];

    const config = vscode.workspace.getConfiguration('CodeWithMe');
    const MODEL = config.get<string>('model');
    const API_URL = config.get<string>('url');
    const API_TOKEN = config.get<string>('token');
    const provider = config.get<string>('provider');

    const headers = {
        Authorization: API_TOKEN ? `Bearer ${API_TOKEN}` : '',
        'Content-Type': 'application/json',
      };

    if(API_URL != undefined && content != undefined){
        
        const payloadData : payloadDTO = {
          model : MODEL,
          provider,
          systemPrompt,
          content,
          temperature,
          max_tokens,
          apiEndPoint : API_URL,
        }
        const requestPayload = preparePayloadProviderLevel(payloadData);
        //✅ DEBUG LOGGING
        console.log('📡 Axios Request Debug:');
        console.log('➡️ URL:', requestPayload.apiEndPoint);
        console.log('➡️ Headers:', headers);
        console.log('➡️ Payload:', JSON.stringify(requestPayload.payload, null, 2));
        const res = await axios.post(requestPayload.apiEndPoint, requestPayload.payload, { headers });
        return parseLLMResponseProviderLevel(provider,res);
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
