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
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const createProject_1 = require("./zlst/createProject");
const createPage_1 = require("./zlst/createPage");
const pageNew_1 = require("./zlst/pageNew");
const generatePage_1 = require("./zlst/generatePage");
const app_1 = require("./app");
const definitionProvider_1 = require("./definitionProvider");
const js_complete_1 = require("./js-complete");
const px_rem_1 = require("./px-rem");
const zlst_1 = require("./zlst/zlst");
const util_1 = require("./util/util");
const os = require("os");
function activate(context) {
    let app = new app_1.App();
    let completionItemProvider = new app_1.ElementCompletionItemProvider();
    let registrationHover = vscode.languages.registerHoverProvider('vue', new app_1.DocumentHoverProvider);
    let pxRem = new px_rem_1.PxRem();
    let jsCompletionItemProvider = new js_complete_1.JsCompletionItemProvider();
    // 构建中铝视拓对象
    const zlst = new zlst_1.default({
        context
    });
    // 为标签、属性提示提供自动完成功能, 关闭标签功能
    let completion = vscode.languages.registerCompletionItemProvider(['vue', 'javascript', 'html'], completionItemProvider, '', ':', '<', '"', "'", '/', '@', '(', '>', '{');
    let vueLanguageConfig = vscode.languages.setLanguageConfiguration('vue', { wordPattern: app.WORD_REG });
    let jsCompletion = vscode.languages.registerCompletionItemProvider(['javascript', 'html', 'vue'], jsCompletionItemProvider, '.', '(');
    // 函数补全函数
    let functionCompletionDisposable = vscode.commands.registerCommand('zlst.functionCompletion', () => {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        let txt = editor.document.lineAt(editor.selection.anchor.line).text;
        if (/.*@\w*=\"\w.*\"/gi.test(txt)) {
            // 定义方法，并跳到方法处
            zlst.generateMethod();
        }
        else {
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
    let zlstDefinition = vscode.languages.registerDefinitionProvider(['vue', 'javascript', 'html'], new definitionProvider_1.ZlstDefinitionProvider());
    // 创建工程
    let createProjectDisposable = vscode.commands.registerCommand('zlst.createProject', () => {
        createProject_1.CreatProjectPanel.createOrShow(context.extensionPath);
    });
    // 创建页面
    let createPageDisposable = vscode.commands.registerCommand('zlst.createPage', (activeTab) => {
        createPage_1.CreatPagePanel.createOrShow(context.extensionPath, activeTab);
    });
    // 生成页面
    let generatePageDisposable = vscode.commands.registerCommand('zlst.generatePage', () => {
        new generatePage_1.default(vscode.workspace.rootPath || '').generate();
    });
    // 打开工程目录
    let openProjectDisposable = vscode.commands.registerCommand("zlst.openProject", (node) => {
        let projectDir = createProject_1.CreatProjectPanel.projectDir;
        if (os.platform().includes('win')) {
            projectDir = '/' + projectDir.replace(/\\/gi, '/');
        }
        vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.parse(projectDir), false)
            .then(value => ({}), // done
        // done
        value => vscode.window.showInformationMessage("打开工程失败！"));
    });
    // 页面生成
    let pageNewDisposable = vscode.commands.registerCommand('zlst.pageNew', (uri) => {
        pageNew_1.default.showQuickPick(context, uri);
    });
    // 组件生成
    let componentNewDisposable = vscode.commands.registerCommand('zlst.componentNew', (uri) => {
        pageNew_1.default.showComponentQuickPick(context, uri);
    });
    // 接口生成
    let apiDisposable = vscode.commands.registerCommand('zlst.api', (uri) => {
        pageNew_1.default.api(context, uri);
    });
    // 同步数据
    let zlstSyncDispoable = vscode.commands.registerCommand('zlst.sync', () => __awaiter(this, void 0, void 0, function* () {
        zlst.sync();
    }));
    // swagger生成api
    let zlstSwaggerDispoable = vscode.commands.registerCommand('zlst.swagger', () => __awaiter(this, void 0, void 0, function* () {
        zlst.swagger();
    }));
    // 测试outline
    let zlstOutlineTest = vscode.commands.registerCommand('zlst.outlineTest', () => {
        zlst.outline();
    });
    // 打开官网
    let openOfficialDisposable = vscode.commands.registerCommand('zlst.openOfficial', (uri) => {
        util_1.default.open('http://www.80fight.cn');
    });
    context.subscriptions.push(app, completion, vueLanguageConfig, registrationHover, functionCompletionDisposable, deleteCompleteDisposable, zlstDefinition, pxRemDisposable, pxToRemDisposable, remToPxDisposable, blockSelectDisposable, jsCompletion, createProjectDisposable, openProjectDisposable, createPageDisposable, generatePageDisposable, pageNewDisposable, apiDisposable, zlstSyncDispoable, componentNewDisposable, zlstSwaggerDispoable, openOfficialDisposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map