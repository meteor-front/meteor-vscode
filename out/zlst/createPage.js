"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatPagePanel = void 0;
const path = require("path");
const vscode = require("vscode");
const execa = require('execa');
const fs = require('fs');
const data = require("./data");
const index_1 = require("../util/index");
const util = new index_1.default();
/**
 * 创建工程面板
 */
class CreatPagePanel {
    // 构造函数
    constructor(panel, extensionPath) {
        this._disposables = [];
        this._panel = panel;
        this._extensionPath = extensionPath;
        // 设置webview中的html内容
        this._update();
        // 监听面板是否被disposed
        // 当用户关闭面板后者程序被关闭时发生
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        // Update the content based on view changes
        // this._panel.onDidChangeViewState(
        // 	e => {
        // 		if (this._panel.visible) {
        // 			this._update();
        // 		}
        // 	},
        // 	null,
        // 	this._disposables
        // );
        // 处理来自webview的信息
        this._panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'create':
                    // vscode.window.showErrorMessage(message.id + ' - ' + message.text);
                    this._create(message);
                    return;
                case 'selBaseDir':
                    this._selBaseDir();
                    return;
                case 'getPageConfig':
                    this.getPageConfig();
                    return;
                case 'modifyPageConfig':
                    this.modifyPageConfig(message);
                    return;
                case 'generatePage':
                    this.generatePage(message);
                    break;
            }
        }, null, this._disposables);
    }
    static createOrShow(extensionPath, activeTab) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // 当前面板存在，加载
        if (CreatPagePanel.currentPanel) {
            CreatPagePanel.currentPanel._panel.reveal(column);
            return;
        }
        CreatPagePanel.activeTab = activeTab || '1';
        // 否则创建一个新的面板.
        const panel = vscode.window.createWebviewPanel(CreatPagePanel.viewType, '创建新工程', column || vscode.ViewColumn.One, {
            // webview允许使用javascript
            enableScripts: true,
            // And restrict the webview to only loading content from our extension's `media` directory.
            localResourceRoots: [vscode.Uri.file(path.join(extensionPath, 'media'))]
        });
        CreatPagePanel.currentPanel = new CreatPagePanel(panel, extensionPath);
    }
    static revive(panel, extensionPath) {
        CreatPagePanel.currentPanel = new CreatPagePanel(panel, extensionPath);
    }
    // 生成页面
    generatePage(message) {
        let root = vscode.workspace.rootPath;
        if (!root) {
            return vscode.window.showErrorMessage('请先打开工程！');
        }
        for (let i = 0; i < message.components.length; i++) {
            const component = message.components[i];
            let componentPath = path.join(root, component.position, component.name);
            try {
                fs.writeFileSync(componentPath, component.code, 'utf-8');
            }
            catch (error) {
                vscode.window.showWarningMessage(error.message);
            }
        }
    }
    // 修改页面配置信息
    modifyPageConfig(message) {
        if (message.config.pageRootPath) {
            vscode.workspace.getConfiguration('zlst').update('pageRootPath', message.config.pageRootPath);
        }
        if (message.config.componentRootPath) {
            vscode.workspace.getConfiguration('zlst').update('componentRootPath', message.config.componentRootPath);
        }
        if (message.config.user) {
            vscode.workspace.getConfiguration('zlst').update('user', message.config.user);
        }
        this._panel.webview.postMessage({ command: 'modifyConfigDone' });
    }
    // 获取页面配置信息
    getPageConfig() {
        const config = vscode.workspace.getConfiguration('zlst');
        this._panel.webview.postMessage({ command: 'backConfig', config });
    }
    // 选择目录
    _selBaseDir() {
        return __awaiter(this, void 0, void 0, function* () {
            let rootPath = data.dateGet('rootPath');
            const options = {
                canSelectFolders: true,
                canSelectFiles: false,
                canSelectMany: false,
                openLabel: 'Open'
            };
            if (rootPath) {
                options.defaultUri = vscode.Uri.parse(rootPath);
            }
            const selectFolderUri = yield vscode.window.showOpenDialog(options);
            if (selectFolderUri && Array.isArray(selectFolderUri)) {
                let basePath = selectFolderUri[0].path;
                data.dataSave('rootPath', basePath);
                this._panel.webview.postMessage({ command: 'path', path: basePath });
            }
        });
    }
    // 创建工程
    _create(message) {
        if (!message.baseDir) {
            this._panel.webview.postMessage({ command: 'done' });
            return vscode.window.showWarningMessage('请选择项目目录！');
        }
        if (!message.projectName) {
            this._panel.webview.postMessage({ command: 'done' });
            return vscode.window.showWarningMessage('请输入工程名称！');
        }
        if (!message.url) {
            this._panel.webview.postMessage({ command: 'done' });
            return vscode.window.showWarningMessage('请输入模板地址！');
        }
        if (!message.hub) {
            this._panel.webview.postMessage({ command: 'done' });
            return vscode.window.showWarningMessage('请输入仓库地址！');
        }
        (() => __awaiter(this, void 0, void 0, function* () {
            let dir = path.join(message.baseDir, message.projectName);
            let isExist = false;
            try {
                fs.statSync(dir);
                isExist = true;
            }
            catch (error) {
            }
            let hasHub = false;
            // 判断git地址是否存在！
            try {
                yield execa('git', ['ls-remote', message.hub]);
                hasHub = true;
            }
            catch (error) {
            }
            if (hasHub) {
                this._panel.webview.postMessage({ command: 'done' });
                return vscode.window.showWarningMessage('仓库地址已存在');
            }
            try {
                if (isExist) {
                    yield execa('rm', ['-rf', dir]);
                }
                // 通过账号、密码登录
                if (/^http/gi.test(message.url) && message.account) {
                    let url = message.url.split('//');
                    message.url = `${url[0]}//${message.account.name}:${message.account.password}@${url[1]}`;
                }
                yield execa('git', ['clone', message.url, dir]);
                yield execa('rm', ['-rf', path.join(dir, '.git')]);
                yield execa('git', ['init'], {
                    cwd: dir
                });
                yield execa('git', ['add', '.'], {
                    cwd: dir
                });
                yield execa('git', ['commit', '-m', 'init'], {
                    cwd: dir
                });
                yield execa('git', ['remote', 'add', 'origin', message.hub], {
                    cwd: dir
                });
                yield execa('git', ['push', '-u', 'origin', 'master'], {
                    cwd: dir
                });
                this._panel.webview.postMessage({ command: 'done' });
                CreatPagePanel.projectDir = dir;
                vscode.window.showInformationMessage('恭喜，工程初始化成功！ [打开工程](command:zlst.openProject)');
            }
            catch (error) {
                if (error.message.includes('mkdir')) {
                    vscode.window.showErrorMessage('创建工程目录' + dir + '失败！');
                }
                else if (error.message.includes('git clone')) {
                    // 拷贝失败
                    if (error.message.includes('could not read Username')) {
                        if (/^http/gi.test(message.url)) {
                            // 没有账号，提示提供账号
                            this._panel.webview.postMessage({
                                command: 'account'
                            });
                        }
                        else {
                            vscode.window.showErrorMessage('暂未提供ssh账号登录功能！\n请使用http请求');
                        }
                    }
                    else {
                        vscode.window.showErrorMessage('拷贝模板工程失败！\n 请在本地命令行执行 git clone ' + message.url + ' 查看原因');
                    }
                }
                else if (error.message.includes('correct access rights')) {
                    vscode.window.showErrorMessage('请检查组名是否正确或是否拥有权限！');
                }
                this._panel.webview.postMessage({ command: 'done' });
            }
        }))();
    }
    doRefactor() {
        // Send a message to the webview webview.
        // You can send any JSON serializable data.
        this._panel.webview.postMessage({ command: 'refactor' });
    }
    dispose() {
        CreatPagePanel.currentPanel = undefined;
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
    _update() {
        const webview = this._panel.webview;
        // 基于状态改变webview内容
        this._updateForCreateProject(webview);
    }
    _updateForCreateProject(webview) {
        this._panel.title = 'Meteor';
        this._panel.webview.html = util.getHtmlForWebview(webview, this._extensionPath, '/page?tab=' + CreatPagePanel.activeTab, '创建页面');
    }
}
exports.CreatPagePanel = CreatPagePanel;
CreatPagePanel.viewType = 'zlstCreatProject';
CreatPagePanel.activeTab = '1';
//# sourceMappingURL=createPage.js.map