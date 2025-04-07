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

  registerCommand('localLLM.refactorCode', 'refactor');
  registerCommand('localLLM.commentCode', 'comment');

  let debounceTimeout: ReturnType<typeof setTimeout> | undefined;
  let pendingResolve: ((result: vscode.InlineCompletionList) => void) | null = null;
  // Inline completion
  const inlineProvider = vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, {
    provideInlineCompletionItems(document, position) {
      return new Promise((resolve) => {  // << you must return this
        if (debounceTimeout) clearTimeout(debounceTimeout);
  
        debounceTimeout = setTimeout(async () => {
          const currentLine = document.lineAt(position.line).text.substring(0, position.character);
          if (!currentLine.trim()) {
            resolve({ items: [] });
            return;
          }
  
          const language = document.languageId;
  
          const response = await queryLLM({
            type: 'autocomplete',
            content: `Programming Language: ${language}\n${currentLine}`,
          });
  
          const insertText = formatAutoCompleteResponse(response,currentLine).trim();
  
          if (!insertText) {
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
        }, 300);
      });
    },
  });

  context.subscriptions.push(inlineProvider);
}
