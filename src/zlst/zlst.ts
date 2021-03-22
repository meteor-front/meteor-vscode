import * as vscode from 'vscode';
import axios from 'axios';
import * as path from 'path';
import * as fs from 'fs';
const camelCase = require('camelcase');
import pageNew from './pageNew';
import Util from '../util/util';

export default class Zlst {
  public fetch: any;
  public context: vscode.ExtensionContext;
  public projectRoot: string = '';
  constructor(option: any) {
    this.context = option.context;
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0] && vscode.workspace.workspaceFolders[0].uri) {
      this.projectRoot = vscode.workspace.workspaceFolders[0].uri.path;
    }
    // 初始化请求
    this.fetch = axios.create({
      baseURL: 'http://www.80fight.cn:8080/',
      withCredentials: false,
      headers: {
        token: '20'
      }
    });
  }

  /**
   * 同步服务器数据
   * @param uri 
   */
  async sync() {
    // 获取页面数据
    let res = await this.fetch.get('widget?tag=&type=&searchValue=');
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'zlst',
      cancellable: true
    }, (progress, _token) => {
      let msg = '正在同步中，请耐心等待...';
      progress.report({
        increment: 0,
        message: msg
      });
      // 拼接配置文件， 并生成文件
      let current: number = 0;
      let count: number = 1;
      let files: any [] = [];
      if (res.data && res.data.data) {
        let data = res.data.data;
        let page: any = {};
        let component: any = {};
        data.forEach((item: any) => {
          let obj = null;
          // type: 0 组件   1 页面
          if (item.type === '1') {
            obj = page;
          } else {
            obj = component;
          }
          obj[item.description.name] = {
            category: item.category,
            type: item.type,
            block: item.block
          };
          let pages: any = [];
          item.code.forEach((codeItem: any) => {
            let dotPosition = codeItem.name.lastIndexOf('.');
            pages.push({
              template: item.id + '/' + codeItem.name,
              type: codeItem.type,
              fileName: codeItem.name.substr(0, dotPosition),
              poster: codeItem.name.substr(dotPosition, codeItem.name.length)
            });
            files.push({
              pageId: item.id,
              pageType: item.type,
              ...codeItem
            });
            count++;
          });
          obj[item.description.name].pages = pages;
        });
        // 生成page文件
        let rootPagePath = path.join(this.context.extensionUri.path, 'asset/template');
        let pagePath = path.join(rootPagePath, 'page.json');
        let rootComponentPath = path.join(this.context.extensionUri.path, 'asset/component');
        let componentPath = path.join(rootComponentPath, 'component.json');
        current++;
        pagePath = Util.winRootPathHandle(pagePath);
        componentPath = Util.winRootPathHandle(componentPath);
        try {
          fs.writeFileSync(pagePath, JSON.stringify(page));
          fs.writeFileSync(componentPath, JSON.stringify(component));
        } catch (error) {
          console.log(error);
        }
        progress.report({
          increment: current * 100 / count,
          message: msg
        });
        // 生成页面文件
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          let root = file.pageType === '1' ? rootPagePath :  rootComponentPath;
          let filePath = path.join(root, file.pageId.toString());
          filePath = Util.winRootPathHandle(filePath);
          try {
            fs.statSync(filePath);
          } catch (error) {
            fs.mkdirSync(filePath);
          }
          let filePathName = path.join(filePath, file.name || 'index.txt');
          filePathName = Util.winRootPathHandle(filePathName);
          fs.writeFileSync(filePathName, file.code);
          current++;
          progress.report({
            increment: current * 100 / count,
            message: msg
          });
        }
      }
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve('success');
        }, 3000);
      });
    });
  }

  // 生成方法，并跳转到方法处
  generateMethod() {
    // 查找方法名称
    let character = (vscode.window.activeTextEditor?.selection.anchor.character || 0) - 1;
    let txt = vscode.window.activeTextEditor?.document.lineAt(vscode.window.activeTextEditor?.selection.anchor.line).text;
    let word: string = '';
    while(txt && character && character > 0) {
      if (txt[character] === '"') {
        break;
      }
      word = txt[character] + word;
      --character;
    }
    // 没有参数往后找
    character = (vscode.window.activeTextEditor?.selection.anchor.character || 0);
    while(txt && character && txt.length > character) {
      if (txt[character] === '"') {
        break;
      }
      word = word + txt[character];
      ++character;
    }
    if (vscode.window.activeTextEditor?.document && vscode.window.activeTextEditor?.selection.anchor.line) {
      let lineCount = vscode.window.activeTextEditor.document.lineCount;
      let currentLine = vscode.window.activeTextEditor?.selection.anchor.line;
      let isJs = false;
      let isInMethods = false;
      while(currentLine < lineCount) {
        let text = vscode.window.activeTextEditor.document.lineAt(currentLine).text;
        if (/^\s*<\/script>\s*$/g.test(text)) {
          break;
        }
        // 判断是否到js
        if (!isJs) {
          if (/^\s*<script.*>\s*$/g.test(text)) {
            isJs = true;
          }
          ++currentLine;
          continue;
        }
        // 查找到methods开始位置
        if (!isInMethods) {
          if (/\s*methods\s*:\s*{\s*/gi.test(text)) {
            isInMethods = true;
          }
          ++currentLine;
          continue;
        }
        if (text.includes('...')) {
          ++currentLine;
          // 是三木运算，下起一行
          continue;
        }
        ++currentLine;
        break;
      }
      if (currentLine < lineCount && isInMethods) {
        let editor = vscode.window.activeTextEditor;
        editor.edit((editBuilder) => {
          editBuilder.insert(new vscode.Position(currentLine - 1, 0), `    ${word.includes('(') ? (word + ' {') : word + '() {'}\n      \n    },\n`);
        }).then(() => {
          editor.selection = new vscode.Selection(new vscode.Position(currentLine - 1, 4), new vscode.Position(currentLine - 1, 4));
          let lineEnd = currentLine - 1 + editor.visibleRanges.length;
          let lineStart = currentLine - 1;
          if (lineEnd > editor.document.lineCount) {
            lineEnd = editor.document.lineCount;
            lineStart = lineEnd = editor.visibleRanges.length;
          }
          editor.revealRange(new vscode.Range(new vscode.Position(lineStart, 4), new vscode.Position(lineEnd, 4)), vscode.TextEditorRevealType.Default);
        });
      }
    }
  }
  // swagger生成api
  async swagger() {
    // placeHolder: 'swagger地址'
    let config = vscode.workspace.getConfiguration('zlst');
    let swaggerUrl: any = config.get('swaggerUrl');
    let addText = '新增swagger地址';
    let url = await vscode.window.showQuickPick([addText].concat(swaggerUrl), {
      placeHolder: 'swagger url'
    });
    if (!url) {
      return;
    }
    // 新增操作
    if (url === addText) {
      url = await vscode.window.showInputBox({
        placeHolder: '请输入swagger地址'
      });
      if (url && swaggerUrl.indexOf(url) === -1) {
        swaggerUrl.push(url);
        vscode.workspace.getConfiguration('zlst').update('swaggerUrl', swaggerUrl, vscode.ConfigurationTarget.Global);
      }
    }
    // 生成选项
    let generateTypes = ['单个接口', '全部接口'];
    let generateType = await vscode.window.showQuickPick(generateTypes, {
      placeHolder: '选择生成范围 [默认全部]'
    });
    if (!generateType) {
      return;
    }
    if (url) {
      // http://nginx.zy.prd.uimpcloud.com/baseinfo/swagger-ui.html
      if (url.endsWith('swagger-ui.html')) {
        // html地址，进行转换
        let res = await this.fetch.get(url.replace('swagger-ui.html', 'swagger-resources'));
        if (res && res.data) {
          url = url.replace('/swagger-ui.html', res.data[0].url || res.data[0].location);
        }
      }
      // 获取swagger api内容
      let res = await this.fetch.get(url);
      if (res) {
        let docs: any = {};
        res.data.tags.forEach((tag: any) => {
          let name = tag.description.replace(/\s/gi, '').replace(/Controller$/gi, '');
          name = name[0].toLowerCase() + name.substr(1, name.length);
          docs[tag.name] = {};
          // 生成接口入口文件
          if (!this.projectRoot) {
            vscode.window.showInformationMessage("请先打开工程");
            return;
          }
          let apiPath = path.join(this.projectRoot, config.get('rootPathApi') || '', name + '.js');
          apiPath = Util.winRootPathHandle(apiPath);
          docs[tag.name].name = name;
          docs[tag.name].url = apiPath;
          try {
            if (generateType === generateTypes[1]) {
              fs.writeFileSync(apiPath, 'import request from \'@/utils/request\'\n');
            }
          } catch (error) {
          }
          let rootPathStore: string = config.get('rootPathStore') || '';
          if (rootPathStore) {
            // 判断modules目录是否存在
            let hasModules = true;
            let modulesPath = path.join(this.projectRoot, rootPathStore, 'modules');
            console.log(modulesPath);
            try {
              fs.statSync(modulesPath);
            } catch (error) {
              hasModules = false;
            }
            let storePath = '';
            if (hasModules) {
              storePath = path.join(this.projectRoot, rootPathStore, 'modules', name + '.js');
            } else {
              storePath = path.join(this.projectRoot, rootPathStore,  name + '.js');
            }
            try {
              if (generateType === generateTypes[1]) {
                storePath = Util.winRootPathHandle(storePath);
                fs.writeFileSync(storePath, '');
              }
            } catch (error) {
              console.log(error);
            }
          }
        });

        // 生成单个-选择接口
        let singleApi: string | undefined = '';
        let singleApiPathName = '';
        if (generateType === generateTypes[0]) {
          let apis = [];
          let names = [];
          for (const apiUrl in res.data.paths) {
            const post = res.data.paths[apiUrl];
            for (const postWay in post) {
              const postBody = post[postWay];
              apis.push(`[${postWay}] ${apiUrl}`);
              names.push(postBody.tags[0]);
            }
          }
          singleApi = await vscode.window.showQuickPick(apis, {
            placeHolder: '选择需要生成的接口名称'
          });
          if (singleApi) {
            // 如果没有入口页面，生成。有，不处理
            let singleApiPath = '';
            try {
              let index = apis.indexOf(singleApi);
              singleApiPathName = docs[names[index]].name;
              singleApiPath = path.join(this.projectRoot, config.get('rootPathApi') || '', singleApiPathName + '.js');
              if (index !== -1) {
                singleApiPath = Util.winRootPathHandle(singleApiPath);
                fs.statSync(singleApiPath);
              }
            } catch (error) {
              fs.writeFileSync(singleApiPath, 'import request from \'@/utils/request\'\n');
            }
          }
        }
        // 生成接口
        let store: any = {};
        for (const apiUrl in res.data.paths) {
          const post = res.data.paths[apiUrl];
          for (const postWay in post) {
            const postBody = post[postWay];
            let apiName = '';
            let paramName = '';
            let dataName = '';
            // 拼装apiUrl
            let apiUrlArr = apiUrl.split('/');
            let apiUrlLen = apiUrlArr.length;
            let remark = '\n/**\n';
            if (postBody.description) {
              remark += '* ' + postBody.description + '\n';
            }
            postBody.parameters && postBody.parameters.forEach((parameter: any) => {
              remark += `* @argument {*} ${parameter.name} ${parameter.description || ''}\n`;
            });
            remark += '*/\n';
            if (apiUrlLen > 2) {
              let last = apiUrlArr[apiUrlLen - 1];
              let prev = apiUrlArr[apiUrlLen - 2];
              if (/^{.*}$/gi.test(prev)) {
                prev = prev.replace(/^{(.*)}$/, '$1');
                paramName += prev + ', ';
                prev = 'by' + prev[0].toUpperCase() + prev.substr(1, prev.length);
              }
              if (/^{.*}$/gi.test(last)) {
                last = last.replace(/^{(.*)}$/, '$1');
                paramName += last + ', ';
                last = 'by' + last[0].toUpperCase() + last.substr(1, last.length);
              }
              apiUrlArr = [prev, last];
              if (last.length >= 15) {
                // 如果api名称超过15位，则默认只取最后一个字段
                apiUrlArr = [last];
              }
            }
            if (postWay !== 'post') {
              if (!apiUrlArr[0].toLowerCase().includes(postWay)) {
                apiUrlArr.unshift(postWay);
              }
            }
            apiName = camelCase(apiUrlArr);
            if (postWay === 'get') {
              paramName += 'params';
              dataName = '{ params }';
            } else {
              paramName += 'data';
              dataName = 'data';
            }
            let apiUrlName = apiUrl.replace(/{/g, '${');
let func = `export function ${apiName}(${paramName}) {
  return request.${postWay}(\`${apiUrlName}\`, ${dataName})
}\n`;
            try {
              if (docs[postBody.tags[0]]) {
                if (generateType === generateTypes[1] || (generateType === generateTypes[0] && singleApi === `[${postWay}] ${apiUrl}`)) {
                  docs[postBody.tags[0]].url = Util.winRootPathHandle(docs[postBody.tags[0]].url);
                  fs.appendFileSync(docs[postBody.tags[0]].url, remark + func, 'utf-8');
                  if (store[docs[postBody.tags[0]].name]) {
                    store[docs[postBody.tags[0]].name].push(apiName);
                  } else {
                    store[docs[postBody.tags[0]].name] = [apiName];
                  }
                  // 单个接口生成store位置
                  if (generateType === generateTypes[0] && singleApi === `[${postWay}] ${apiUrl}`) {
                    if (!singleApiPathName.endsWith('.js')) {
                      singleApiPathName = singleApiPathName + '.js';
                    }
                    let apiStore = pageNew.apiStoreGenerate(apiName, singleApiPathName);
                    let hasModules = true;
                    let modulesPath = path.join(this.projectRoot, config.get('rootPathStore') || '', 'modules');
                    try {
                      fs.statSync(modulesPath);
                    } catch (error) {
                      hasModules = false;
                    }
                    let apiStoreJs = '';
                    let rootPathStore: string = config.get('rootPathStore') || '';
                    if (hasModules) {
                      apiStoreJs = path.join(this.projectRoot, rootPathStore, 'modules', singleApiPathName);
                    } else {
                      apiStoreJs = path.join(this.projectRoot, rootPathStore,  singleApiPathName);
                    }
                    apiStoreJs = Util.winRootPathHandle(apiStoreJs);
                    console.log('apiStoreJs', apiStoreJs);
                    try {
                      // 判断是否存在store文件
                      fs.statSync(apiStoreJs);
                      pageNew.fileGenerate(apiStoreJs, apiStoreJs, 'apiEachStore', {
                        apiStore
                      });
                    } catch (error) {
                      let pathTemplate = path.join(this.context.extensionUri.path, pageNew.templateRoot, 'api.js');
                      pathTemplate = Util.winRootPathHandle(pathTemplate);
                      pageNew.fileGenerate(apiStoreJs, pathTemplate, 'apiEachStore', {
                        apiStore
                      });
                    }
                  }
                }
              }
            } catch (error) {
              
            }
          }
        }

        // 生成store
        if (generateType === generateTypes[1]) {
        for (const storeFileName in store) {
          const storeMethods = store[storeFileName];
          let storeStr = '';
          storeStr = `import { #import#} from '@/api/${storeFileName}'

const state = () => {
  return {
  }
}
const mutations = {
  #mutations#
}
const actions = {
  #actions#
}
export default {
  namespaced: true,
  state,
  mutations,
  actions
}
`;
          let importStr = ' ';
          let mutationStr = '';
          let actionStr = '';
          storeMethods.forEach((method: any) => {
            if (importStr === ' ') {
            importStr = method;
            mutationStr += `${method}Sync(state, payload) {\n  }`;
            actionStr += `async ${method}Async({ commit }, data) {
    const res = await ${method}(data)
    commit('${method}Sync', res.data)
    return res.data
  }`;
          } else {
              importStr += ', ' + method;
              mutationStr += `,\n  ${method}Sync(state, payload) {\n  }`;
              actionStr += `,\n  async ${method}Async({ commit }, data) {
    const res = await ${method}(data)
    commit('${method}Sync', res.data)
    return res.data
  }`;
            }
          });
          importStr += ' ';
          storeStr = storeStr.replace(/#import#/gi, importStr);
          storeStr = storeStr.replace(/#mutations#/gi, mutationStr);
          storeStr = storeStr.replace(/#actions#/gi, actionStr);
          let rootPathStore: string = config.get('rootPathStore') || '';
          if (rootPathStore) {
            // 判断modules目录是否存在
            let hasModules = true;
            let modulesPath = path.join(this.projectRoot, config.get('rootPathStore') || '', 'modules');
            try {
              fs.statSync(modulesPath);
            } catch (error) {
              hasModules = false;
            }
            let storePath = '';
            if (hasModules) {
              storePath = path.join(this.projectRoot, rootPathStore, 'modules', storeFileName + '.js');
            } else {
              storePath = path.join(this.projectRoot, rootPathStore,  storeFileName + '.js');
            }
            try {
              storePath = Util.winRootPathHandle(storePath);
              fs.appendFileSync(storePath, storeStr, 'utf-8');
            } catch (error) {
              
            }
          }
        }
      }
    }
      
    }
  }
  async outline() {
    if (vscode.window.activeTextEditor) {
      console.log('hasActive');
      // workbench.action.gotoSymbol
      // vscode.SymbolKind.Function
      vscode.commands.executeCommand('vscode.executeWorkspaceSymbolProvider', '').then((values) => {
        console.log(values);
      });
    }
  }
}