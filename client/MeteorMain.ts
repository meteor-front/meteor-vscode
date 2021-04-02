/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import * as vscode from 'vscode';
import Meteor from './meteor/meteor'
import { open, url } from './meteor/utils/util'
import UploadPanel from './meteor/functions/upload'
import NewProjectPanel from './meteor/functions/newProject'
import { MeteorDefinitionProvider } from './meteor/definitionProvider';
import DocumentHoverProvider from './meteor/DocumentHoverProvider';
import { JsCompletionItemProvider } from './meteor/jsComplete';

const os = require("os");

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
      meteor.generateMethod();
    } else {
      meteor.completionItemProvider.autoComplement()
    }
  });
  // 代码块选择
  let blockSelectDisposable = vscode.commands.registerCommand('meteor.blockSelect', () => {
      meteor.block.select()
  });
  // 删除处理函数
  let deleteCompleteDisposable = vscode.commands.registerCommand('meteor.deleteComplete', () => {
    meteor.backSpace.deleteComplete()
  });
  // 打开官网
	let openOfficialDisposable = vscode.commands.registerCommand('meteor.openOfficial', (uri) => {
		open(url.official);
	});
  // swagger生成api
	let meteorSwaggerDispoable = vscode.commands.registerCommand('meteor.swagger', async () => {
		meteor.swagger.generate()
	});
  // 页面生成
	let newPageDisposable = vscode.commands.registerCommand('meteor.newPage', (uri) => {
		meteor.newPage.showQuickPick(context, uri)
	});
  // 同步数据
	let meteorSyncDispoable = vscode.commands.registerCommand('meteor.sync', async () => {
		meteor.sync();
	});
  // 上传页面/组件
	let uploadDisposable = vscode.commands.registerCommand('meteor.upload', (activeTab) => {
		UploadPanel.createOrShow(context.extensionPath, activeTab);
	});
  // 新建工程
	let newProjectDisposable = vscode.commands.registerCommand('meteor.newProject', () => {
		NewProjectPanel.createOrShow(context.extensionPath);
	});
  // 打开工程目录
	let openProjectDisposable = vscode.commands.registerCommand("meteor.openProject", (node: string | any) => {
		let projectDir = NewProjectPanel.projectDir;
		if (os.platform().includes('win')) {
			projectDir = '/' + projectDir.replace(/\\/gi, '/');
		}
			vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.parse(projectDir), false)
					.then(value => ({}),  // done
					value => vscode.window.showInformationMessage("打开工程失败！"));
	});
  // 生成组件
	let newComponentDisposable = vscode.commands.registerCommand('meteor.newComponent', (uri) => {
		meteor.newPage.showComponentQuickPick(context, uri);
	});
  // 接口生成
	let apiDisposable = vscode.commands.registerCommand('meteor.api', (uri) => {
		meteor.newPage.api(context, uri);
	});
  // 到达定义函数
  let meteorDefinition = vscode.languages.registerDefinitionProvider(['vue', 'javascript', 'html'], new MeteorDefinitionProvider());
  let registrationHover = vscode.languages.registerHoverProvider('vue', new DocumentHoverProvider);
  let jsCompletion = vscode.languages.registerCompletionItemProvider(['javascript', 'html', 'vue'], new JsCompletionItemProvider(), '.', '(');
  
  context.subscriptions.push(completionDisposible, functionCompletionDisposable, blockSelectDisposable, deleteCompleteDisposable, openOfficialDisposable, meteorSwaggerDispoable, 
    newPageDisposable, meteorSyncDispoable, uploadDisposable, newProjectDisposable, openProjectDisposable, newComponentDisposable, apiDisposable, meteorDefinition,
    registrationHover, jsCompletion)

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
