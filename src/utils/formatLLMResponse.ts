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

  export function formatAutoCompleteResponse(rawText: string, currentLine: string): string {
    const match = rawText.match(/```[a-z]*\n([\s\S]*?)```/i);
    const code = (match?.[1] || rawText).trim();
  
    // Find the longest suffix of currentLine that matches the prefix of the response
    let overlapIndex = 0;
    for (let i = 0; i < currentLine.length; i++) {
      const suffix = currentLine.slice(i);
      if (code.toLowerCase().startsWith(suffix.toLowerCase())) {
        overlapIndex = suffix.length;
        break;
      }
    }
  
    return code.slice(overlapIndex).trimStart();
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
  
  
  
  
  