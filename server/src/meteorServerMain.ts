/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
  _Connection
  
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';
import Utils from './utils'
import Completion from './completion'
import MeteorServer from './meteorServer'

// 创建服务器连接，通信：Node's IPC
let connection: _Connection = createConnection(ProposedFeatures.all);
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;
let workspaceFolders: any [] = []
let workspaceRoot: string = ''
let meteorConfig: any = {}
let meteorServer: MeteorServer = new MeteorServer(connection, meteorConfig)

connection.onInitialize((params: InitializeParams) => {
	let capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// 告诉客户端，服务端支持代码补全功能
			completionProvider: {
				resolveProvider: true
			}
		}
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
    params.workspaceFolders?.map((workspace) => {
      workspaceFolders.push(workspace.uri)
    })
	}
	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
    let result = connection.workspace.getConfiguration({
      scopeUri: '',
      section: 'meteor'
    })
    result.then((res) => {
      // 获取初始配置
      meteorConfig = res
      meteorServer.completion.updateConfig(meteorConfig)
      meteorServer.completion.getSwagger(false)
    })
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			// connection.console.log('Workspace folder change event received.');
		});
	}
});

// 监听配置改变
connection.onDidChangeConfiguration(change => {
  let result = connection.workspace.getConfiguration({
    scopeUri: '',
    section: 'meteor'
  })
  result.then((res) => {
    // 获取初始配置
    meteorConfig = res
    meteorServer.completion.updateConfig(meteorConfig)
    meteorServer.completion.getSwagger(true)
  })
});

// 监听文件关闭
documents.onDidClose(e => {
});

// 监听文件内容改变
documents.onDidChangeContent(change => {
  connection.console.log('change content')
  if (!workspaceRoot) {
    workspaceRoot = Utils.getWorkspaceRoot(workspaceFolders, change.document.uri)
    meteorServer.completion.updateConfig(meteorConfig)
    meteorServer.completion.updateRoot(workspaceRoot)
    meteorServer.completion.getSwagger(false)
  }
});

// 监听文件改变
connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});

// 提供初始完成项
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
    // connection.console.log(workspaceFolders.toString())
    // connection.console.log(_textDocumentPosition.textDocument.uri)
    // if (!workspaceRoot) {
    //   workspaceRoot = Utils.getWorkspaceRoot(workspaceFolders, _textDocumentPosition.textDocument.uri)
    //   meteorServer.completion.updateRoot(workspaceRoot)
    // }
    return meteorServer.completion.provider()
	}
);

// 完成项进一步说明解析内容
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
    connection.console.log('item')
    connection.console.log(item.label)
		return item;
	}
);

// 监听文件打开、改变、关闭事件
documents.listen(connection);

// 监听连接
connection.listen();
