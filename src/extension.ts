// File: src/extension.ts
import * as vscode from 'vscode';
import axios from 'axios';
import { SettingsViewProvider } from './settingsView';

export function activate(context: vscode.ExtensionContext) {

// ✅ Register the settings webview
const settingsProvider = new SettingsViewProvider(context);
context.subscriptions.push(
  vscode.window.registerWebviewViewProvider(
    SettingsViewProvider.viewType,  // Use static identifier
    settingsProvider
  )
);
  
  context.subscriptions.push(
    vscode.commands.registerCommand('localLLM.refactorCode', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const selection = editor.selection;
      const text = editor.document.getText(selection);
      const refactored = await queryLLM('refactor', text);
      editor.edit(editBuilder => {
        editBuilder.replace(selection, refactored);
      });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('localLLM.commentCode', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      const selection = editor.selection;
      const text = editor.document.getText(selection);
      const commented = await queryLLM('comment', text);
      editor.edit(editBuilder => {
        editBuilder.replace(selection, commented);
      });
    })
  );

  vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, {
    async provideInlineCompletionItems(document, position) {
      const linePrefix = document.lineAt(position).text.substring(0, position.character);
      const response = await queryLLM('autocomplete', linePrefix);
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
}

async function queryLLM(mode: string, content: string): Promise<string> {
  const config = vscode.workspace.getConfiguration('localLLM');
  const url = config.get<string>('url');
  const token = config.get<string>('token');
  const model = config.get<string>('model');
  try {
    const res = await axios.post(
      url!,
      {
        prompt: `${mode.toUpperCase()}:\n${content}`,
        model: model,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data.choices?.[0]?.text?.trim() || '';
  } catch (err: any) {
    vscode.window.showErrorMessage(`LLM Error: ${err.message}`);
    return '';
  }
}

export function deactivate() {}
