import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { winRootPathHandle, open, url, getRelativePath, getWorkspaceRoot } from '../utils/util';
import vuePropsDef from '../utils/vueProps';
import Meteor from '../meteor'

export default class NewPage {
  public static templateRoot: string = 'asset/template';
  public static componentRoot: string = 'asset/component';
  public static pages: any[] = [];
  public static uri: vscode.Uri;
  public static context: vscode.ExtensionContext;
  public static pick: string; // 生成页面类型
  public static pageName: string; // 页面名称
  public static workspaceFolder: string; // 工作空间
  public static projectRoot: string; // 工程根路径
  // 页面对应模板页面列表
  public static pageTemplateList: any = {};
  public static meteorConfig: any = {};
  public static noSelectFolder: Boolean = false;
  public static way: string = ''; // 操作方式：page, component
  public static GenerateWay = {
    PAGE: '1',
    COMPONENT: '2'
  };
  public static Category = {
    VUE: 'vue',
    REACT: 'react'
  };
  public static meteor: Meteor
  public static activeTextEditor: vscode.TextEditor | undefined;
  public static selectedFolder: string

  // 生成页面
  public static generatePage(page: any) {
    if (page.type === '0') {
      // 组件
      let edior: vscode.TextEditor | undefined = NewPage.activeTextEditor
      if (edior) {
        // 生成组件
        // 获取文件所在文件夹
        let uriPath = edior.document.uri.path
        if (uriPath.includes('.')) {
          uriPath = uriPath.replace(/[\/|\\]\w*.\w*$/gi, '')
        }
        NewPage.init(NewPage.context, vscode.Uri.file(uriPath));
        NewPage.way = NewPage.GenerateWay.COMPONENT;
        NewPage.setComponent(NewPage.context);
        NewPage.getQuickPickItems()
        NewPage.pick = page.name;
        NewPage.pageName = page.name;
        NewPage.generate();
      } else {
        vscode.window.showInformationMessage('请选择插入位置！')
      }
    } else if (page.type === '1') {
      // 页面
      if (NewPage.selectedFolder) {
        NewPage.init(NewPage.context, vscode.Uri.file(NewPage.selectedFolder));
        NewPage.way = NewPage.GenerateWay.PAGE;
        NewPage.setPage(NewPage.context);
        NewPage.getQuickPickItems()
        NewPage.pick = page.name;
        NewPage.pageName = page.name;
        NewPage.showGenerateNameInput(page.description || '');
      } else {
        vscode.window.showInformationMessage('请选择生成页面目录！')
      }
    }
  }
 
