import * as vscode from 'vscode';
import { queryLLM } from './queryLLM';
import { formatAutoCompleteResponse, formatCommentResponse, formatReactorResponse } from './formatLLMResponse';



export function registerLLMCommands(context: vscode.ExtensionContext) {
  const registerCommand = (command: string, type: 'refactor' | 'comment') => {
    const disposable = vscode.commands.registerCommand(command, async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const selection = editor.selection;
      const text = editor.document.getText(selection);
      const result = await queryLLM({
        type,
        content: text,
      });

      const formattedResult = (type == 'comment') ? formatCommentResponse(result) : formatReactorResponse(result);
      editor.edit(editBuilder => {
        editBuilder.replace(selection, formattedResult);
      });
    });

    context.subscriptions.push(disposable);
  };

  registerCommand('CodeWithMe.refactorCode', 'refactor');
  registerCommand('CodeWithMe.commentCode', 'comment');

  let debounceTimeout: ReturnType<typeof setTimeout> | undefined;

  // Inline completion
 /*  const inlineProvider = vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, {
    provideInlineCompletionItems(document, position) {
      return new Promise((resolve) => {
        if (debounceTimeout) clearTimeout(debounceTimeout);
  
        debounceTimeout = setTimeout(async () => {
          const language = document.languageId;
  
          // Get up to 3 lines of context
          const maxLines = 3;
          const startLine = Math.max(0, position.line - (maxLines - 1));
          const contextLines: string[] = [];
  
          for (let i = startLine; i <= position.line; i++) {
            const lineText = document.lineAt(i).text;
            contextLines.push(lineText);
          }
  
          // Only use text before cursor in the current line
          const currentLine = document.lineAt(position.line).text.substring(0, position.character);
          contextLines[contextLines.length - 1] = currentLine;
          const fullContext = contextLines.join('\n');
  
          // Skip autocomplete for useless characters
          const trimmed = fullContext.trim();
          const lastChar = trimmed.slice(-1);
          const skipChars = [';', '}', ')'];
          if (!trimmed || skipChars.includes(lastChar)) {
            resolve({ items: [] });
            return;
          }
  
          // Check last typed character to throttle unnecessary requests
          if (position.character > 0) {
            const lastTypedChar = document.getText(new vscode.Range(
              new vscode.Position(position.line, position.character - 1),
              position
            ));
            const validCharRegex = /[a-zA-Z0-9_.]/;
            if (!validCharRegex.test(lastTypedChar)) {
              resolve({ items: [] });
              return;
            }
          }
  
          // Query the LLM
          const response = await queryLLM({
            type: 'autocomplete',
            content: `Programming Language: ${language}\n${fullContext}`,
          });
  
          const insertText = formatAutoCompleteResponse(response, currentLine).trim();
  
          // Don’t insert if it's empty or already the same as the current line
          if (
            !insertText ||
            insertText === currentLine ||
            insertText.startsWith(currentLine)
          ) {
            resolve({ items: [] });
            return;
          }
  
          // Return inline suggestion
          resolve({
            items: [
              {
                insertText,
                range: new vscode.Range(position, position),
              },
            ],
          });
        }, 300); // Adjust debounce delay if needed
      });
    }
  }); */
  
  const inlineProvider = vscode.languages.registerInlineCompletionItemProvider(
    { pattern: '**' },
    {
      provideInlineCompletionItems(document, position) {
        return new Promise((resolve) => {
          if (debounceTimeout) clearTimeout(debounceTimeout);
  
          debounceTimeout = setTimeout(async () => {
            const language = document.languageId;
  
            // Get up to 3 lines of context before the cursor
            const maxLines = 3;
            const startLine = Math.max(0, position.line - (maxLines - 1));
            const contextLines: string[] = [];
  
            for (let i = startLine; i <= position.line; i++) {
              const lineText = document.lineAt(i).text;
              contextLines.push(lineText);
            }
  
            // Get current line's text before and after the cursor
            const fullLine = document.lineAt(position.line).text;
            const currentLine = fullLine.substring(0, position.character);
            const suffix = fullLine.substring(position.character);
            console.log("Suffix",suffix);
  
            // Replace last line with trimmed version before the cursor
            contextLines[contextLines.length - 1] = currentLine;
            const prefixContext = contextLines.join('\n');
  
            // Skip autocomplete for useless characters
            const trimmed = prefixContext.trim();
            const lastChar = trimmed.slice(-1);
            const skipChars = [';', '}'];
            if (!trimmed || skipChars.includes(lastChar)) {
              resolve({ items: [] });
              return;
            }
  
            // Check last typed character to throttle unnecessary requests
            if (position.character > 0) {
              const lastTypedChar = document.getText(
                new vscode.Range(
                  new vscode.Position(position.line, position.character - 1),
                  position
                )
              );
              const validCharRegex = /[a-zA-Z0-9_.]/;
              if (!validCharRegex.test(lastTypedChar)) {
                resolve({ items: [] });
                return;
              }
            }
  
            // Call LLM with full context and suffix
            const response = await queryLLM({
              type: 'autocomplete',
              content: `Language: ${language}
                Prefix (before cursor):
                ${prefixContext}
                
                Suffix (after cursor):
                ${suffix}`,
            });
  
            const insertText = formatAutoCompleteResponse(response, currentLine, suffix);
  
            // Don’t insert if it's empty or already the same as the current line
            if (
              !insertText ||
              insertText === currentLine ||
              insertText.startsWith(currentLine)
            ) {
              resolve({ items: [] });
              return;
            }
  
            resolve({
              items: [
                {
                  insertText,
                  range: new vscode.Range(position, position),
                },
              ],
            });
          }, 300); // debounce
        });
      },
    }
  );
  
  

  context.subscriptions.push(inlineProvider);
}
