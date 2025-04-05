import * as vscode from 'vscode';
import axios from 'axios';

export class SettingsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'localLLMSettingsView';

  constructor(private readonly context: vscode.ExtensionContext) {}

  private async queryLLM(mode: string, content: string): Promise<string> {
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
      return 'Error: ' + err.message;
    }
  }
  
   resolveWebviewView(
    webviewView: vscode.WebviewView
  ) {
    webviewView.webview.options = {
      enableScripts: true
    };

   

    const config = vscode.workspace.getConfiguration('localLLM');
    const savedUrl = config.get('url', '');
    const savedToken = config.get('token', '');
    const savedModel = config.get('model', '');

    webviewView.webview.html = this.getHtml(savedUrl, savedToken, savedModel);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === 'saveSettings') {
        await config.update('url', message.url, vscode.ConfigurationTarget.Global);
        await config.update('token', message.token, vscode.ConfigurationTarget.Global);
        await config.update('model', message.model, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage('LLM settings saved!');
      }
    
      if (message.command === 'sendPrompt') {
        const response = await this.queryLLM('chat', message.prompt);
        webviewView.webview.postMessage({
          command: 'showResponse',
          response: response
        });
      }
    });
    
  } 
    
    
  private getHtml(url: string, token: string, model: string): string {
    return `
      <html>
      <head>
        <style>
          body {
            font-family: sans-serif;
            padding: 10px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
          }
          .tab {
            display: flex;
            cursor: pointer;
            border-bottom: 1px solid var(--vscode-panel-border);
            margin-bottom: 10px;
          }
          .tab div {
            padding: 10px;
            margin-right: 10px;
          }
          .tab div.active {
            border-bottom: 2px solid var(--vscode-textLink-foreground);
            font-weight: bold;
          }
          .tab-content {
            display: none;
          }
          .tab-content.active {
            display: block;
          }
          textarea,
          input[type="text"] {
            width: 100%;
            padding: 6px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
          }
          button {
            margin-top: 5px;
            padding: 8px 16px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            cursor: pointer;
            border-radius: 4px;
          }
          #responseBox {
            margin-top: 10px;
            padding: 10px;
            border: 1px solid var(--vscode-panel-border);
            background: var(--vscode-editor-background);
            color: var(--vscode-foreground);
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <h3>Local LLM Assistant</h3>
        <div class="tab">
          <div class="tab-btn active" data-tab="chat">Chat</div>
          <div class="tab-btn" data-tab="settings">Settings</div>
        </div>
  
        <div id="settings" class="tab-content">
          <label>URL:</label><br/>
          <input type="text" id="url" value="${url}"/><br/><br/>
          <label>Token:</label><br/>
          <input type="text" id="token" value="${token}"/><br/><br/>
          <label>Model:</label><br/>
          <input type="text" id="model" value="${model}"/><br/><br/>
          <button onclick="save()">Save</button>
        </div>
  
        <div id="chat" class="tab-content active>
          <div id="responseBox"></div>
          <label>Ask me anything:</label><br/>
          <textarea id="prompt"></textarea><br/>
          <button onclick="send()">Send</button>
        </div>
  
        <script>
          const vscode = acquireVsCodeApi();
  
          document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
              document.getElementById(btn.dataset.tab).classList.add('active');
            });
          });
  
          function save() {
            vscode.postMessage({
              command: 'saveSettings',
              url: document.getElementById('url').value,
              token: document.getElementById('token').value,
              model: document.getElementById('model').value,
            });
          }
  
          function send() {
            const prompt = document.getElementById('prompt').value;
            vscode.postMessage({
              command: 'sendPrompt',
              prompt: prompt
            });
          }
  
          window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'showResponse') {
              document.getElementById('responseBox').innerText = message.response;
            }
          });
        </script>
      </body>
      </html>
    `;
  }
  
  
}