  // 通过配置设置页面参数
  public static setPageByConfig(config: string) {
    // 过滤暂时不做 读取工程的package.json
    // let projectCategory = 'miniapp';
    // try {
    //   let packageInfo: any = fs.readFileSync(path.join(NewPage.projectRoot, 'package.json'), 'utf-8');
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
    }
    NewPage.pageTemplateList = Object.assign(NewPage.pageTemplateList, conf);
    NewPage.pages = NewPage.pages.concat(pages);
  }
  public static async init(context: vscode.ExtensionContext, uri: vscode.Uri) {
    if (uri) {
      NewPage.uri = uri;
    } else if (vscode.workspace.workspaceFolders) {
      NewPage.uri = vscode.workspace.workspaceFolders[0].uri;
      NewPage.noSelectFolder = true;
    }
    NewPage.context = context;
    NewPage.pageTemplateList = {};
    NewPage.pages = [];
    NewPage.setProjectRoot();
  }
  public static setPage(context: vscode.ExtensionContext) {
    // 插件配置信息
    let configPath = path.join(context.extensionUri.path, NewPage.templateRoot, 'page.json');
    try {
      configPath = winRootPathHandle(configPath);
      let config: string = fs.readFileSync(configPath, 'utf-8');
      NewPage.setPageByConfig(config);
    } catch (error) {
      vscode.window.showWarningMessage('插件中page.json文件出错！');
    }
    // 本地页面配置信息
    const config = vscode.workspace.getConfiguration('meteor');
    NewPage.meteorConfig = config;
    if (config.rootPathLocalPage) {
      let localPageConfig = path.join(config.rootPathLocalPage, 'page.json');
      try {
        localPageConfig = winRootPathHandle(localPageConfig);
        let config = fs.readFileSync(localPageConfig, 'utf-8');
        NewPage.setPageByConfig(config);
      } catch (error) {
        // 本地未设置
      }
    }
  }
  public static getQuickPickItems() {
    const items: vscode.QuickPickItem[] = [];
    NewPage.pages.forEach((item: any) => {
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
  public async showQuickPick(context: vscode.ExtensionContext, uri: vscode.Uri) {
    // 1. 初始化，从配置文件获取页面列表
    NewPage.init(context, uri);
    NewPage.way = NewPage.GenerateWay.PAGE;
    NewPage.setPage(context);
    // 2. 获取选择项
    const templatePick = vscode.window.createQuickPick();
    templatePick.title = '生成页面';
    templatePick.placeholder = '选择模板';
    class TemplateButton implements vscode.QuickInputButton {
      constructor(public iconPath: { light: vscode.Uri; dark: vscode.Uri; }, public tooltip: string) { }
    }
    templatePick.buttons = [new TemplateButton({
      dark: vscode.Uri.file(context.asAbsolutePath('asset/dark/document.svg')),
      light: vscode.Uri.file(context.asAbsolutePath('asset/light/document.svg')),
    }, '使用文档'), new TemplateButton({
      dark: vscode.Uri.file(context.asAbsolutePath('asset/dark/refresh.svg')),
      light: vscode.Uri.file(context.asAbsolutePath('asset/light/refresh.svg')),
    }, '同步'), new TemplateButton({
      dark: vscode.Uri.file(context.asAbsolutePath('asset/dark/add.svg')),
      light: vscode.Uri.file(context.asAbsolutePath('asset/light/add.svg')),
    }, '添加页面')];
    templatePick.items = NewPage.getQuickPickItems();
    templatePick.onDidChangeSelection(selection => {
      templatePick.hide();
      // 打开工程才能继续
      if (vscode.workspace.workspaceFolders && selection[0] && selection[0].label) {
        NewPage.pick = selection[0].label;
        NewPage.showGenerateNameInput(selection[0].description || '');
      } else {
        if (!vscode.workspace.workspaceFolders) {
          vscode.window.showInformationMessage('请先打开工程');
        }
      }
		});
    templatePick.onDidTriggerButton(item => {
      switch (item.tooltip) {
        case '使用文档':
          open(url.official);
          break;
        case '同步':
          vscode.commands.executeCommand('meteor.sync').then((res) => {
            setTimeout(() => {
              NewPage.pages = [];
              NewPage.setPage(context);
              templatePick.items = NewPage.getQuickPickItems();
            }, 1000);
          });
          break;
        case '添加页面':
          vscode.commands.executeCommand('meteor.upload');
          break;
      
        default:
          break;
      }
    }),
		templatePick.onDidHide(() => templatePick.dispose());
		templatePick.show();
  }

  public static setComponent(context: vscode.ExtensionContext) {
    // 插件配置信息
    let configPath = path.join(context.extensionUri.path, NewPage.componentRoot, 'component.json');
    try {
      configPath = winRootPathHandle(configPath);
      let config: string = fs.readFileSync(configPath, 'utf-8');
      NewPage.setPageByConfig(config);
    } catch (error) {
      vscode.window.showWarningMessage('目前还没有内置组件');
    }
    // 本地页面配置信息
    const config = vscode.workspace.getConfiguration('meteor');
    NewPage.meteorConfig = config;
    if (config.rootPathLocalComponent ) {
      let localPageConfig = path.join(config.rootPathLocalComponent , 'component.json');
      try {
        localPageConfig = winRootPathHandle(localPageConfig);
        let config = fs.readFileSync(localPageConfig, 'utf-8');
        NewPage.setPageByConfig(config);
      } catch (error) {
        // 本地未设置
      }
    }
  }

  /**
   * 显示组件选择弹窗
   * @param context 
   * @param uri 
   */
  public async showComponentQuickPick(context: vscode.ExtensionContext, uri: vscode.Uri) {
    NewPage.activeTextEditor = vscode.window.activeTextEditor
    // 1. 初始化，从配置文件获取页面列表
    NewPage.init(context, uri);
    NewPage.way = NewPage.GenerateWay.COMPONENT;
    NewPage.setComponent(context);
    
    // 2. 获取选择项
    const templatePick = vscode.window.createQuickPick();
    templatePick.title = '生成组件';
    templatePick.placeholder = '选择模板';
    class TemplateButton implements vscode.QuickInputButton {
      constructor(public iconPath: { light: vscode.Uri; dark: vscode.Uri; }, public tooltip: string) { }
    }
    templatePick.buttons = [new TemplateButton({
      dark: vscode.Uri.file(context.asAbsolutePath('asset/dark/document.svg')),
      light: vscode.Uri.file(context.asAbsolutePath('asset/light/document.svg')),
    }, '使用文档'), new TemplateButton({
      dark: vscode.Uri.file(context.asAbsolutePath('asset/dark/refresh.svg')),
      light: vscode.Uri.file(context.asAbsolutePath('asset/light/refresh.svg')),
    }, '同步'), new TemplateButton({
      dark: vscode.Uri.file(context.asAbsolutePath('asset/dark/add.svg')),
      light: vscode.Uri.file(context.asAbsolutePath('asset/light/add.svg')),
    }, '添加组件')];
    templatePick.items = NewPage.getQuickPickItems();
    templatePick.onDidChangeSelection(selection => {
      templatePick.hide();
      // 打开工程才能继续
      if (vscode.workspace.workspaceFolders && selection[0] && selection[0].label) {
        NewPage.pageName = selection[0].label;
        NewPage.pick = selection[0].label;
        NewPage.generate();
      } else {
        if (!vscode.workspace.workspaceFolders) {
          vscode.window.showInformationMessage('请先打开工程');
        }
      }
		});
    templatePick.onDidTriggerButton(item => {
      switch (item.tooltip) {
        case '使用文档':
          open(url.official);
          break;
        case '同步':
          vscode.commands.executeCommand('meteor.sync').then((res) => {
            setTimeout(() => {
              NewPage.pages = [];
              NewPage.setComponent(context);
              templatePick.items = NewPage.getQuickPickItems();
            }, 1000);
          });
          break;
        case '添加组件':
          vscode.commands.executeCommand('meteor.upload', '2');
          break;
        default:
          break;
      }
    }),
		templatePick.onDidHide(() => templatePick.dispose());
		templatePick.show();
  }

  /**
   * 显示输入名称弹框
   */
  public static async showGenerateNameInput(category: string) {
    let placeholder = '前缀 - 页面生成规则为【前缀+文件名】';
    if (category === '(miniapp)') {
      placeholder = '页面名称';
    }
    let name = await vscode.window.showInputBox({
      placeHolder: placeholder
    });
    if (name) {
      NewPage.pageName = name;
      NewPage.generate();
    }
  }
  /**
   * vue代码块填充
   * @param page 
   */
  public static codeBlockFillVue(page: any) {
    let editor: vscode.TextEditor | undefined = NewPage.activeTextEditor;
    if (editor) {
      let templatePath = path.join(NewPage.context.extensionUri.path, NewPage.way === NewPage.GenerateWay.PAGE ? NewPage.templateRoot : NewPage.componentRoot, page.template + 'index.txt');
      try {
        templatePath = winRootPathHandle(templatePath)
        let template = fs.readFileSync(templatePath, 'utf-8');
        let templateArr = JSON.parse(template);
        let names: string[] = [];
        let templateObj: any = {};
        for (let i = 0; i < templateArr.length; i++) {
          const tempateItem = templateArr[i];
          names.push(tempateItem.name);
          templateObj[tempateItem.name] = tempateItem.code;
        }
        vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', editor.document.uri).then(async (symbols: any) => {
          // 拼装插入内容位置、内容
          let insertList: any[] = [];
          if (symbols && symbols.length === 1) {
            let doc = symbols[0];
            let defaultLine = 0;
            doc.children.forEach((oneLevelItem: any) => {
              if (oneLevelItem.name === 'template' && names.includes('template')) {
                names.splice(names.indexOf('template'), 1);
                insertList.push({
                  position: editor?.selection.active || oneLevelItem.location.range._end,
                  code: templateObj['template']
                });
              } else if (oneLevelItem.name === 'script') {
                if (names.includes('import')) {
                  names.splice(names.indexOf('import'), 1);
                  let line = oneLevelItem.location.range._start._line
                  insertList.push({
                    position: {
                      _line: line,
                      _character: editor?.document.lineAt(line).text.length
                    },
                    code: '\n' + templateObj['import']
                  });
                }
                oneLevelItem.children.forEach((scriptChild: any) => {
                  if (scriptChild.name === 'default') {
                    defaultLine = scriptChild.location.range._start._line;
                    // vue属性
                    scriptChild.children.forEach((vueProp: any) => {
                      if (names.includes(vueProp.name)) {
                        names.splice(names.indexOf(vueProp.name), 1);
                        let line = vueProp.kind === 5 ? vueProp.location.range._end._line - 2 : vueProp.location.range._end._line - 1
                        let code = '';
                        // code存在才处理
                        if (templateObj[vueProp.name]) {
                          if (vueProp.children.length > 0) {
                            code += ',\n';
                          }
                          code += templateObj[vueProp.name];
                          insertList.push({
                            position: {
                              _line: line,
                              _character: editor?.document.lineAt(line).text.length
                            },
                            code: code
                          });
                        }
                      }
                    });
                  }
                });
              } else if (oneLevelItem.name === 'style' && names.includes('style')) {
                names.splice(names.indexOf('style'), 1);
                let line = oneLevelItem.location.range._end._line - 1;
                insertList.push({
                  position: {
                    _line: line,
                    _character: editor?.document.lineAt(line).text.length
                  },
                  code: '\n' + templateObj['style']
                });
              }
            });
            names.forEach((name: string) => {
              if (vuePropsDef.vue[name]) {
                insertList.push({
                  position: {
                    _line: defaultLine,
                    _character: editor?.document.lineAt(defaultLine).text.length
                  },
                  code: '\n' + vuePropsDef.vue[name].replace(/##/gi, templateObj[name])
                });
              }
            });

            await editor?.edit((editBuilder: any) => {
              insertList.forEach((insert) => {
                editBuilder.insert(new vscode.Position(insert.position._line, insert.position._character), insert.code);
              });
            });
            setTimeout(() => {
              vscode.commands.executeCommand('eslint.executeAutofix');
            }, 300);
          } else if (templateObj['template'] && editor?.selection.active) {
            await editor?.edit((editBuilder: any) => {
              editBuilder.insert(editor?.selection.active, templateObj['template']);
            });
            setTimeout(() => {
              vscode.commands.executeCommand('eslint.executeAutofix');
            }, 300);
          }
        });
      } catch (error) {
        
      }
    }
  }

  /**
   * 小程序代码块生成
   * @param page 
   */
  public static codeBlockFillMiniapp(page: any) {
    let editor: vscode.TextEditor | undefined = NewPage.activeTextEditor;
    if (editor) {
      let templatePath = path.join(NewPage.context.extensionUri.path, NewPage.way === NewPage.GenerateWay.PAGE ? NewPage.templateRoot : NewPage.componentRoot, page.template + 'index.txt');
      try {
        let template = fs.readFileSync(templatePath, 'utf-8');
        let templateArr = JSON.parse(template);
        let names: string[] = [];
        let templateObj: any = {};
        // wxml wxss json
        let has = ['', '', '', ''];
        for (let i = 0; i < templateArr.length; i++) {
          const tempateItem = templateArr[i];
          if (tempateItem.name === 'wxml') {
            has[0] = tempateItem.code;
          } else if (tempateItem.name === 'wxss') {
            has[1] = tempateItem.code;
          } else if (tempateItem.name === 'json') {
            has[2] = tempateItem.code;
          } else {
            names.push(tempateItem.name);
            templateObj[tempateItem.name] = tempateItem.code;
          }
        }
        // 小程序分五个文件处理
        let filePath = editor.document.uri.path
        let fileName = filePath.replace(/.*\/(.*)\..*/gi, '$1')
        let docFolder = path.join(filePath, '..');
        // wxml文件
        if (has[0]) {
          let pathXml = path.join(docFolder, fileName + '.wxml');
          try {
            fs.statSync(pathXml);
            if (filePath.endsWith('wxml')) {
              editor?.edit((editBuilder: any) => {
                editBuilder.insert(editor?.selection.active, has[0]);
              });
            } else {
              pathXml = winRootPathHandle(pathXml);
              fs.appendFileSync(pathXml, '\n' + has[0]);
            }
          } catch (error) {
            pathXml = winRootPathHandle(pathXml);
            fs.writeFileSync(pathXml, has[0]);
          }
        }
        // wxss
        if (has[1]) {
          let pathWxss = path.join(docFolder, fileName + '.wxss');
          try {
            fs.statSync(pathWxss);
            if (filePath.endsWith('wxss')) {
              editor?.edit((editBuilder: any) => {
                editBuilder.insert(editor?.selection.active, has[1]);
              });
            } else {
              pathWxss = winRootPathHandle(pathWxss);
              fs.appendFileSync(pathWxss, '\n' + has[1]);
            }
          } catch (error) {
            pathWxss = winRootPathHandle(pathWxss);
            fs.writeFileSync(pathWxss, has[1]);
          }
        }
        // json
        if (has[2]) {
          let pathJson = path.join(docFolder, fileName + '.json');
          try {
            fs.statSync(pathJson);
            pathJson = winRootPathHandle(pathJson);
            let jsonFile: any = fs.readFileSync(pathJson, 'utf-8');
            let codeArr = has[2].split('\n');
            let jsonArr = jsonFile.split('\n');
            let hasComponents = false;
            let endComponent = 0;
            let position = {
              line: 0,
              character: 0,
              space: ''
            };
            let componentList: any[] = [];
            for (let i = 0; i < jsonArr.length; i++) {
              const jsonLine = jsonArr[i];
              if (jsonLine.includes('usingComponents')) {
                hasComponents = true;
              }
              if (hasComponents && endComponent === 0 && jsonLine.includes('}')) {
                endComponent = i;
                position = {
                  line: i-1,
                  character: jsonArr[i-1].length,
                  space: jsonArr[i-1].replace(jsonArr[i-1].trim(), '')
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
            codeArr.forEach((code: string) => {
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
            } else if (componentList.length === 0) {
              codes = codes.substr(1, codes.length);
            }
            let jsonStr = '';
            for (let i = 0; i < jsonArr.length; i++) {
              jsonStr += jsonArr[i];
              if (i === position.line) {
                jsonStr += codes + '\n';
              } else {
                jsonStr += '\n';
              }
            }
            fs.writeFileSync(pathJson, jsonStr);
          } catch (error) {
            pathJson = winRootPathHandle(pathJson);
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
          pathJs = winRootPathHandle(pathJs);
          let jsFile = fs.readFileSync(pathJs, 'utf-8')
          let jsArr = jsFile.split('\n');
          let tag = {
            name: 'import',
            kind: '1', // 1: attr 2: function
            beginLine: 0
          };
          let braceLeftCount = 0;
          let braceRight = 0;
          let braceLeft: any = 0;
          let jsFill = '';
          let isInPage = false;
          for (let i = 0; i < jsArr.length; i++) {
            const jsCont = jsArr[i];
            if (tag.name === 'import' && (!jsCont.trim() || jsCont.includes('Page('))) {
              names.splice(names.indexOf('import'), 1);
              tag.name = '';
              if(templateObj['import']){
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
              } else {
                tag.kind = '1';
              }
            } 
            braceLeft = jsCont.match(/{/gi)?.length || 0;
            braceRight = jsCont.match(/}/gi)?.length || 0;
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
                } else {
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
              } else if (tag.kind === '2') {
                if (i > tag.beginLine + 1) {
                  // 有内容
                  let space = jsArr[i - 1].replace(jsArr[i - 1].trim(), '');
                  if (templateObj[tag.name]) {
                    names.splice(names.indexOf(tag.name), 1);
                    jsFill = jsFill.substr(0, jsFill.length - 1);
                    jsFill += '\n' + space + templateObj[tag.name] + '\n';
                  }
                } else {
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
        } catch (error) {
        }
      } catch (error) {
      }
    }
  }

  /**
   * 代码块填充
   * @param page 
   */
  public static codeBlockFill(page: any, category: string) {
    // 规定所有文件都取自 index.txt
    switch (category) {
      case 'vue':
        NewPage.codeBlockFillVue(page);
        break;
      case 'miniapp':
        NewPage.codeBlockFillMiniapp(page);
        break;
    
      default:
        break;
    }
  }
  /**
   * 页面生成
   */
  public static async generate() {
    //  1. 获取页面列表
    let pagesInfo = NewPage.pageTemplateList[NewPage.pick];
    if (!pagesInfo) {
      vscode.window.showInformationMessage('请先[同步](command:meteor.sync)')
      return
    }
    // 2. 读取相关页面，并替换为页面名称
    let pages: [any] = pagesInfo.pages;
    pages.forEach(page => {
      let pagePath = '';
      switch (page.type) {
        case 'page':
        case 'component':
          if (pagesInfo.block === 1) {
            // 代码块
            NewPage.codeBlockFill(page, pagesInfo.category);
          } else {
            // 名称组装
            let name = NewPage.pageName + page.fileName[0].toUpperCase() + page.fileName.substr(1, page.fileName.length);
            if (pagesInfo.category === 'miniapp') {
              name = NewPage.pageName;
            }
            if (NewPage.noSelectFolder) {
              if (page.type === 'page') {
                pagePath = path.join(NewPage.uri.path, NewPage.meteorConfig.rootPathPage, name + page.poster);
              } else {
                pagePath = path.join(NewPage.uri.path, NewPage.meteorConfig.rootPathComponent, name + page.poster);
              }
            } else {
              pagePath = path.join(NewPage.uri.path, name + page.poster);
            }
            try {
              pagePath = winRootPathHandle(pagePath);
              fs.statSync(pagePath);
            } catch (error) {
              NewPage.fileGenerate(pagePath, path.join(NewPage.context.extensionUri.path, NewPage.way === NewPage.GenerateWay.PAGE ? NewPage.templateRoot : NewPage.componentRoot, page.template), page.type, {});
            }
          }
          break;
        case 'store':
          let storeJs = path.join(NewPage.projectRoot, NewPage.meteorConfig.rootPathStore, 'modules', NewPage.pageName + '.js');
          let storeIndexJs = path.join(NewPage.projectRoot, NewPage.meteorConfig.rootPathStore, 'index.js');
          try {
            storeJs = winRootPathHandle(storeJs);
            fs.statSync(storeJs);
          } catch (error) {
            NewPage.fileGenerate(storeJs, path.join(NewPage.context.extensionUri.path, NewPage.templateRoot, page.template), 'file', {});
            NewPage.fileGenerate(storeIndexJs, storeIndexJs, page.type, {});
          }
          break;
        case 'api':
          pagePath = path.join(NewPage.projectRoot, NewPage.meteorConfig.rootPathApi, NewPage.pageName + '.js');
          try {
            pagePath = winRootPathHandle(pagePath);
            fs.statSync(pagePath);
          } catch (error) {
            NewPage.fileGenerate(pagePath, path.join(NewPage.context.extensionUri.path, NewPage.templateRoot, page.template), page.type, {});
          }
          break;
        default:
          break;
      }
    });
  }
  // 设置工程根路径
  public static setProjectRoot() {
    if (vscode.workspace.workspaceFolders) {
      vscode.workspace.workspaceFolders.forEach(workspaceFolder => {
        if (NewPage.uri.path.includes(workspaceFolder.uri.path)) {
          NewPage.projectRoot = workspaceFolder.uri.path;
        }
      });
    }
  }
  // 文件生成
  public static async fileGenerate(pagePath: string, template: string, type: string, options: any) {
    // 读取模板文件，替换，生成
    template = winRootPathHandle(template);
    let tempStr = fs.readFileSync(template, 'utf-8');
    if (type === 'page' || type === 'component') {
      tempStr = tempStr.replace(/\$\$/gi, NewPage.pageName).replace(/##/gi, NewPage.pageName[0].toUpperCase() + NewPage.pageName.substr(1, NewPage.pageName.length));
    } else if (type === 'store') {
      // 存储
      let tempArr = tempStr.split('\n');
      let tempContent = tempArr[0] + '\n';
      let len = tempArr.length;
      for (let i = 1; i < len; i++) {
        const temp = tempArr[i];
        if (i + 1 === len) {
          tempContent += temp;
        } else if (tempArr[i - 1].includes('import ') && !temp.includes('import ')) {
          tempContent += `import ${NewPage.pageName} from './modules/${NewPage.pageName}'\n`;
          tempContent += temp + '\n';
        } else if (tempArr[i - 1].includes('modules:') && !temp.includes('modules:')) {
          let tempTrim = temp.trim();
          tempContent += temp.substr(0, temp.indexOf(tempTrim)) + `${NewPage.pageName},\n`;
          tempContent += temp + '\n';
        } else {
          tempContent += temp + '\n';
        }
      }
      tempStr = tempContent;
    } else if (type === 'router') {
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
        } else if (rootFound && temp.includes('children')) {
          let tempTrim = temp.trim();
          let space = temp.substr(0, temp.indexOf(tempTrim));
          tempContent += temp + '\n';
          tempContent += options.routers.replace(/#/gi, space);
          rootFound = false;
        } else {
          tempContent += temp + '\n';
        }
      }
      tempStr = tempContent;
    } else if (type === 'apiEach') {
      // 单个api生成
      tempStr += options.api;
    } else if (type === 'apiEachStore') {
      // 单个api对应的store
      let apiPath = options.apiStore.apiPath.replace(/.js/, '');
      let workspaceRoot = getWorkspaceRoot('')
      let relativePath = getRelativePath(path.join(workspaceRoot, this.meteor.config.get('rootPathStore'), 'modules/store'), path.join(workspaceRoot, this.meteor.config.get('rootPathApi')))
      tempStr = tempStr.replace(/##/gi, path.join(relativePath, apiPath));
      let tempArr = tempStr.split('\n');
      let tempContent = '';
      let len = tempArr.length;
      let step = 1; // 1：import 2： state 3: mutations 4: actions 5: 结束
      for (let i = 0; i < len; i++) {
        const temp = tempArr[i];
        if (i + 1 === len) {
          tempContent += temp;
        } else if (step === 1) {
          if (temp.includes("/" + apiPath + "'")) {
            step = 2;
            if (temp.includes('{}')) {
              tempContent += temp.replace(/\s?}/gi, ` ${options.apiStore.apiName} }`);
            } else {
              tempContent += temp.replace(/\s?}/gi, `, ${options.apiStore.apiName} }`);
            }
            tempContent += '\n';
            continue;
          } else {
            tempContent += temp + '\n';
          }
        } else if (step === 2) {
          if (temp.includes('state') && !/.*state.*\(.*\).*{.*/gi.test(temp)) {
            step = 3;
            tempContent += temp + '\n';
            continue;
          }
          if (temp.includes('return')) {
            step = 3;
            tempContent += temp + '\n';
          } else {
            tempContent += temp + '\n';
          }
        } else if (step === 3) {
          if (temp.includes('mutations')) {
            step = 4;
            tempContent += temp + '\n';
            let tempTrim = temp.trim();
            let space = temp.substr(0, temp.indexOf(tempTrim));
            if (tempArr[i + 1]) {
              // 里面没有内容
              if (tempArr[i + 1].endsWith('}')) {
                tempContent += space + '  ' + options.apiStore.mutations + '\n';
              } else {
                tempContent += space + '  ' + options.apiStore.mutations + ',\n';
              }
            }
          } else {
            tempContent += temp + '\n';
          }
        } else if (step === 4) {
          if (temp.includes('actions')) {
            step = 5;
            tempContent += temp + '\n';
            let tempTrim = temp.trim();
            let space = temp.substr(0, temp.indexOf(tempTrim));
            if (tempArr[i + 1].endsWith('}')) {
              tempContent += space + '  ' + options.apiStore.actions + '\n';
            } else {
              tempContent += space + '  ' + options.apiStore.actions + ',\n';
            }
          } else {
            tempContent += temp + '\n';
          }
        } else {
          tempContent += temp + '\n';
        }
      }
      tempStr = tempContent;
    }
    pagePath = winRootPathHandle(pagePath);
    try {
      fs.writeFileSync(pagePath, tempStr);
    } catch (error) {
      
    }
  }
  public async api(context: vscode.ExtensionContext, uri: vscode.Uri) {
    // 1. 初始化
    NewPage.context = context;
    let activeEditor = vscode.window.activeTextEditor;
    let sfs = vscode.workspace.workspaceFolders;
    if (activeEditor || (sfs && sfs.length === 1)) {
      if (activeEditor) {
        NewPage.uri = activeEditor.document.uri;
      } else if (sfs) {
        NewPage.uri = sfs[0].uri;
      }
      NewPage.setProjectRoot();
      let apiPathRoot = path.join(NewPage.projectRoot, 'src/api');
      apiPathRoot = winRootPathHandle(apiPathRoot);
      let dirs = fs.readdirSync(apiPathRoot);
      let apiPath = await vscode.window.showQuickPick(dirs, {
        placeHolder: '选择api接口放置位置，文件不存在会新建！'
      });
      if (apiPath) {
        // 补充后缀
        if (!apiPath.endsWith('.js')) {
          apiPath = apiPath + '.js';
        }
        let apiName = await vscode.window.showInputBox({
          placeHolder: '请输入接口名称'
        });
        if (apiName) {
          let reqMethod = await vscode.window.showQuickPick(['get', 'post', 'delete', 'put', 'patch'], {
            placeHolder: '请选择请求方式'
          });
          if (reqMethod) {
            let url = await vscode.window.showInputBox({
              placeHolder: '请输入接口请求地址，不填写则与接口名相同'
            });
            url = url || apiName;
            let api = NewPage.apiGenerate(apiName, reqMethod, url);
            let apiStore = NewPage.apiStoreGenerate(apiName, apiPath);
            let apiJs = path.join(NewPage.projectRoot, 'src/api', apiPath);
            let apiStoreJs = path.join(NewPage.projectRoot, 'src/store/modules', apiPath);
            if (dirs.indexOf(apiPath) !== -1) {
              // 已有文件
              NewPage.fileGenerate(apiJs, apiJs, 'apiEach', {
                api
              });
            } else {
              // 新建文件
              api = `import request from '@/utils/request'\n` + api;
              apiJs = winRootPathHandle(apiJs);
              try {
                fs.writeFileSync(apiJs, api);
              } catch (error) {
                
              }
            }
            try {
              // 判断是否存在store文件
              apiStoreJs = winRootPathHandle(apiStoreJs);
              fs.statSync(apiStoreJs);
              NewPage.fileGenerate(apiStoreJs, apiStoreJs, 'apiEachStore', {
                apiStore
              });
            } catch (error) {
              NewPage.fileGenerate(apiStoreJs, path.join(NewPage.context.extensionUri.path, NewPage.templateRoot, 'api.js'), 'apiEachStore', {
                apiStore
              });
            }
          }
        }
      }
    }
    // 2. 相关输入
    // fs.readdirSync(path.join(NewPage.uri.path, ))
    // let res = await vscode.window.showQuickPick();
  }
  // 生成api字符串
  public static apiGenerate(apiName: string, reqMethod: string, url: string) {
    let req: any = {
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
  public static apiStoreGenerate(apiName: string, apiPath: string) {
let actions = `async ${apiName}({ commit }, data) {
    const res = await ${apiName}(data)
    commit('${apiName}', res.data)
    return res.data
  }`; 
let mutations = `${apiName}(state, payload) {
  }`;
  return {
    apiName,
    apiPath,
    actions,
    mutations
  };
  }
}