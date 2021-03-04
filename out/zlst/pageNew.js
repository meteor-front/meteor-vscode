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
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const util_1 = require("../util/util");
const vueProps_1 = require("../util/vueProps");
const os = require("os");
class PageNew {
    // 通过配置设置页面参数
    static setPageByConfig(config) {
        // 过滤暂时不做 读取工程的package.json
        // let projectCategory = 'miniapp';
        // try {
        //   let packageInfo: any = fs.readFileSync(path.join(PageNew.projectRoot, 'package.json'), 'utf-8');
        //   packageInfo = JSON.parse(packageInfo);
        //   if ((packageInfo.dependencies && packageInfo.dependencies.vue) || packageInfo.devDependencies && packageInfo.devDependencies.vue) {
        //     projectCategory = 'vue';
        //   } else if ((packageInfo.dependencies && packageInfo.dependencies.react) || packageInfo.devDependencies && packageInfo.devDependencies.react) {
        //     projectCategory = 'react';
        //   }
        // } catch (error) {
        // }
        let conf = JSON.parse(config);
        let pages = [];
        for (const key in conf) {
            pages.push({
                label: key,
                description: `(${conf[key].category})`
            });
            // if (conf[key].category === projectCategory) {
            // }
        }
        PageNew.pageTemplateList = Object.assign(PageNew.pageTemplateList, conf);
        PageNew.pages = PageNew.pages.concat(pages);
    }
    static init(context, uri) {
        return __awaiter(this, void 0, void 0, function* () {
            if (uri) {
                PageNew.uri = uri;
            }
            else if (vscode.workspace.workspaceFolders) {
                PageNew.uri = vscode.workspace.workspaceFolders[0].uri;
                PageNew.noSelectFolder = true;
            }
            PageNew.context = context;
            PageNew.pageTemplateList = {};
            PageNew.pages = [];
            PageNew.setProjectRoot();
        });
    }
    static setPage(context) {
        // 插件配置信息
        let configPath = path.join(context.extensionUri.path, PageNew.templateRoot, 'page.json');
        try {
            configPath = util_1.default.winRootPathHandle(configPath);
            let config = fs.readFileSync(configPath, 'utf-8');
            PageNew.setPageByConfig(config);
        }
        catch (error) {
            vscode.window.showWarningMessage('插件中page.json文件出错！');
        }
        // 本地页面配置信息
        const config = vscode.workspace.getConfiguration('zlst');
        PageNew.zlstConfig = config;
        if (config.rootPathLocalPage) {
            let localPageConfig = path.join(config.rootPathLocalPage, 'page.json');
            try {
                localPageConfig = util_1.default.winRootPathHandle(localPageConfig);
                let config = fs.readFileSync(localPageConfig, 'utf-8');
                PageNew.setPageByConfig(config);
            }
            catch (error) {
                // 本地未设置
            }
        }
    }
    static getQuickPickItems() {
        const items = [];
        PageNew.pages.forEach((item) => {
            items.push({
                label: item.label,
                description: item.description
            });
        });
        return items;
    }
    /**
     * 显示选择弹窗
     * @param context
     * @param uri
     */
    static showQuickPick(context, uri) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. 初始化，从配置文件获取页面列表
            PageNew.init(context, uri);
            PageNew.way = PageNew.GenerateWay.PAGE;
            PageNew.setPage(context);
            // 2. 获取选择项
            const templatePick = vscode.window.createQuickPick();
            templatePick.title = '生成页面';
            templatePick.placeholder = '选择模板';
            class TemplateButton {
                constructor(iconPath, tooltip) {
                    this.iconPath = iconPath;
                    this.tooltip = tooltip;
                }
            }
            templatePick.buttons = [new TemplateButton({
                    dark: vscode.Uri.file(context.asAbsolutePath('asset/dark/document.svg')),
                    light: vscode.Uri.file(context.asAbsolutePath('asset/dark/document.svg')),
                }, '使用文档'), new TemplateButton({
                    dark: vscode.Uri.file(context.asAbsolutePath('asset/dark/refresh.svg')),
                    light: vscode.Uri.file(context.asAbsolutePath('asset/light/refresh.svg')),
                }, '同步'), new TemplateButton({
                    dark: vscode.Uri.file(context.asAbsolutePath('asset/dark/add.svg')),
                    light: vscode.Uri.file(context.asAbsolutePath('asset/light/add.svg')),
                }, '添加页面')];
            templatePick.items = PageNew.getQuickPickItems();
            templatePick.onDidChangeSelection(selection => {
                templatePick.hide();
                // 打开工程才能继续
                if (vscode.workspace.workspaceFolders && selection[0] && selection[0].label) {
                    PageNew.pick = selection[0].label;
                    PageNew.showGenerateNameInput(selection[0].description || '');
                }
                else {
                    if (!vscode.workspace.workspaceFolders) {
                        vscode.window.showInformationMessage('请先打开工程');
                    }
                }
            });
            templatePick.onDidTriggerButton(item => {
                switch (item.tooltip) {
                    case '使用文档':
                        util_1.default.open('http://www.80fight.cn');
                        break;
                    case '同步':
                        vscode.commands.executeCommand('zlst.sync').then((res) => {
                            setTimeout(() => {
                                PageNew.pages = [];
                                PageNew.setPage(context);
                                templatePick.items = PageNew.getQuickPickItems();
                            }, 1000);
                        });
                        break;
                    case '添加页面':
                        vscode.commands.executeCommand('zlst.createPage');
                        break;
                    default:
                        break;
                }
            }),
                templatePick.onDidHide(() => templatePick.dispose());
            templatePick.show();
        });
    }
    static setComponent(context) {
        // 插件配置信息
        let configPath = path.join(context.extensionUri.path, PageNew.componentRoot, 'component.json');
        try {
            configPath = util_1.default.winRootPathHandle(configPath);
            let config = fs.readFileSync(configPath, 'utf-8');
            PageNew.setPageByConfig(config);
        }
        catch (error) {
            vscode.window.showWarningMessage('目前还没有内置组件');
        }
        // 本地页面配置信息
        const config = vscode.workspace.getConfiguration('zlst');
        PageNew.zlstConfig = config;
        if (config.rootPathLocalComponent) {
            let localPageConfig = path.join(config.rootPathLocalComponent, 'component.json');
            try {
                localPageConfig = util_1.default.winRootPathHandle(localPageConfig);
                let config = fs.readFileSync(localPageConfig, 'utf-8');
                PageNew.setPageByConfig(config);
            }
            catch (error) {
                // 本地未设置
            }
        }
    }
    /**
     * 显示组件选择弹窗
     * @param context
     * @param uri
     */
    static showComponentQuickPick(context, uri) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. 初始化，从配置文件获取页面列表
            PageNew.init(context, uri);
            PageNew.way = PageNew.GenerateWay.COMPONENT;
            PageNew.setComponent(context);
            // 2. 获取选择项
            const templatePick = vscode.window.createQuickPick();
            templatePick.title = '生成组件';
            templatePick.placeholder = '选择模板';
            class TemplateButton {
                constructor(iconPath, tooltip) {
                    this.iconPath = iconPath;
                    this.tooltip = tooltip;
                }
            }
            templatePick.buttons = [new TemplateButton({
                    dark: vscode.Uri.file(context.asAbsolutePath('asset/dark/document.svg')),
                    light: vscode.Uri.file(context.asAbsolutePath('asset/dark/document.svg')),
                }, '使用文档'), new TemplateButton({
                    dark: vscode.Uri.file(context.asAbsolutePath('asset/dark/refresh.svg')),
                    light: vscode.Uri.file(context.asAbsolutePath('asset/light/refresh.svg')),
                }, '同步'), new TemplateButton({
                    dark: vscode.Uri.file(context.asAbsolutePath('asset/dark/add.svg')),
                    light: vscode.Uri.file(context.asAbsolutePath('asset/light/add.svg')),
                }, '添加组件')];
            templatePick.items = PageNew.getQuickPickItems();
            templatePick.onDidChangeSelection(selection => {
                templatePick.hide();
                // 打开工程才能继续
                if (vscode.workspace.workspaceFolders && selection[0] && selection[0].label) {
                    PageNew.pageName = selection[0].label;
                    PageNew.pick = selection[0].label;
                    PageNew.generate();
                }
                else {
                    if (!vscode.workspace.workspaceFolders) {
                        vscode.window.showInformationMessage('请先打开工程');
                    }
                }
            });
            templatePick.onDidTriggerButton(item => {
                switch (item.tooltip) {
                    case '使用文档':
                        util_1.default.open('http://www.80fight.cn');
                        break;
                    case '同步':
                        vscode.commands.executeCommand('zlst.sync').then((res) => {
                            setTimeout(() => {
                                PageNew.pages = [];
                                PageNew.setComponent(context);
                                templatePick.items = PageNew.getQuickPickItems();
                            }, 1000);
                        });
                        break;
                    case '添加组件':
                        vscode.commands.executeCommand('zlst.createPage', '2');
                        break;
                    default:
                        break;
                }
            }),
                templatePick.onDidHide(() => templatePick.dispose());
            templatePick.show();
        });
    }
    /**
     * 显示输入名称弹框
     */
    static showGenerateNameInput(category) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(category);
            let placeholder = '前缀 - 页面生成规则为【前缀+文件名】';
            if (category === '(miniapp)') {
                placeholder = '页面名称';
            }
            let name = yield vscode.window.showInputBox({
                placeHolder: placeholder
            });
            if (name) {
                PageNew.pageName = name;
                PageNew.generate();
            }
        });
    }
    /**
     * vue代码块填充
     * @param page
     */
    static codeBlockFillVue(page) {
        let editor = vscode.window.activeTextEditor;
        if (editor) {
            let templatePath = path.join(PageNew.context.extensionUri.path, PageNew.way === PageNew.GenerateWay.PAGE ? PageNew.templateRoot : PageNew.componentRoot, page.template + 'index.txt');
            try {
                let template = fs.readFileSync(templatePath, 'utf-8');
                let templateArr = JSON.parse(template);
                let names = [];
                let templateObj = {};
                for (let i = 0; i < templateArr.length; i++) {
                    const tempateItem = templateArr[i];
                    names.push(tempateItem.name);
                    templateObj[tempateItem.name] = tempateItem.code;
                }
                vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', editor.document.uri).then((symbols) => __awaiter(this, void 0, void 0, function* () {
                    // 拼装插入内容位置、内容
                    let insertList = [];
                    if (symbols && symbols.length === 1) {
                        let doc = symbols[0];
                        let defaultLine = 0;
                        doc.children.forEach((oneLevelItem) => {
                            if (oneLevelItem.name === 'template' && names.includes('template')) {
                                names.splice(names.indexOf('template'), 1);
                                insertList.push({
                                    position: (editor === null || editor === void 0 ? void 0 : editor.selection.active) || oneLevelItem.location.range._end,
                                    code: templateObj['template']
                                });
                            }
                            else if (oneLevelItem.name === 'script') {
                                if (names.includes('import')) {
                                    names.splice(names.indexOf('import'), 1);
                                    let line = oneLevelItem.location.range._start._line;
                                    insertList.push({
                                        position: {
                                            _line: line,
                                            _character: editor === null || editor === void 0 ? void 0 : editor.document.lineAt(line).text.length
                                        },
                                        code: '\n' + templateObj['import']
                                    });
                                }
                                oneLevelItem.children.forEach((scriptChild) => {
                                    if (scriptChild.name === 'default') {
                                        defaultLine = scriptChild.location.range._start._line;
                                        // vue属性
                                        scriptChild.children.forEach((vueProp) => {
                                            if (names.includes(vueProp.name)) {
                                                names.splice(names.indexOf(vueProp.name), 1);
                                                let line = vueProp.kind === 5 ? vueProp.location.range._end._line - 2 : vueProp.location.range._end._line - 1;
                                                let code = '';
                                                if (vueProp.children.length > 0) {
                                                    code += ',\n';
                                                }
                                                code += templateObj[vueProp.name];
                                                insertList.push({
                                                    position: {
                                                        _line: line,
                                                        _character: editor === null || editor === void 0 ? void 0 : editor.document.lineAt(line).text.length
                                                    },
                                                    code: code
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                            else if (oneLevelItem.name === 'style' && names.includes('style')) {
                                names.splice(names.indexOf('style'), 1);
                                let line = oneLevelItem.location.range._end._line - 1;
                                insertList.push({
                                    position: {
                                        _line: line,
                                        _character: editor === null || editor === void 0 ? void 0 : editor.document.lineAt(line).text.length
                                    },
                                    code: '\n' + templateObj['style']
                                });
                            }
                        });
                        names.forEach((name) => {
                            if (vueProps_1.default.vue[name]) {
                                insertList.push({
                                    position: {
                                        _line: defaultLine,
                                        _character: editor === null || editor === void 0 ? void 0 : editor.document.lineAt(defaultLine).text.length
                                    },
                                    code: '\n' + vueProps_1.default.vue[name].replace(/##/gi, templateObj[name])
                                });
                            }
                        });
                        yield (editor === null || editor === void 0 ? void 0 : editor.edit((editBuilder) => {
                            insertList.forEach((insert) => {
                                editBuilder.insert(new vscode.Position(insert.position._line, insert.position._character), insert.code);
                            });
                        }));
                        setTimeout(() => {
                            vscode.commands.executeCommand('eslint.executeAutofix');
                        }, 300);
                    }
                    else if (templateObj['template'] && (editor === null || editor === void 0 ? void 0 : editor.selection.active)) {
                        yield (editor === null || editor === void 0 ? void 0 : editor.edit((editBuilder) => {
                            editBuilder.insert(editor === null || editor === void 0 ? void 0 : editor.selection.active, templateObj['template']);
                        }));
                        setTimeout(() => {
                            vscode.commands.executeCommand('eslint.executeAutofix');
                        }, 300);
                    }
                }));
            }
            catch (error) {
            }
        }
    }
    /**
     * 小程序代码块生成
     * @param page
     */
    static codeBlockFillMiniapp(page) {
        var _a, _b;
        let editor = vscode.window.activeTextEditor;
        if (editor) {
            let templatePath = path.join(PageNew.context.extensionUri.path, PageNew.way === PageNew.GenerateWay.PAGE ? PageNew.templateRoot : PageNew.componentRoot, page.template + 'index.txt');
            try {
                let template = fs.readFileSync(templatePath, 'utf-8');
                let templateArr = JSON.parse(template);
                let names = [];
                let templateObj = {};
                // wxml wxss json
                let has = ['', '', '', ''];
                for (let i = 0; i < templateArr.length; i++) {
                    const tempateItem = templateArr[i];
                    if (tempateItem.name === 'wxml') {
                        has[0] = tempateItem.code;
                    }
                    else if (tempateItem.name === 'wxss') {
                        has[1] = tempateItem.code;
                    }
                    else if (tempateItem.name === 'json') {
                        has[2] = tempateItem.code;
                    }
                    else {
                        names.push(tempateItem.name);
                        templateObj[tempateItem.name] = tempateItem.code;
                    }
                }
                // 小程序分五个文件处理
                let filePath = editor.document.uri.path;
                let fileName = filePath.replace(/.*\/(.*)\..*/gi, '$1');
                let docFolder = path.join(filePath, '..');
                // wxml文件
                if (has[0]) {
                    let pathXml = path.join(docFolder, fileName + '.wxml');
                    try {
                        fs.statSync(pathXml);
                        if (filePath.endsWith('wxml')) {
                            editor === null || editor === void 0 ? void 0 : editor.edit((editBuilder) => {
                                editBuilder.insert(editor === null || editor === void 0 ? void 0 : editor.selection.active, has[0]);
                            });
                        }
                        else {
                            pathXml = util_1.default.winRootPathHandle(pathXml);
                            fs.appendFileSync(pathXml, '\n' + has[0]);
                        }
                    }
                    catch (error) {
                        pathXml = util_1.default.winRootPathHandle(pathXml);
                        fs.writeFileSync(pathXml, has[0]);
                    }
                }
                // wxss
                if (has[1]) {
                    let pathWxss = path.join(docFolder, fileName + '.wxss');
                    try {
                        fs.statSync(pathWxss);
                        if (filePath.endsWith('wxss')) {
                            editor === null || editor === void 0 ? void 0 : editor.edit((editBuilder) => {
                                editBuilder.insert(editor === null || editor === void 0 ? void 0 : editor.selection.active, has[1]);
                            });
                        }
                        else {
                            pathWxss = util_1.default.winRootPathHandle(pathWxss);
                            fs.appendFileSync(pathWxss, '\n' + has[1]);
                        }
                    }
                    catch (error) {
                        pathWxss = util_1.default.winRootPathHandle(pathWxss);
                        fs.writeFileSync(pathWxss, has[1]);
                    }
                }
                // json
                if (has[2]) {
                    let pathJson = path.join(docFolder, fileName + '.json');
                    try {
                        fs.statSync(pathJson);
                        pathJson = util_1.default.winRootPathHandle(pathJson);
                        let jsonFile = fs.readFileSync(pathJson, 'utf-8');
                        let codeArr = has[2].split('\n');
                        let jsonArr = jsonFile.split('\n');
                        let hasComponents = false;
                        let endComponent = 0;
                        let position = {
                            line: 0,
                            character: 0,
                            space: ''
                        };
                        let componentList = [];
                        for (let i = 0; i < jsonArr.length; i++) {
                            const jsonLine = jsonArr[i];
                            if (jsonLine.includes('usingComponents')) {
                                hasComponents = true;
                            }
                            if (hasComponents && endComponent === 0 && jsonLine.includes('}')) {
                                endComponent = i;
                                position = {
                                    line: i - 1,
                                    character: jsonArr[i - 1].length,
                                    space: jsonArr[i - 1].replace(jsonArr[i - 1].trim(), '')
                                };
                            }
                            if (hasComponents && !endComponent) {
                                componentList.push(jsonLine.replace(/[\s\"\',]/gi, '').split(':')[0]);
                            }
                        }
                        if (position.line === 0 && position.character === 0) {
                            position = {
                                line: jsonArr.length - 1,
                                character: jsonArr[jsonArr.length - 1].length,
                                space: jsonArr[jsonArr.length - 1].replace(jsonArr[jsonArr.length - 1].trim(), '')
                            };
                        }
                        let codes = '';
                        codeArr.forEach((code) => {
                            let codeItem = code.replace(/[\s\"\',]/gi, '').split(':');
                            if (codeItem.length === 2) {
                                if (componentList.indexOf(codeItem[0]) === -1) {
                                    codes += `,\n${position.space}"${codeItem[0]}": "${codeItem[1]}"`;
                                }
                            }
                        });
                        if (!hasComponents) {
                            codes = codes.substr(1, codes.length);
                            codes = `${position.space}"usingComponents": {\n` + codes + `\n${position.space}}`;
                        }
                        else if (componentList.length === 0) {
                            codes = codes.substr(1, codes.length);
                        }
                        let jsonStr = '';
                        for (let i = 0; i < jsonArr.length; i++) {
                            jsonStr += jsonArr[i];
                            if (i === position.line) {
                                jsonStr += codes + '\n';
                            }
                            else {
                                jsonStr += '\n';
                            }
                        }
                        fs.writeFileSync(pathJson, jsonStr);
                    }
                    catch (error) {
                        pathJson = util_1.default.winRootPathHandle(pathJson);
                        fs.writeFileSync(pathJson, `{
  "navigationBarTitleText": "",
  "usingComponents": {
    ${has[2]}
  }
}`);
                    }
                }
                // js文件处理
                let pathJs = path.join(docFolder, fileName + '.js');
                try {
                    pathJs = util_1.default.winRootPathHandle(pathJs);
                    let jsFile = fs.readFileSync(pathJs, 'utf-8');
                    let jsArr = jsFile.split('\n');
                    let tag = {
                        name: 'import',
                        kind: '1',
                        beginLine: 0
                    };
                    let braceLeftCount = 0;
                    let braceRight = 0;
                    let braceLeft = 0;
                    let jsFill = '';
                    let isInPage = false;
                    for (let i = 0; i < jsArr.length; i++) {
                        const jsCont = jsArr[i];
                        if (tag.name === 'import' && (!jsCont.trim() || jsCont.includes('Page('))) {
                            names.splice(names.indexOf('import'), 1);
                            tag.name = '';
                            if (templateObj['import']) {
                                jsFill += templateObj['import'] + '\n';
                            }
                        }
                        if (jsCont.includes('Page(')) {
                            isInPage = true;
                        }
                        if (braceLeftCount === 1) {
                            // 获取当前标签
                            tag.name = jsCont.replace(/\s*(async\s*)?(\w*)\s*(:|\().*/gi, '$2');
                            tag.beginLine = i;
                            if (jsCont.includes('(') && jsCont.includes(')')) {
                                tag.kind = '2';
                            }
                            else {
                                tag.kind = '1';
                            }
                        }
                        braceLeft = ((_a = jsCont.match(/{/gi)) === null || _a === void 0 ? void 0 : _a.length) || 0;
                        braceRight = ((_b = jsCont.match(/}/gi)) === null || _b === void 0 ? void 0 : _b.length) || 0;
                        braceLeftCount += braceLeft - braceRight;
                        if (braceLeftCount === 1 && tag.name) {
                            if (tag.kind === '1') {
                                if (i > tag.beginLine + 1) {
                                    // 有属性
                                    let space = jsArr[i - 1].replace(jsArr[i - 1].trim(), '');
                                    if (templateObj[tag.name]) {
                                        names.splice(names.indexOf(tag.name), 1);
                                        jsFill = jsFill.substr(0, jsFill.length - 1);
                                        if (!jsFill.endsWith(',')) {
                                            jsFill += ',';
                                        }
                                        jsFill += '\n' + space + templateObj[tag.name] + '\n';
                                    }
                                }
                                else {
                                    // 没有属性
                                    let space = jsArr[i].replace(jsArr[i].trim(), '') + '  ';
                                    if (templateObj[tag.name]) {
                                        names.splice(names.indexOf(tag.name), 1);
                                        jsFill = jsFill.substr(0, jsFill.length - 1);
                                        if (!jsFill.endsWith(',')) {
                                            jsFill += ',';
                                        }
                                        jsFill += '\n' + space + templateObj[tag.name] + '\n';
                                    }
                                }
                            }
                            else if (tag.kind === '2') {
                                if (i > tag.beginLine + 1) {
                                    // 有内容
                                    let space = jsArr[i - 1].replace(jsArr[i - 1].trim(), '');
                                    if (templateObj[tag.name]) {
                                        names.splice(names.indexOf(tag.name), 1);
                                        jsFill = jsFill.substr(0, jsFill.length - 1);
                                        jsFill += '\n' + space + templateObj[tag.name] + '\n';
                                    }
                                }
                                else {
                                    // 没有内容
                                    let space = jsArr[i].replace(jsArr[i].trim(), '') + '  ';
                                    if (templateObj[tag.name]) {
                                        names.splice(names.indexOf(tag.name), 1);
                                        jsFill = jsFill.substr(0, jsFill.length - 1);
                                        jsFill += '\n' + space + templateObj[tag.name] + '\n';
                                    }
                                }
                            }
                        }
                        if (braceLeftCount === 0 && isInPage && tag.name) {
                            tag.name = '';
                            let space = jsArr[i - 1].replace(jsArr[i - 1].trim(), '');
                            if (templateObj['js']) {
                                names.splice(names.indexOf('js'), 1);
                                jsFill = jsFill.substr(0, jsFill.length - 1);
                                if (!jsFill.endsWith(',')) {
                                    jsFill += ',';
                                }
                                jsFill += '\n' + space + templateObj['js'] + '\n';
                            }
                            // 有未处理的代码段
                            names.forEach((name) => {
                                if (templateObj[name]) {
                                    jsFill = jsFill.substr(0, jsFill.length - 1);
                                    if (!jsFill.endsWith(',')) {
                                        jsFill += ',';
                                    }
                                    jsFill += `\n${space}${name}() {
${space}  ${templateObj[name]}
${space}},\n`;
                                }
                            });
                        }
                        jsFill += jsCont + '\n';
                        fs.writeFileSync(pathJs, jsFill);
                    }
                }
                catch (error) {
                }
            }
            catch (error) {
            }
        }
    }
    /**
     * 代码块填充
     * @param page
     */
    static codeBlockFill(page, category) {
        // 规定所有文件都取自 index.txt
        switch (category) {
            case 'vue':
                PageNew.codeBlockFillVue(page);
                break;
            case 'miniapp':
                PageNew.codeBlockFillMiniapp(page);
                break;
            default:
                break;
        }
    }
    /**
     * 页面生成
     */
    static generate() {
        return __awaiter(this, void 0, void 0, function* () {
            //  1. 获取页面列表
            let pagesInfo = PageNew.pageTemplateList[PageNew.pick];
            // 2. 读取相关页面，并替换为页面名称
            let pages = pagesInfo.pages;
            pages.forEach(page => {
                let pagePath = '';
                switch (page.type) {
                    case 'page':
                    case 'component':
                        if (pagesInfo.block === 1) {
                            // 代码块
                            PageNew.codeBlockFill(page, pagesInfo.category);
                        }
                        else {
                            // 名称组装
                            let name = PageNew.pageName + page.fileName[0].toUpperCase() + page.fileName.substr(1, page.fileName.length);
                            if (pagesInfo.category === 'miniapp') {
                                name = PageNew.pageName;
                            }
                            if (PageNew.noSelectFolder) {
                                if (page.type === 'page') {
                                    pagePath = path.join(PageNew.uri.path, PageNew.zlstConfig.rootPathPage, name + page.poster);
                                }
                                else {
                                    pagePath = path.join(PageNew.uri.path, PageNew.zlstConfig.rootPathComponent, name + page.poster);
                                }
                            }
                            else {
                                pagePath = path.join(PageNew.uri.path, name + page.poster);
                            }
                            try {
                                pagePath = util_1.default.winRootPathHandle(pagePath);
                                fs.statSync(pagePath);
                            }
                            catch (error) {
                                PageNew.fileGenerate(pagePath, path.join(PageNew.context.extensionUri.path, PageNew.way === PageNew.GenerateWay.PAGE ? PageNew.templateRoot : PageNew.componentRoot, page.template), page.type, {});
                            }
                        }
                        break;
                    case 'store':
                        let storeJs = path.join(PageNew.projectRoot, PageNew.zlstConfig.rootPathStore, 'modules', PageNew.pageName + '.js');
                        let storeIndexJs = path.join(PageNew.projectRoot, PageNew.zlstConfig.rootPathStore, 'index.js');
                        try {
                            storeJs = util_1.default.winRootPathHandle(storeJs);
                            fs.statSync(storeJs);
                        }
                        catch (error) {
                            PageNew.fileGenerate(storeJs, path.join(PageNew.context.extensionUri.path, PageNew.templateRoot, page.template), 'file', {});
                            PageNew.fileGenerate(storeIndexJs, storeIndexJs, page.type, {});
                        }
                        break;
                    case 'api':
                        pagePath = path.join(PageNew.projectRoot, PageNew.zlstConfig.rootPathApi, PageNew.pageName + '.js');
                        try {
                            pagePath = util_1.default.winRootPathHandle(pagePath);
                            fs.statSync(pagePath);
                        }
                        catch (error) {
                            PageNew.fileGenerate(pagePath, path.join(PageNew.context.extensionUri.path, PageNew.templateRoot, page.template), page.type, {});
                        }
                        break;
                    default:
                        break;
                }
            });
        });
    }
    // 设置工程根路径
    static setProjectRoot() {
        if (vscode.workspace.workspaceFolders) {
            vscode.workspace.workspaceFolders.forEach(workspaceFolder => {
                if (PageNew.uri.path.includes(workspaceFolder.uri.path)) {
                    PageNew.projectRoot = workspaceFolder.uri.path;
                }
            });
        }
    }
    // 文件生成
    static fileGenerate(pagePath, template, type, options) {
        return __awaiter(this, void 0, void 0, function* () {
            // 读取模板文件，替换，生成
            template = util_1.default.winRootPathHandle(template);
            let tempStr = fs.readFileSync(template, 'utf-8');
            if (type === 'page' || type === 'component') {
                tempStr = tempStr.replace(/\$\$/gi, PageNew.pageName).replace(/##/gi, PageNew.pageName[0].toUpperCase() + PageNew.pageName.substr(1, PageNew.pageName.length));
            }
            else if (type === 'store') {
                // 存储
                let tempArr = tempStr.split('\n');
                let tempContent = tempArr[0] + '\n';
                let len = tempArr.length;
                for (let i = 1; i < len; i++) {
                    const temp = tempArr[i];
                    if (i + 1 === len) {
                        tempContent += temp;
                    }
                    else if (tempArr[i - 1].includes('import ') && !temp.includes('import ')) {
                        tempContent += `import ${PageNew.pageName} from './modules/${PageNew.pageName}'\n`;
                        tempContent += temp + '\n';
                    }
                    else if (tempArr[i - 1].includes('modules:') && !temp.includes('modules:')) {
                        let tempTrim = temp.trim();
                        tempContent += temp.substr(0, temp.indexOf(tempTrim)) + `${PageNew.pageName},\n`;
                        tempContent += temp + '\n';
                    }
                    else {
                        tempContent += temp + '\n';
                    }
                }
                tempStr = tempContent;
            }
            else if (type === 'router') {
                // 路由操作
                let tempArr = tempStr.split('\n');
                let tempContent = tempArr[0] + '\n';
                let len = tempArr.length;
                let rootFound = false; // 找到 '/'
                for (let i = 1; i < len; i++) {
                    const temp = tempArr[i];
                    if (temp.includes("'/'")) {
                        rootFound = true;
                    }
                    if (i + 1 === len) {
                        tempContent += temp;
                    }
                    else if (rootFound && temp.includes('children')) {
                        let tempTrim = temp.trim();
                        let space = temp.substr(0, temp.indexOf(tempTrim));
                        tempContent += temp + '\n';
                        tempContent += options.routers.replace(/#/gi, space);
                        rootFound = false;
                    }
                    else {
                        tempContent += temp + '\n';
                    }
                }
                tempStr = tempContent;
            }
            else if (type === 'apiEach') {
                // 单个api生成
                tempStr += options.api;
            }
            else if (type === 'apiEachStore') {
                // 单个api对应的store
                let apiPath = options.apiStore.apiPath.replace(/.js/, '');
                tempStr = tempStr.replace(/##/gi, apiPath);
                let tempArr = tempStr.split('\n');
                let tempContent = '';
                let len = tempArr.length;
                let step = 1; // 1：import 2： state 3: mutations 4: actions 5: 结束
                for (let i = 0; i < len; i++) {
                    const temp = tempArr[i];
                    if (i + 1 === len) {
                        tempContent += temp;
                    }
                    else if (step === 1) {
                        if (temp.includes("/" + apiPath + "'")) {
                            step = 2;
                            if (temp.includes('{}')) {
                                tempContent += temp.replace(/\s?}/gi, ` ${options.apiStore.apiName} }`);
                            }
                            else {
                                tempContent += temp.replace(/\s?}/gi, `, ${options.apiStore.apiName} }`);
                            }
                            tempContent += '\n';
                            continue;
                        }
                        else {
                            tempContent += temp + '\n';
                        }
                    }
                    else if (step === 2) {
                        if (temp.includes('state') && !/.*state.*\(.*\).*{.*/gi.test(temp)) {
                            step = 3;
                            tempContent += temp + '\n';
                            continue;
                        }
                        if (temp.includes('return')) {
                            step = 3;
                            tempContent += temp + '\n';
                        }
                        else {
                            tempContent += temp + '\n';
                        }
                    }
                    else if (step === 3) {
                        if (temp.includes('mutations')) {
                            step = 4;
                            tempContent += temp + '\n';
                            let tempTrim = temp.trim();
                            let space = temp.substr(0, temp.indexOf(tempTrim));
                            if (tempArr[i + 1]) {
                                // 里面没有内容
                                if (tempArr[i + 1].endsWith('}')) {
                                    tempContent += space + '  ' + options.apiStore.mutations + '\n';
                                }
                                else {
                                    tempContent += space + '  ' + options.apiStore.mutations + ',\n';
                                }
                            }
                        }
                        else {
                            tempContent += temp + '\n';
                        }
                    }
                    else if (step === 4) {
                        if (temp.includes('actions')) {
                            step = 5;
                            tempContent += temp + '\n';
                            let tempTrim = temp.trim();
                            let space = temp.substr(0, temp.indexOf(tempTrim));
                            if (tempArr[i + 1].endsWith('}')) {
                                tempContent += space + '  ' + options.apiStore.actions + '\n';
                            }
                            else {
                                tempContent += space + '  ' + options.apiStore.actions + ',\n';
                            }
                        }
                        else {
                            tempContent += temp + '\n';
                        }
                    }
                    else {
                        tempContent += temp + '\n';
                    }
                }
                tempStr = tempContent;
            }
            pagePath = util_1.default.winRootPathHandle(pagePath);
            try {
                fs.writeFileSync(pagePath, tempStr);
            }
            catch (error) {
            }
        });
    }
    static api(context, uri) {
        return __awaiter(this, void 0, void 0, function* () {
            // 1. 初始化
            PageNew.context = context;
            let activeEditor = vscode.window.activeTextEditor;
            let sfs = vscode.workspace.workspaceFolders;
            if (activeEditor || (sfs && sfs.length === 1)) {
                if (activeEditor) {
                    PageNew.uri = activeEditor.document.uri;
                }
                else if (sfs) {
                    PageNew.uri = sfs[0].uri;
                }
                PageNew.setProjectRoot();
                let apiPathRoot = path.join(PageNew.projectRoot, 'src/api');
                apiPathRoot = util_1.default.winRootPathHandle(apiPathRoot);
                let dirs = fs.readdirSync(apiPathRoot);
                let apiPath = yield vscode.window.showQuickPick(dirs, {
                    placeHolder: '选择api接口放置位置，文件不存在会新建！'
                });
                if (apiPath) {
                    // 补充后缀
                    if (!apiPath.endsWith('.js')) {
                        apiPath = apiPath + '.js';
                    }
                    let apiName = yield vscode.window.showInputBox({
                        placeHolder: '请输入接口名称'
                    });
                    if (apiName) {
                        let reqMethod = yield vscode.window.showQuickPick(['get', 'post', 'delete', 'put', 'patch'], {
                            placeHolder: '请选择请求方式'
                        });
                        if (reqMethod) {
                            let url = yield vscode.window.showInputBox({
                                placeHolder: '请输入接口请求地址，不填写则与接口名相同'
                            });
                            url = url || apiName;
                            let api = PageNew.apiGenerate(apiName, reqMethod, url);
                            let apiStore = PageNew.apiStoreGenerate(apiName, apiPath);
                            let apiJs = path.join(PageNew.projectRoot, 'src/api', apiPath);
                            let apiStoreJs = path.join(PageNew.projectRoot, 'src/store/modules', apiPath);
                            if (dirs.indexOf(apiPath) !== -1) {
                                // 已有文件
                                PageNew.fileGenerate(apiJs, apiJs, 'apiEach', {
                                    api
                                });
                            }
                            else {
                                // 新建文件
                                api = `import request from '@/utils/request'\n` + api;
                                apiJs = util_1.default.winRootPathHandle(apiJs);
                                try {
                                    fs.writeFileSync(apiJs, api);
                                }
                                catch (error) {
                                }
                            }
                            try {
                                // 判断是否存在store文件
                                apiStoreJs = util_1.default.winRootPathHandle(apiStoreJs);
                                fs.statSync(apiStoreJs);
                                PageNew.fileGenerate(apiStoreJs, apiStoreJs, 'apiEachStore', {
                                    apiStore
                                });
                            }
                            catch (error) {
                                PageNew.fileGenerate(apiStoreJs, path.join(PageNew.context.extensionUri.path, PageNew.templateRoot, 'api.js'), 'apiEachStore', {
                                    apiStore
                                });
                            }
                        }
                    }
                }
            }
            // 2. 相关输入
            // fs.readdirSync(path.join(PageNew.uri.path, ))
            // let res = await vscode.window.showQuickPick();
        });
    }
    // 生成api字符串
    static apiGenerate(apiName, reqMethod, url) {
        let req = {
            get: {
                params: 'params'
            },
            post: {
                params: 'data'
            },
            delete: {
                params: 'id'
            },
            put: {
                params: 'id'
            },
            patch: {
                params: 'id'
            }
        };
        let api = `\nexport function ${apiName}(${req[reqMethod].params}) {\n`;
        if (url[0] !== '/') {
            url = '/' + url;
        }
        switch (reqMethod) {
            case 'delete':
            case 'put':
            case 'patch':
                api += `  return request.${reqMethod}(\`${url}/\${${req[reqMethod].params}}\`)\n`;
                break;
            case 'get':
                api += `  return request.${reqMethod}(\`${url}\`, { ${req[reqMethod].params} })\n`;
                break;
            default:
                api += `  return request.${reqMethod}(\`${url}\`, ${req[reqMethod].params})\n`;
                break;
        }
        api += '}\n';
        return api;
    }
    // 生成api store内容
    static apiStoreGenerate(apiName, apiPath) {
        let actions = `async ${apiName}Async({ commit }, data) {
    const res = await ${apiName}(data)
    commit('${apiName}Sync', res.data)
    return res.data
  }`;
        let mutations = `${apiName}Sync(state, payload) {
  }`;
        return {
            apiName,
            apiPath,
            actions,
            mutations
        };
    }
}
exports.default = PageNew;
PageNew.templateRoot = 'asset/template';
PageNew.componentRoot = 'asset/component';
PageNew.pages = [];
// 页面对应模板页面列表
PageNew.pageTemplateList = {};
PageNew.zlstConfig = {};
PageNew.noSelectFolder = false;
PageNew.way = ''; // 操作方式：page, component
PageNew.GenerateWay = {
    PAGE: '1',
    COMPONENT: '2'
};
PageNew.Category = {
    VUE: 'vue',
    REACT: 'react'
};
//# sourceMappingURL=pageNew.js.map