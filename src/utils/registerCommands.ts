// src/utils/registerCommands.ts

import * as vscode from 'vscode';
import { queryLLM } from './queryLLM';



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

      editor.edit(editBuilder => {
        editBuilder.replace(selection, result);
      });
    });

    context.subscriptions.push(disposable);
  };

  registerCommand('localLLM.refactorCode', 'refactor');
  registerCommand('localLLM.commentCode', 'comment');

  // Inline completion
  const inlineProvider = vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, {
    async provideInlineCompletionItems(document, position) {
      const linePrefix = document.lineAt(position).text.substring(0, position.character);

      const response = await queryLLM({
        type: 'autocomplete',
        content: linePrefix,
      });

      return {
        items: [
          {
            insertText: response,
            range: new vscode.Range(position, position),
          },
        ],
      };
    },
  });

  context.subscriptions.push(inlineProvider);
}
