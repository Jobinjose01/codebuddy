import * as vscode from 'vscode';
import axios from 'axios';
import { queryLLM } from './utils/queryLLM';
import { SettingsViewProvider } from './settingsView';
import { registerLLMCommands } from './utils/registerCommands';


export function activate(context: vscode.ExtensionContext) {

    // ✅ Register the settings webview
    const settingsProvider = new SettingsViewProvider(context);
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        SettingsViewProvider.viewType,  // Use static identifier
        settingsProvider
      )
    );
  
    registerLLMCommands(context);
}



export function deactivate() {}
