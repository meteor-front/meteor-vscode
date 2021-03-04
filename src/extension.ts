// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { CreatProjectPanel } from './zlst/createProject';
import { CreatPagePanel } from './zlst/createPage';
import pageNew from './zlst/pageNew';
import GeneratePage from './zlst/generatePage';
import {App, ElementCompletionItemProvider, DocumentHoverProvider } from './app';
import { ZlstDefinitionProvider } from './definitionProvider';
import { JsCompletionItemProvider } from './js-complete';
import { PxRem } from './px-rem';
import Zlst from './zlst/zlst';
import Util from './util/util';
const os = require("os");

export function activate(context: vscode.ExtensionContext) {
	let app = new App();
    let completionItemProvider = new ElementCompletionItemProvider();
    let registrationHover = vscode.languages.registerHoverProvider('vue', new DocumentHoverProvider);
    let pxRem = new PxRem();
		let jsCompletionItemProvider = new JsCompletionItemProvider();
		// 构建中铝视拓对象
		const zlst = new Zlst({
			context
		});

    // 为标签、属性提示提供自动完成功能, 关闭标签功能
    let completion = vscode.languages.registerCompletionItemProvider(['vue', 'javascript', 'html'], completionItemProvider, '' ,':', '<', '"', "'", '/', '@', '(', '>', '{');
    let vueLanguageConfig = vscode.languages.setLanguageConfiguration('vue', {wordPattern: app.WORD_REG});

    let jsCompletion = vscode.languages.registerCompletionItemProvider(['javascript', 'html', 'vue'], jsCompletionItemProvider, '.', '(');

    // 函数补全函数
    let functionCompletionDisposable = vscode.commands.registerCommand('zlst.functionCompletion', () => {
			let editor = vscode.window.activeTextEditor;
			if (!editor) { return; }
			let txt = editor.document.lineAt(editor.selection.anchor.line).text;
			if (/.*@\w*=\"\w.*\"/gi.test(txt)) {
				// 定义方法，并跳到方法处
				zlst.generateMethod();
			} else {
        app.autoComplement();
			}
    });

    // 删除处理函数
    let deleteCompleteDisposable = vscode.commands.registerCommand('zlst.deleteComplete', () => {
        app.deleteComplete();
    });

    // 代码块选择
    let blockSelectDisposable = vscode.commands.registerCommand('zlst.blockSelect', () => {
        app.blockSelect();
    });

    // px、rem转化函数
    let pxRemDisposable = vscode.commands.registerCommand('zlst.pxRem', () => {
        pxRem.handle();
    });

    // pxToRem
    let pxToRemDisposable = vscode.commands.registerCommand('zlst.pxToRem', () => {
        pxRem.handlePxToRem('px');
    });

    // remToPx
    let remToPxDisposable = vscode.commands.registerCommand('zlst.remToPx', () => {
        pxRem.handlePxToRem('rem');
    });

    // 到达定义函数
    let zlstDefinition = vscode.languages.registerDefinitionProvider(['vue', 'javascript', 'html'], new ZlstDefinitionProvider());
	// 创建工程
	let createProjectDisposable = vscode.commands.registerCommand('zlst.createProject', () => {
		CreatProjectPanel.createOrShow(context.extensionPath);
	});
	// 创建页面
	let createPageDisposable = vscode.commands.registerCommand('zlst.createPage', (activeTab) => {
		CreatPagePanel.createOrShow(context.extensionPath, activeTab);
	});
	// 生成页面
	let generatePageDisposable = vscode.commands.registerCommand('zlst.generatePage', () => {
		new GeneratePage(vscode.workspace.rootPath || '').generate();
	});
	// 打开工程目录
	let openProjectDisposable = vscode.commands.registerCommand("zlst.openProject", (node: string | any) => {
		let projectDir = CreatProjectPanel.projectDir;
		if (os.platform().includes('win')) {
			projectDir = '/' + projectDir.replace(/\\/gi, '/');
		}
			vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.parse(projectDir), false)
					.then(value => ({}),  // done
					value => vscode.window.showInformationMessage("打开工程失败！"));
	});
	// 页面生成
	let pageNewDisposable = vscode.commands.registerCommand('zlst.pageNew', (uri) => {
		pageNew.showQuickPick(context, uri);
	});
	// 组件生成
	let componentNewDisposable = vscode.commands.registerCommand('zlst.componentNew', (uri) => {
		pageNew.showComponentQuickPick(context, uri);
	});
	// 接口生成
	let apiDisposable = vscode.commands.registerCommand('zlst.api', (uri) => {
		pageNew.api(context, uri);
	});
	// 同步数据
	let zlstSyncDispoable = vscode.commands.registerCommand('zlst.sync', async () => {
		zlst.sync();
	});
	// swagger生成api
	let zlstSwaggerDispoable = vscode.commands.registerCommand('zlst.swagger', async () => {
		zlst.swagger();
	});
	// 测试outline
	let zlstOutlineTest = vscode.commands.registerCommand('zlst.outlineTest', () => {
		zlst.outline();
	});
	// 打开官网
	let openOfficialDisposable = vscode.commands.registerCommand('zlst.openOfficial', (uri) => {
		Util.open('http://www.80fight.cn');
	});
	context.subscriptions.push(app, completion, vueLanguageConfig, registrationHover, functionCompletionDisposable, deleteCompleteDisposable, zlstDefinition, pxRemDisposable, pxToRemDisposable, remToPxDisposable, blockSelectDisposable, jsCompletion, createProjectDisposable, openProjectDisposable, createPageDisposable, generatePageDisposable, pageNewDisposable, apiDisposable, zlstSyncDispoable, componentNewDisposable, zlstSwaggerDispoable, openOfficialDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
