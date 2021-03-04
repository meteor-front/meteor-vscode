import * as vscode from 'vscode';
import * as path from 'path';
export default class Util {
  // 获取webview内容
  getHtmlForWebview(webview: vscode.Webview, extensionPath: string, path: string, title: string) {
    const nonce = this.getNonce();
    const cssChunk = this._toUri(webview,  extensionPath, 'media', '/css/chunk-vendors.css');
    const cssUri = this._toUri(webview,  extensionPath, 'media', 'css/app.css');
    const vendor = this._toUri(webview,  extensionPath, 'media', 'js/chunk-vendors.js');
    const app = this._toUri(webview,  extensionPath, 'media', 'js/app.js');
  
    // return html;
    return `<!DOCTYPE html>
    <html lang=en>
    
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <link nonce="${nonce}" href="${cssChunk}" rel=stylesheet>
      <link nonce="${nonce}" href="${cssUri}" rel=stylesheet>
    </head>
    
    <body><noscript><strong>We're sorry but ${title} doesn't work properly without JavaScript enabled. Please enable it to
          continue.</strong></noscript>
      <div id=app></div>
      <script>var rootPath = '${path}'</script>
      <script nonce="${nonce}" src="${vendor}"></script>
      <script nonce="${nonce}" src="${app}"></script>
    </body>
    
    </html>`;
  }

  // 资源地址转换
	private _toUri(webview: vscode.Webview, extensionPath: string, basePath: string, fileName: string) {
		return webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, basePath, fileName)));
	}
  
  private getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
