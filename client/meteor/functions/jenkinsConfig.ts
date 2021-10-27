import * as path from 'path';
import * as vscode from 'vscode';
import { getHtmlForWebview } from '../utils/util';

/**
 * jenkins配置页面
 */
export default class JenkinsPanel {
	// 跟踪面板，每次只让显示一个
	public static currentPanel: JenkinsPanel | undefined;

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
		if (JenkinsPanel.currentPanel) {
			JenkinsPanel.currentPanel._panel.reveal(column);
			return;
    }
		// 否则创建一个新的面板.
		const panel = vscode.window.createWebviewPanel(
			JenkinsPanel.viewType,
			'Meteor',
      column || vscode.ViewColumn.One,
			{
				// webview允许使用javascript
				enableScripts: true,

				// And restrict the webview to only loading content from our extension's `media` directory.
				localResourceRoots: [vscode.Uri.file(path.join(extensionPath, 'media'))]
			}
		);

		JenkinsPanel.currentPanel = new JenkinsPanel(panel, extensionPath);
	}

	public static revive(panel: vscode.WebviewPanel, extensionPath: string) {
		JenkinsPanel.currentPanel = new JenkinsPanel(panel, extensionPath);
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
					case 'getJenkinsConfig':
						this.getJenkinsConfig();
						return;
					case 'jenkinsSave':
						this.jenkinsSave(message);
						return;
				}
			},
			null,
			this._disposables
		);
	}
	// 修改页面配置信息
	jenkinsSave(message: any) {
		if (message.config) {
      let jenkinsConfig: any = vscode.workspace.getConfiguration('meteor').get('jenkinsConfig')
      jenkinsConfig[JenkinsPanel.config.projectName] = JSON.stringify(message.config)
			vscode.workspace.getConfiguration('meteor').update('jenkinsConfig', jenkinsConfig, vscode.ConfigurationTarget.Global);
		}
		this._panel.webview.postMessage({ command: 'jenkinsSaveDone'});
	}
	// 获取页面配置信息
	getJenkinsConfig() {
		const config = vscode.workspace.getConfiguration('meteor');
    const url = config.get('jenkinsUrl')
    const token = config.get('jenkinsToken')
		this._panel.webview.postMessage({ command: 'backJenkinsConfig', config: {
      url: JenkinsPanel.config.url || url,
      job: JenkinsPanel.config.job || ''
    }});
	}

	public doRefactor() {
		this._panel.webview.postMessage({ command: 'refactor' });
	}

	public dispose() {
		JenkinsPanel.currentPanel = undefined;

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
		this._panel.webview.html = getHtmlForWebview(webview, this._extensionPath, '/jenkins', 'jenkins配置');
	}
}
