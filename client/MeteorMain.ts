/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import * as vscode from 'vscode';
import Meteor from './meteor/meteor'

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
  const meteor = new Meteor(context)
  
  // 为标签、属性提示提供自动完成功能, 关闭标签功能
  let completionDisposible = vscode.languages.registerCompletionItemProvider(['vue', 'javascript', 'html', 'wxml'], meteor.completionItemProvider, '' ,':', '<', '"', "'", '/', '@', '(', '>', '{');
  // 函数补全函数
  let functionCompletionDisposable = vscode.commands.registerCommand('meteor.functionCompletion', () => {
    let editor = vscode.window.activeTextEditor;
    if (!editor) { return; }
    let txt = editor.document.lineAt(editor.selection.anchor.line).text;
    if (/.*@\w*=\"\w.*\"/gi.test(txt)) {
      // 定义方法，并跳到方法处
      // zlst.generateMethod();
    } else {
      meteor.completionItemProvider.autoComplement()
    }
  });
  
  context.subscriptions.push(completionDisposible, functionCompletionDisposable)

	// 服务器用node实现
	let serverModule = context.asAbsolutePath(
		path.join('server', 'dist', 'meteorServerMain.js')
	);
	// The debug options for the server
	// --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
	let debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		documentSelector: [{ scheme: 'file', language: 'plaintext' }],
		synchronize: {
			fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	// 创建语言客户端并开启
	client = new LanguageClient(
		'meteorServer',
		'meteorServerExample',
		serverOptions,
		clientOptions
	);

	// 开启客户端，并会启动服务端
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
