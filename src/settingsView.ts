import * as vscode from 'vscode';
import { queryLLM } from './utils/queryLLM';
import { formatLLMResponse } from './utils/formatLLMResponse';

export class SettingsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'localLLMSettingsView';

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true,
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
        const response = await queryLLM({ type: 'ask', content: message.prompt });
        webviewView.webview.postMessage({
          command: 'showResponse',
          response: formatLLMResponse(response),
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
            width: 90%;
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

          .response-block code,
          .response-block pre {
            font-family: var(--vscode-editor-font-family, monospace);
            white-space: pre-wrap;
            word-break: break-word;
            color: var(--vscode-editor-foreground);
          }

          .code-container {
            position: relative;
            margin: 12px 0;
            background-color: #1e1e1e;
            border-radius: 6px;
            overflow: hidden;
          }

          .code-container pre {
            margin: 0;
            padding: 12px;
            color: #d4d4d4;
            font-size: 13px;
            background: #1e1e1e;
            white-space: pre-wrap;
          }

          .copy-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            background: #2d2d2d;
            border: none;
            color: #ccc;
            font-size: 14px;
            padding: 4px 6px;
            border-radius: 4px;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.2s ease-in-out;
          }

          .code-container:hover .copy-btn {
            opacity: 1;
          }

          #responseWrapper {
            margin-top: 12px;
            font-size: 14px;
          }
          pre code {
            display: block;
            background-color: #1e1e1e;
            color: #dcdcdc;
            padding: 1em;
            border-radius: 8px;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
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

        <div id="chat" class="tab-content active">
          <div id="responseWrapper">
            <div id="responseBox" class="response-block"></div>
          </div>

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
              const responseBox = document.getElementById('responseBox');
              responseBox.innerHTML = message.response;

              // Add copy button to each code block
              const codeBlocks = responseBox.querySelectorAll('pre');
              codeBlocks.forEach(pre => {
                const wrapper = document.createElement('div');
                wrapper.className = 'code-container';

                const button = document.createElement('button');
                button.className = 'copy-btn';
                button.innerText = '📋';
                button.addEventListener('click', () => {
                  navigator.clipboard.writeText(pre.innerText);
                  button.innerText = '✅';
                  setTimeout(() => button.innerText = '📋', 1000);
                });

                pre.parentNode?.insertBefore(wrapper, pre);
                wrapper.appendChild(button);
                wrapper.appendChild(pre);
              });
            }
          });
        </script>
      </body>
      </html>
    `;
  }
}
