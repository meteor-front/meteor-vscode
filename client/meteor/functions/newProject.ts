import * as path from 'path';
import * as vscode from 'vscode';
const execa = require('execa');
const fs = require('fs');
import * as data from '../utils/data';
import { getHtmlForWebview } from '../utils/util';
const os = require("os");

/**
 * 创建工程面板
 */
export default class NewProjectPanel {
	// 跟踪面板，每次只让显示一个
	public static currentPanel: NewProjectPanel | undefined;

	public static readonly viewType = 'meteorCreatProject';
	public static projectDir: string;

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionPath: string;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionPath: string) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// 当前面板存在，加载
		if (NewProjectPanel.currentPanel) {
			NewProjectPanel.currentPanel._panel.reveal(column);
			return;
    }
		// 否则创建一个新的面板.
		const panel = vscode.window.createWebviewPanel(
			NewProjectPanel.viewType,
			'创建新工程',
			column || vscode.ViewColumn.One,
			{
				// webview允许使用javascript
				enableScripts: true,

				// And restrict the webview to only loading content from our extension's `media` directory.
				localResourceRoots: [vscode.Uri.file(path.join(extensionPath, 'media'))]
			}
		);

		NewProjectPanel.currentPanel = new NewProjectPanel(panel, extensionPath);
	}

	public static revive(panel: vscode.WebviewPanel, extensionPath: string) {
		NewProjectPanel.currentPanel = new NewProjectPanel(panel, extensionPath);
	}

  // 构造函数
	private constructor(panel: vscode.WebviewPanel, extensionPath: string) {
		this._panel = panel;
		this._extensionPath = extensionPath;

		// 设置webview中的html内容
		this._update();

		// 监听面板是否被disposed
		// 当用户关闭面板后者程序被关闭时发生
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);

		// 处理来自webview的信息
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'create':
						// vscode.window.showErrorMessage(message.id + ' - ' + message.text);
						this._create(message);
						return;
					case 'selBaseDir':
						this._selBaseDir();
						return;
				}
			},
			null,
			this._disposables
		);
	}

	// 选择目录
	private async _selBaseDir() {
		let rootPath = data.dateGet('rootPath');
		// windows平台
		if (os.platform().includes('win')) {
			rootPath = '/' + rootPath;
		}
		const options: vscode.OpenDialogOptions = {
			canSelectFolders: true,
			canSelectFiles: false,
			canSelectMany: false,
			openLabel: 'Open'
		};
		if (rootPath) {
		  options.defaultUri = vscode.Uri.parse(rootPath);
		}
		const selectFolderUri = await vscode.window.showOpenDialog(options);
		if (selectFolderUri && Array.isArray(selectFolderUri)) {
			let basePath = selectFolderUri[0].path;
			// windows平台
			if (os.platform().includes('win')) {
				basePath = basePath.substr(1, basePath.length);
			}
			data.dataSave('rootPath', basePath);
			this._panel.webview.postMessage({ command: 'path', path: basePath });
		}
	}

	// 创建工程
	private _create(message: any) {
		function deleteAll(path: string) {
			var files = [];
			if (fs.existsSync(path)) {
				files = fs.readdirSync(path);
				files.forEach(function(file: any, index: String) {
					var curPath = path + '/' + file;
					if (fs.statSync(curPath).isDirectory()) {
						deleteAll(curPath);
					} else {
						fs.unlinkSync(curPath);
					}
				});
				fs.rmdirSync(path);
			}
		}
		if (!message.baseDir) {
			this._panel.webview.postMessage({ command: 'done'});
			return vscode.window.showWarningMessage('请选择项目目录！');
		}
		if (!message.projectName) {
			this._panel.webview.postMessage({ command: 'done'});
			return vscode.window.showWarningMessage('请输入工程名称！');
		}
		if (!message.url) {
			this._panel.webview.postMessage({ command: 'done'});
			return vscode.window.showWarningMessage('请输入模板地址！');
		}
		if (!message.hub) {
			this._panel.webview.postMessage({ command: 'done'});
			return vscode.window.showWarningMessage('请输入仓库地址！');
		}
		(async () => {
			let dir = path.join(message.baseDir, message.projectName);
			let isExist = false;
			try {
				fs.statSync(dir);
				isExist = true;
			} catch (error) {
			}

			let hasHub: boolean = false;
			// 判断git地址是否存在！
			try {
				await execa('git', ['ls-remote', message.hub]);
				hasHub = true;
			} catch (error) {
			}

			if (hasHub) {
				this._panel.webview.postMessage({ command: 'done'});
			  return vscode.window.showWarningMessage('仓库地址已存在');
			}

			try {
				// 通过账号、密码登录
				if (/^http/gi.test(message.url) && message.account) {
					let url = message.url.split('//');
					message.url = `${url[0]}//${message.account.name}:${message.account.password}@${url[1]}`;
				}
				await execa('git', ['clone', message.url, dir]);
				if (os.platform().includes('win')) {
					deleteAll(path.join(dir, '.git'));
				} else {
					await execa('rm', ['-rf', path.join(dir, '.git')]);
				}
				await execa('git', ['init'], {
					cwd: dir
				});
				await execa('git', ['add', '.'], {
					cwd: dir
				});
				await execa('git', ['commit', '-m', 'init'], {
					cwd: dir
				});
				await execa('git', ['remote', 'add', 'origin', message.hub], {
					cwd: dir
				});
				await execa('git', ['push', '-u', 'origin', 'master'], {
					cwd: dir
				});
				this._panel.webview.postMessage({ command: 'done'});
				NewProjectPanel.projectDir = dir;
				vscode.window.showInformationMessage('恭喜，工程初始化成功！ [打开工程](command:meteor.openProject)');
			} catch (error) {
				console.log('errorNow', error.message);
				if (error.message.includes('mkdir')) {
					vscode.window.showErrorMessage('创建工程目录' + dir + '失败！');
				} else if (error.message.includes('git clone')) {
					// 拷贝失败
					// console.log(message.url);
					if (error.message.includes('could not read Username') || error.message.includes('Authentication failed')) {
						if (/^http/gi.test(message.url)) {
							// 没有账号，提示提供账号
							this._panel.webview.postMessage({
								command: 'account'
							});
						} else {
							vscode.window.showErrorMessage('暂未提供ssh账号登录功能！\n请使用http请求');
						}
					} else {
						vscode.window.showErrorMessage('拷贝模板工程失败！\n 请在本地命令行执行 git clone ' + message.url + ' 查看原因');
					}
				} else if (error.message.includes('correct access rights')) {
					vscode.window.showErrorMessage('请检查组名是否正确或是否拥有权限！');
				}
				this._panel.webview.postMessage({ command: 'done'});
			}
		})();
	}

	public doRefactor() {
		// Send a message to the webview webview.
		// You can send any JSON serializable data.
		this._panel.webview.postMessage({ command: 'refactor' });
	}

	public dispose() {
		NewProjectPanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

  // 更新html内容
	private _update() {
		const webview = this._panel.webview;

    // 基于状态改变webview内容
    this._updateForCreateProject(webview);
	}

	private _updateForCreateProject(webview: vscode.Webview) {
		this._panel.title = '创建新工程';
		this._panel.webview.html = getHtmlForWebview(webview, this._extensionPath, '/createProject', '创建新工程');
	}
}
