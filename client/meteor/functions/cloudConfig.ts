import * as path from 'path';
import * as vscode from 'vscode';
import { getHtmlForWebview } from '../utils/util';

/**
 * cloud配置页面
 */
export default class CloudPanel {
	// 跟踪面板，每次只让显示一个
	public static currentPanel: CloudPanel | undefined;

	public static readonly viewType = 'meteorCreatProject';
	public static projectDir: string;
  public hasWebview: boolean = false

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionPath: string;
	private _disposables: vscode.Disposable[] = [];
  private static config: any = {}

	public static createOrShow(extensionPath: string, config: any) {
    this.config = config
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;
		// 当前面板存在，加载
		if (CloudPanel.currentPanel) {
			CloudPanel.currentPanel._panel.reveal(column);
			return;
    }
		// 否则创建一个新的面板.
		const panel = vscode.window.createWebviewPanel(
			CloudPanel.viewType,
			'Meteor',
      column || vscode.ViewColumn.One,
			{
				// webview允许使用javascript
				enableScripts: true,

				// And restrict the webview to only loading content from our extension's `media` directory.
				localResourceRoots: [vscode.Uri.file(path.join(extensionPath, 'media'))]
			}
		);

		CloudPanel.currentPanel = new CloudPanel(panel, extensionPath);
	}

	public static revive(panel: vscode.WebviewPanel, extensionPath: string) {
		CloudPanel.currentPanel = new CloudPanel(panel, extensionPath);
	}

  // 构造函数
	private constructor(panel: vscode.WebviewPanel, extensionPath: string) {
		this._panel = panel;
		this._extensionPath = extensionPath;

		// 设置webview中的html内容
    if (!this.hasWebview) {
      this._update();
      this.hasWebview = true
    }

		// 监听面板是否被disposed
		// 当用户关闭面板后者程序被关闭时发生
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
          if (!this.hasWebview) {
            this._update();
            this.hasWebview = true
          }
				}
			},
			null,
			this._disposables
		);

		// 处理来自webview的信息
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'getCloudConfig':
						this.getCloudConfig();
						return;
					case 'cloudSave':
						this.cloudSave(message);
						return;
				}
			},
			null,
			this._disposables
		);
	}
	// 修改页面配置信息
	cloudSave(message: any) {
		if (message.config) {
      let cloudConfig: any = vscode.workspace.getConfiguration('meteor').get('cloudConfig')
      cloudConfig[CloudPanel.config.projectName] = JSON.stringify(message.config)
			vscode.workspace.getConfiguration('meteor').update('cloudConfig', cloudConfig, vscode.ConfigurationTarget.Global);
		}
		this._panel.webview.postMessage({ command: 'cloudSaveDone'});
	}
	// 获取页面配置信息
	getCloudConfig() {
		this._panel.webview.postMessage({ command: 'backCloudConfig', config: CloudPanel.config});
	}

	public doRefactor() {
		this._panel.webview.postMessage({ command: 'refactor' });
	}

	public dispose() {
		CloudPanel.currentPanel = undefined;

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
		this._panel.title = 'Meteor';
		this._panel.webview.html = getHtmlForWebview(webview, this._extensionPath, '/cloud', 'cloud配置');
	}
}
