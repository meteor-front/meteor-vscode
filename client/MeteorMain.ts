/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import * as vscode from 'vscode';
import Meteor from './meteor/meteor'
import { open, url, getWorkspaceRoot } from './meteor/utils/util'
import UploadPanel from './meteor/functions/upload'
import NewProjectPanel from './meteor/functions/newProject'
import { MeteorDefinitionProvider } from './meteor/definitionProvider';
import DocumentHoverProvider from './meteor/DocumentHoverProvider';
import { JsCompletionItemProvider } from './meteor/jsComplete';
import * as ClientCommands from './clientCommands'

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
  vscode.languages.registerCompletionItemProvider(['vue', 'javascript', 'typescript', 'html', 'wxml'], meteor.completionItemProvider, '', ':', '<', '"', "'", '/', '@', '(', '>', '{');
  vscode.languages.registerCompletionItemProvider(['vue', 'javascript', 'typescript', 'html', 'wxml', 'scss', 'css', 'wxss'], meteor.meteorCompletionItemProvider, 'm');
  vscode.languages.registerCompletionItemProvider(['vue', 'javascript', 'typescript', 'html', 'wxml'], meteor.swaggerCompletionItemProvider, '');
  // 函数补全函数
  vscode.commands.registerCommand('meteor.functionCompletion', () => {
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
  vscode.commands.registerCommand('meteor.blockSelect', () => {
      meteor.block.select()
  });
  // 删除处理函数
  vscode.commands.registerCommand('meteor.deleteComplete', () => {
    meteor.backSpace.deleteComplete()
  });
  // 打开官网
	vscode.commands.registerCommand('meteor.openOfficial', (uri) => {
		open(url.official);
	});
  // 打开容器云
	vscode.commands.registerCommand('meteor.openCloud', (uri) => {
    let url: any = vscode.workspace.getConfiguration('meteor').get('cloudUrl')
		open(url);
	});
  // 打开git
	vscode.commands.registerCommand('meteor.openGit', (uri) => {
    let url: any = vscode.workspace.getConfiguration('meteor').get('gitUrl')
    let workspacePath = getWorkspaceRoot('')
    let projectName = workspacePath.replace(/.*[\/\\](.*)$/gi, '$1')
		open(`${url}search?utf8=%E2%9C%93&search=${projectName}&group_id=&project_id=&repository_ref=`);
	});
  // 打开jenkins
	vscode.commands.registerCommand('meteor.openJenkins', (uri) => {
		let url: any = vscode.workspace.getConfiguration('meteor').get('jenkinsUrl')
		let config: any = vscode.workspace.getConfiguration('meteor').get('jenkinsConfig')
    let workspacePath = getWorkspaceRoot('')
    let projectName = workspacePath.replace(/.*[\/\\](.*)$/gi, '$1')
    let job = projectName
    config = config[projectName]
    if (config) {
      config = JSON.parse(config)
      job = config.job
      url = config.url || url
    }
		open(`${url}/job/${job}`);
	});
  // swagger生成api
  const statusCommandId = 'meteor.swagger'
	vscode.commands.registerCommand(statusCommandId, async () => {
		meteor.swagger.generate(false, false, false)
	});
  // jenkins生成镜像
  const statusJenkinsCommandId = 'meteor.jenkins'
  // vscode.commands.registerCommand(statusJenkinsCommandId, async () => {
  //   console.log('update')
  //   new Config().update('doJenkins', new Date().getTime())
  //   // meteor.jenkins.jenkinsBuild()
  // })
  // jenkins配置
  vscode.commands.registerCommand('meteor.jenkinsConfig', async () => {
    meteor.jenkins.init()
  })
  // 状态栏
  let statusBarItem: vscode.StatusBarItem;
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99999);
	statusBarItem.command = statusCommandId;
  statusBarItem.text = 'Swagger'
  statusBarItem.show()
  // jenkins 状态条
  let statusJenkinsBarItem: vscode.StatusBarItem;
  statusJenkinsBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99999);
	statusJenkinsBarItem.command = statusJenkinsCommandId;
  statusJenkinsBarItem.text = 'Jenkins'
  statusJenkinsBarItem.show()
  // 容器云
  const statusCloudCommandId = 'meteor.cloud'
  vscode.commands.registerCommand(statusCloudCommandId, async () => {
    meteor.cloud.init()
  })
  let statusCloudBarItem: vscode.StatusBarItem;
  statusCloudBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99999);
	statusCloudBarItem.command = statusCloudCommandId;
  statusCloudBarItem.text = 'Cloud'
  statusCloudBarItem.show()
  // 页面生成
	vscode.commands.registerCommand('meteor.newPage', (uri) => {
		meteor.newPage.showQuickPick(context, uri)
	});
  // 同步数据
	vscode.commands.registerCommand('meteor.sync', async () => {
		meteor.sync();
	});
  // 上传页面/组件
	vscode.commands.registerCommand('meteor.upload', (activeTab) => {
    if (['1', '2', 1, 2].indexOf(activeTab) === -1) {
      activeTab = '1'
    }
    // console.log('uri', vscode.window.activeTextEditor?.document.uri.path)
		UploadPanel.createOrShow(context.extensionPath, activeTab);
	});
  // 新建工程
	vscode.commands.registerCommand('meteor.newProject', () => {
		NewProjectPanel.createOrShow(context.extensionPath);
	});
  // 更新swagger地址
  vscode.commands.registerCommand('meteor.replaceSwaggerAddress', () => {
    meteor.swagger.generate(false, false, true)
  })
  // 打开工程目录
	vscode.commands.registerCommand("meteor.openProject", (node: string | any) => {
		let projectDir = NewProjectPanel.projectDir;
		if (os.platform().includes('win')) {
			projectDir = '/' + projectDir.replace(/\\/gi, '/');
		}
			vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.parse(projectDir), false)
					.then(value => ({}),  // done
					value => vscode.window.showInformationMessage("打开工程失败！"));
	});
  // 生成组件
	vscode.commands.registerCommand('meteor.newComponent', (uri) => {
		meteor.newPage.showComponentQuickPick(context, uri);
	});
  // 接口生成
	vscode.commands.registerCommand('meteor.api', (uri) => {
		meteor.newPage.api(context, uri);
	});
  // meteor服务器调用的接口
  vscode.commands.registerCommand('meteor.apiGenerateFileExtra', (params) => {
    meteor.completionItemProvider.setSwagger(params.swagger)
    meteor.swagger.apiGenerateFileExtra(params)
    meteor.swagger.generateSingleApi(`[${params.postWay}] ${params.apiUrl}`)
  })
  // 组件完成
  vscode.commands.registerCommand('meteor.componentCompetion', (component) => {
    meteor.newPage.offlineGenerateComponent(context, component.uri, component.name)
  })

  // 到达定义函数
  vscode.languages.registerDefinitionProvider(['vue', 'javascript', 'typescript', 'html'], new MeteorDefinitionProvider());
  vscode.languages.registerHoverProvider('vue', new DocumentHoverProvider);
  vscode.languages.registerCompletionItemProvider(['javascript', 'typescript', 'html', 'vue'], new JsCompletionItemProvider(), '.', '(');

	// 服务器用node实现
	let serverModule = context.asAbsolutePath(
		path.join('server', 'dist', 'meteorServerMain.js')
	);
	// The debug options for the server
	// --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
	let debugOptions = { execArgv: ['--nolazy', '--inspect=6010'] };

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
		documentSelector: [{ scheme: 'file', language: 'vue' }, { scheme: 'file', language: 'javascript' }, { scheme: 'file', language: 'typescript' }],
		synchronize: {
			fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	// 创建语言客户端并开启
	client = new LanguageClient(
		'meteorServer',
		'meteorServerLanguage',
		serverOptions,
		clientOptions
	);

  function registerCommands(this: any, client: LanguageClient, context: vscode.ExtensionContext) {
    context.subscriptions.push(
      vscode.commands.registerCommand('meteor.jenkins', ClientCommands.jenkinsBuild.bind(this, context, client, meteor)),
    );
  }
  
  // function registerNotifications(client: LanguageClient) {
  //   client.onNotification("openUrl", url => {

  //   });
  // }

  client.onReady().then(() => {
    registerCommands(client, context);
    // registerNotifications(client);
  });

	// 开启客户端，并会启动服务端
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
