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
  