export function formatLLMResponse(rawText: string): string {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  
    // Replace code blocks first and store temporarily
    let html = rawText.replace(codeBlockRegex, (match, lang, code) => {
      const language = lang || 'plaintext';
      const escaped = escapeHtml(code);
      return `<pre><code class="language-${language}">${escaped}</code></pre>`;
    });
  
    html = escapeHtmlOutsideCode(html);
  
    // Headings (###, ##, #)
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
    // Inline code
    html = html.replace(/`([^`\n]+?)`/g, '<code>$1</code>');
  
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  
    // Italic
    html = html.replace(/(?<!\*)\*(?!\*)(.*?)\*(?!\*)/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  
    // Lists (- or *)
    html = html.replace(/(^|\n)[*-] (.*?)(?=\n|$)/g, '$1• $2<br/>');
  
    // Line breaks
    html = html.replace(/\n/g, '<br/>');
  
    return html;
  }
  
  function escapeHtmlOutsideCode(text: string): string {
    const codeBlocks: string[] = [];
    text = text.replace(/<pre><code.*?>[\s\S]*?<\/code><\/pre>/g, match => {
      codeBlocks.push(match);
      return `__CODEBLOCK__${codeBlocks.length - 1}__`;
    });
  
    text = escapeHtml(text);
  
    return text.replace(/__CODEBLOCK__(\d+)__/g, (_, i) => codeBlocks[Number(i)]);
  }
  
  function escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      }[char]!)
    );
  }

     export function formatAutoCompleteResponse(
      rawText: string,
      currentLine: string,
      suffix: string
    ): string | undefined {
      const match = rawText.match(/```[a-z]*\n([\s\S]*?)```/i);
      let completion = match?.[1] || rawText;
    
      // Clean up leading/trailing newlines
      completion = completion.trim();
    
      // 1. Remove prefix already typed
      const trimmedLine = currentLine.trim();
      if (completion.startsWith(trimmedLine)) {
        completion = completion.slice(trimmedLine.length);
      }
    
      // 2. Remove overlap with suffix
      if (suffix && completion.endsWith(suffix)) {
        completion = completion.slice(0, -suffix.length);
      }
    
      // 3. Smart overlap removal with currentLine (even partial word)
      for (let i = 0; i < currentLine.length; i++) {
        const overlap = currentLine.slice(i);
        if (completion.startsWith(overlap)) {
          completion = completion.slice(overlap.length);
          break;
        }
      }
    
      // 4. Fix spacing logic (smartly add a space only if needed)
      const endsWithWordChar = /[a-zA-Z0-9_]$/.test(currentLine);
      const startsWithWordChar = /^[a-zA-Z0-9_]/.test(completion);
      if (endsWithWordChar && startsWithWordChar) {
        completion = ' ' + completion;
      }
    
      // 5. Trim again
      completion = completion.trimStart();
    
      // 6. Don't return just whitespace
      if (!completion || completion.trim() === '') {
        return undefined;
      }
    
      return completion;
    }
    
    
    
    
  

  export function formatCommentResponse(rawText: string): string {
    return rawText
      .replace(/^```[\w-]*\s*/i, '')  // remove ``` and optional language (like ts, js)
      .replace(/```$/, '')           // remove trailing ```
      .trim();                       // remove any leading/trailing whitespace
  }

  export function formatReactorResponse(raw: string): string {
    return raw
      .replace(/```[\s\S]*?(\n)?/g, '') // remove ```language or ``` on own lines
      .trim();
  }
  
  
  
  
  