export interface payloadDTO{
    model : string | undefined,
    provider: string | undefined,
    systemPrompt : string,
    content : string,
    temperature : number,
    max_tokens: number,
    apiEndPoint:string,
}