import { payloadDTO } from "../dto/payloadDTO";

export function parseLLMResponseProviderLevel(provider:string | undefined, res: any){

    let responseContent : string;
    switch(provider){
      case 'openwebui':
      case 'chatgpt':
      case 'openrouter':          
          responseContent  = res.data.choices?.[0]?.message?.content?.trim() || '';
          break;       
      case 'ollama':          
          responseContent  = res.data?.response?.trim() || '';
          break;        
      default:          
          responseContent  = res.data.choices?.[0]?.message?.content?.trim() || '';
          break;
    }
    return responseContent;
}

export function preparePayloadProviderLevel(payloadData : payloadDTO){

    let payload;
    let apiEndPoint;
    let temperature = payloadData.temperature;
    let max_tokens = payloadData.max_tokens;
    let content = payloadData.content;
    
    payloadData.apiEndPoint = payloadData.apiEndPoint.replace(/\/$/, '');

    switch(payloadData.provider){

        case 'openwebui':        

            payload = {
              model:payloadData.model,
              messages: [
                { role: 'system', content: payloadData.systemPrompt },
                { role: 'user', content },
              ],
              temperature,
              max_tokens,
            };

            apiEndPoint = payloadData.apiEndPoint + '/api/chat/completions';
            break;

        case 'openrouter':

            payload = {
              model:payloadData.model,
              messages: [
                { role: 'system', content: payloadData.systemPrompt },
                { role: 'user', content },
              ],
              temperature,
              max_tokens,
            };

            apiEndPoint = payloadData.apiEndPoint + '/api/v1/chat/completions';
            break;

        case 'chatgpt':

            payload = {
              model:payloadData.model,
              messages: [
                { role: 'system', content: payloadData.systemPrompt },
                { role: 'user', content },
              ],
              temperature,
              max_tokens,
            };

            apiEndPoint = payloadData.apiEndPoint + '/v1/chat/completions';
            break;

        case 'ollama':

            const prompt = `${payloadData.systemPrompt}\n\nUser: ${payloadData.content}`;

            payload = {
              model:payloadData.model,
              prompt: prompt,
              temperature,
              max_tokens,
              stream: false
            };

            apiEndPoint = payloadData.apiEndPoint + '/api/generate';

            break;   

        default:

            payload = {
              model:payloadData.model,
              messages: [
                { role: 'system', content: payloadData.systemPrompt },
                { role: 'user', content },
              ],
              temperature,
              max_tokens,
            };

            apiEndPoint = payloadData.apiEndPoint + '/api/chat/completions';
            break;
      }

      return {
        payload ,
        apiEndPoint
      }
}