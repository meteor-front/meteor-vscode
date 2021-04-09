import { WorkspaceConfiguration, window, ConfigurationTarget, ExtensionContext, workspace,  Uri, Position, commands, QuickInputButton, QuickPickItem } from 'vscode'
import { AxiosInstance } from 'axios';
import { getWorkspaceRoot, winRootPathHandle, getRelativePath } from '../utils/util'
import * as path from 'path';
import * as fs from 'fs'
const camelCase = require('camelcase');
import NewPage from './newPage'

export default class SwaggerFactory {
  private config: WorkspaceConfiguration
  private fetch: AxiosInstance
  private workspaceRoot: string
  private context: ExtensionContext
  private projectName: string
  private apis: string [] = []
  private names: string [] = []
  private docs: any = {}
  private paths: any

  constructor(config:WorkspaceConfiguration, fetch: AxiosInstance, context: ExtensionContext) {
    this.config = config
    this.fetch = fetch
    this.context = context
    this.workspaceRoot = getWorkspaceRoot('')
    this.projectName = this.workspaceRoot.replace(/.*\//gi, '')
  }
  // swagger生成api
  async generate() {
    let swaggerUrlConfig: any = this.config.get('swaggerUrl') || [];
    let url = swaggerUrlConfig[this.projectName] || ''
    // 新增操作
    if (!url) {
      url = await window.showInputBox({
        placeHolder: '请输入swagger地址'
      });
      if (url) {
        swaggerUrlConfig[this.projectName] = url
        this.config.update('swaggerUrl', swaggerUrlConfig, ConfigurationTarget.Global);
      } else {
        return
      }
    }
    // 生成接口选项列表
    if (url.includes('swagger-ui.html') || url.includes('doc.html')) {
      // html地址，进行转换
      url = url.replace(/(.*)swagger-ui.html.*/gi, '$1swagger-resources').replace(/(.*)doc.html.*/gi, '$1swagger-resources')
      console.log('replace: ' + url)
      let res = await this.fetch.get(url);
      if (res && res.data) {
        url = url.replace('/swagger-resources', res.data[0].url || res.data[0].location);
      }
    }
    // 获取swagger api内容
    let res = await this.fetch.get(url);
    if (res && res.data) {
      this.paths = res.data.paths
      let docs: any = {};
      res.data.tags.forEach((tag: any) => {
        let name = tag.description.replace(/\s/gi, '').replace(/Controller$/gi, '');
        name = name[0].toLowerCase() + name.substr(1, name.length);
        docs[tag.name] = {};
        let apiPath = path.join(this.workspaceRoot, this.config.get('rootPathApi') || '', name + '.js');
        apiPath = winRootPathHandle(apiPath);
        docs[tag.name].name = name;
        docs[tag.name].url = apiPath;
      })
      this.docs = docs

      let apis: string[] = [];
      let items: QuickPickItem[] = [];
      let names = [];
      for (const apiUrl in res.data.paths) {
        const post = res.data.paths[apiUrl];
        for (const postWay in post) {
          const postBody = post[postWay];
          apis.push(`[${postWay}] ${apiUrl}`)
          items.push({
            label: `[${postWay}] ${apiUrl}`,
            description: ''
          });
          names.push(postBody.tags[0]);
        }
      }
      this.apis = apis
      this.names = names

      const templatePick = window.createQuickPick();
      templatePick.title = 'Swagger接口生成';
      templatePick.placeholder = '选择接口名称';
      class TemplateButton implements QuickInputButton {
        constructor(public iconPath: { light: Uri; dark: Uri; }, public tooltip: string) { }
      }
      templatePick.buttons = [new TemplateButton({
        dark: Uri.file(this.context.asAbsolutePath('asset/dark/replace.svg')),
        light: Uri.file(this.context.asAbsolutePath('asset/light/replace.svg')),
      }, '替换Swagger地址'), new TemplateButton({
        dark: Uri.file(this.context.asAbsolutePath('asset/dark/all.svg')),
        light: Uri.file(this.context.asAbsolutePath('asset/dark/all.svg')),
      }, '生成全部接口')];
      templatePick.items = items;
      templatePick.onDidChangeSelection(selection => {
        templatePick.hide();
        // 打开工程才能继续
        if (workspace.workspaceFolders && selection[0] && selection[0].label) {
          this.generateSingleApi(selection[0].label)
        }
      });
      templatePick.onDidTriggerButton(item => {
        switch (item.tooltip) {
          case '替换Swagger地址':
            break;
          case '生成全部接口':
            break;
        
          default:
            break;
        }
      }),
      templatePick.onDidHide(() => templatePick.dispose());
      templatePick.show();
    }
  }

  // 生成单个接口
  generateSingleApi(singleApi: string) {
    // 如果没有入口页面，生成。有，不处理
    let singleApiPath = '';
    let singleApiPathName = '';
    try {
      let index = this.apis.indexOf(singleApi);
      singleApiPathName = this.docs[this.names[index]].name;
      singleApiPath = path.join(this.workspaceRoot, this.config.get('rootPathApi') || '', singleApiPathName + '.js');
      if (index !== -1) {
        singleApiPath = winRootPathHandle(singleApiPath);
        fs.statSync(singleApiPath);
      }
    } catch (error) {
      fs.writeFileSync(singleApiPath, 'import request from \'@/utils/request\'\n');
    }
    this.writeApi(false, singleApi, singleApiPathName)
  }

  // 写入api
  writeApi(all: boolean, singleApi: string, singleApiPathName: string) {
    // 生成接口
    let store: any = {};
    for (const apiUrl in this.paths) {
      const post = this.paths[apiUrl];
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
          if (this.docs[postBody.tags[0]]) {
            if (all || (!all && singleApi === `[${postWay}] ${apiUrl}`)) {
              let apiText = fs.readFileSync(this.docs[postBody.tags[0]].url, 'utf-8')
              if (new RegExp(`export\\s*function\\s*${apiName}`).test(apiText)) {
                console.log('exist')
                // 接口已存在
                return
              }
              this.docs[postBody.tags[0]].url = winRootPathHandle(this.docs[postBody.tags[0]].url);
              fs.appendFileSync(this.docs[postBody.tags[0]].url, remark + func, 'utf-8');
              if (store[this.docs[postBody.tags[0]].name]) {
                store[this.docs[postBody.tags[0]].name].push(apiName);
              } else {
                store[this.docs[postBody.tags[0]].name] = [apiName];
              }
              // 单个接口生成store位置
              if (!all && singleApi === `[${postWay}] ${apiUrl}`) {
                if (!singleApiPathName.endsWith('.js')) {
                  singleApiPathName = singleApiPathName + '.js';
                }
                let apiStore = NewPage.apiStoreGenerate(apiName, singleApiPathName);
                let hasModules = true;
                let modulesPath = path.join(this.workspaceRoot, this.config.get('rootPathStore') || '', 'modules');
                try {
                  fs.statSync(modulesPath);
                } catch (error) {
                  hasModules = false;
                }
                let apiStoreJs = '';
                let rootPathStore: string = this.config.get('rootPathStore') || '';
                if (hasModules) {
                  apiStoreJs = path.join(this.workspaceRoot, rootPathStore, 'modules', singleApiPathName);
                } else {
                  apiStoreJs = path.join(this.workspaceRoot, rootPathStore,  singleApiPathName);
                }
                apiStoreJs = winRootPathHandle(apiStoreJs);
                try {
                  // 判断是否存在store文件
                  fs.statSync(apiStoreJs);
                  NewPage.fileGenerate(apiStoreJs, apiStoreJs, 'apiEachStore', {
                    apiStore
                  });
                } catch (error) {
                  let pathTemplate = path.join(this.context.extensionUri.path, NewPage.templateRoot, 'api.js');
                  pathTemplate = winRootPathHandle(pathTemplate);
                  NewPage.fileGenerate(apiStoreJs, pathTemplate, 'apiEachStore', {
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
    return store
  }

  // 写入store
  writeStore(store: any) {
    // 生成store
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
      let rootPathStore: string = this.config.get('rootPathStore') || '';
      if (rootPathStore) {
        // 判断modules目录是否存在
        let hasModules = true;
        let modulesPath = path.join(this.workspaceRoot, this.config.get('rootPathStore') || '', 'modules');
        try {
          fs.statSync(modulesPath);
        } catch (error) {
          hasModules = false;
        }
        let storePath = '';
        if (hasModules) {
          storePath = path.join(this.workspaceRoot, rootPathStore, 'modules', storeFileName + '.js');
        } else {
          storePath = path.join(this.workspaceRoot, rootPathStore,  storeFileName + '.js');
        }
        try {
          storePath = winRootPathHandle(storePath);
          fs.appendFileSync(storePath, storeStr, 'utf-8');
        } catch (error) {
          
        }
      }
    }
  }

  // 根据swagger的tags标签生成api文件
  async generateFile(res: any, all: boolean) {
    if (res && res.data) {
      let docs: any = {};
      res.data.tags.forEach((tag: any) => {
        let name = tag.description.replace(/\s/gi, '').replace(/Controller$/gi, '');
        name = name[0].toLowerCase() + name.substr(1, name.length);
        docs[tag.name] = {};
        // 生成接口入口文件
        if (!this.workspaceRoot) {
          window.showInformationMessage("请先打开工程");
          return;
        }
        let apiPath = path.join(this.workspaceRoot, this.config.get('rootPathApi') || '', name + '.js');
        apiPath = winRootPathHandle(apiPath);
        docs[tag.name].name = name;
        docs[tag.name].url = apiPath;
        try {
          if (all) {
            fs.writeFileSync(apiPath, 'import request from \'@/utils/request\'\n');
          }
        } catch (error) {
        }
        let rootPathStore: string = this.config.get('rootPathStore') || '';
        if (rootPathStore) {
          // 判断modules目录是否存在
          let hasModules = true;
          let modulesPath = path.join(this.workspaceRoot, rootPathStore, 'modules');
          try {
            fs.statSync(modulesPath);
          } catch (error) {
            hasModules = false;
          }
          let storePath = '';
          if (hasModules) {
            storePath = path.join(this.workspaceRoot, rootPathStore, 'modules', name + '.js');
          } else {
            storePath = path.join(this.workspaceRoot, rootPathStore,  name + '.js');
          }
          try {
            if (all) {
              storePath = winRootPathHandle(storePath);
              fs.writeFileSync(storePath, '');
            }
          } catch (error) {
            console.log(error);
          }
        }
      });
    }
  }

  // 

  // 生成api
  async generateApi(url: string) {
    let generateTypes = ['单个接口', '全部接口'];
    let generateType = await window.showQuickPick(generateTypes, {
      placeHolder: '选择生成范围 [默认全部]'
    });
    if (!generateType) {
      return;
    }
    if (url) {
      if (url.endsWith('swagger-ui.html') || url.endsWith('swagger-ui.html#/')) {
        // html地址，进行转换
        let res = await this.fetch.get(url.replace(/(.*)swagger-ui.html.*/gi, '$1swagger-resources'));
        if (res && res.data) {
          url = url.replace('/swagger-ui.html', res.data[0].url || res.data[0].location);
        }
      }
      // 获取swagger api内容
      let res = await this.fetch.get(url);
      if (res && res.data) {
        let docs: any = {};
        res.data.tags.forEach((tag: any) => {
          let name = tag.description.replace(/\s/gi, '').replace(/Controller$/gi, '');
          name = name[0].toLowerCase() + name.substr(1, name.length);
          docs[tag.name] = {};
          // 生成接口入口文件
          if (!this.workspaceRoot) {
            window.showInformationMessage("请先打开工程");
            return;
          }
          let apiPath = path.join(this.workspaceRoot, this.config.get('rootPathApi') || '', name + '.js');
          apiPath = winRootPathHandle(apiPath);
          docs[tag.name].name = name;
          docs[tag.name].url = apiPath;
          try {
            if (generateType === generateTypes[1]) {
              fs.writeFileSync(apiPath, 'import request from \'@/utils/request\'\n');
            }
          } catch (error) {
          }
          let rootPathStore: string = this.config.get('rootPathStore') || '';
          if (rootPathStore) {
            // 判断modules目录是否存在
            let hasModules = true;
            let modulesPath = path.join(this.workspaceRoot, rootPathStore, 'modules');
            try {
              fs.statSync(modulesPath);
            } catch (error) {
              hasModules = false;
            }
            let storePath = '';
            if (hasModules) {
              storePath = path.join(this.workspaceRoot, rootPathStore, 'modules', name + '.js');
            } else {
              storePath = path.join(this.workspaceRoot, rootPathStore,  name + '.js');
            }
            try {
              if (generateType === generateTypes[1]) {
                storePath = winRootPathHandle(storePath);
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
          singleApi = await window.showQuickPick(apis, {
            placeHolder: '选择需要生成的接口名称'
          });
          if (singleApi) {
            // 如果没有入口页面，生成。有，不处理
            let singleApiPath = '';
            try {
              let index = apis.indexOf(singleApi);
              singleApiPathName = docs[names[index]].name;
              singleApiPath = path.join(this.workspaceRoot, this.config.get('rootPathApi') || '', singleApiPathName + '.js');
              if (index !== -1) {
                singleApiPath = winRootPathHandle(singleApiPath);
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
                  docs[postBody.tags[0]].url = winRootPathHandle(docs[postBody.tags[0]].url);
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
                    let apiStore = NewPage.apiStoreGenerate(apiName, singleApiPathName);
                    let hasModules = true;
                    let modulesPath = path.join(this.workspaceRoot, this.config.get('rootPathStore') || '', 'modules');
                    try {
                      fs.statSync(modulesPath);
                    } catch (error) {
                      hasModules = false;
                    }
                    let apiStoreJs = '';
                    let rootPathStore: string = this.config.get('rootPathStore') || '';
                    if (hasModules) {
                      apiStoreJs = path.join(this.workspaceRoot, rootPathStore, 'modules', singleApiPathName);
                    } else {
                      apiStoreJs = path.join(this.workspaceRoot, rootPathStore,  singleApiPathName);
                    }
                    apiStoreJs = winRootPathHandle(apiStoreJs);
                    try {
                      // 判断是否存在store文件
                      fs.statSync(apiStoreJs);
                      NewPage.fileGenerate(apiStoreJs, apiStoreJs, 'apiEachStore', {
                        apiStore
                      });
                    } catch (error) {
                      let pathTemplate = path.join(this.context.extensionUri.path, NewPage.templateRoot, 'api.js');
                      pathTemplate = winRootPathHandle(pathTemplate);
                      NewPage.fileGenerate(apiStoreJs, pathTemplate, 'apiEachStore', {
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
          let rootPathStore: string = this.config.get('rootPathStore') || '';
          if (rootPathStore) {
            // 判断modules目录是否存在
            let hasModules = true;
            let modulesPath = path.join(this.workspaceRoot, this.config.get('rootPathStore') || '', 'modules');
            try {
              fs.statSync(modulesPath);
            } catch (error) {
              hasModules = false;
            }
            let storePath = '';
            if (hasModules) {
              storePath = path.join(this.workspaceRoot, rootPathStore, 'modules', storeFileName + '.js');
            } else {
              storePath = path.join(this.workspaceRoot, rootPathStore,  storeFileName + '.js');
            }
            try {
              storePath = winRootPathHandle(storePath);
              fs.appendFileSync(storePath, storeStr, 'utf-8');
            } catch (error) {
              
            }
          }
        }
      }
    }
      
    }
  }

  // 从服务端生成api
  apiGenerateFromServer(apiParams: any) {
    if (apiParams.lineCount > 8) {
      // 参数太多，进行参数选择
      
    }
    // switch (apiParams.type) {
    //   case 'api':
    //     this.apiGenerateFromServerInApi(apiParams)
    //     break;
    //   case 'store':
    //       this.apiGenerateFromServerInStore(apiParams)
    //       break;
    
    //   default:
    //     break;
    // }
  }

  // 直接调用api里面的接口
  apiGenerateFromServerInApi(apiParams: any) {
    let editor = window.activeTextEditor;
    if (!editor) { return; }
    let relativePath = getRelativePath(editor.document.uri.path, apiParams.path)
    let currentLine = 0
    let count = editor.document.lineCount
    let endReg = /\s*export\s*default\s*{\s*/gi
    while (currentLine < count) {
      let text = editor.document.lineAt(currentLine).text
      if (endReg.test(text)) {
        break
      }
      // 存在import，且导入名称不存在
      if (new RegExp(`import\\s*{.*}\\s*from\\s*'${relativePath.replace(/\//gi, '\\\/')}'`, 'gi').test(text)) {
        if (!new RegExp(`{.*${apiParams.name}.*}`, 'gi').test(text)) {
          editor.edit((editBuilder: any) => {
            editBuilder.insert(new Position(currentLine, text.replace(/\s*}.*/gi, '').length), `, ${apiParams.name}`);
          })
        }
        return
      }
      currentLine++
    }
    // 说明没有import过
    if (currentLine < count) {
      editor.edit((editBuilder: any) => {
        editBuilder.insert(new Position(currentLine, 0), `import { ${apiParams.name} } from '${relativePath}'\n`);
      })
    }
  }

  // 通过store调用接口
  apiGenerateFromServerInStore(apiParams: any) {
    let editor = window.activeTextEditor;
    if (!editor) { return; }
    let relativePath = getRelativePath(editor.document.uri.path, apiParams.path)
    let fileName = relativePath.replace(/.*\/(\w*).\w*/gi, '$1')
    let currentLine = 0
    let count = editor.document.lineCount
    let endReg = /\s*export\s*default\s*{\s*/gi
    let isImport = false
    let insertList: any[] = []
    while (currentLine < count) {
      let text = editor.document.lineAt(currentLine).text
      if (endReg.test(text)) {
        break
      }
      // 存在import，且导入名称不存在
      if (new RegExp(`\\s*import\\s*{.*}\\s*from\\s*'vuex'`, 'gi').test(text)) {
        if (!new RegExp(`{.*mapActions.*}`, 'gi').test(text)) {
          insertList.push([new Position(currentLine, text.replace(/\s*}.*/gi, '').length), `, mapActions`])
        }
        isImport = true
        break
      }
      currentLine++
    }
    // 说明没有import过
    if (currentLine < count && !isImport) {
      insertList.push([new Position(currentLine, 0), `import { mapActions } from 'vuex'\n`])
    }

    // 找到method开始位置
    let methodsLine = currentLine
    while (currentLine < count) {
      let text = editor.document.lineAt(currentLine).text
      if (/\s*methods\s*:\s*{\s*/gi.test(text)) {
        methodsLine = currentLine
        break
      }
      currentLine++
    }
    // 插入mapAction
    isImport = true
    currentLine++
    while(currentLine < count) {
      let text = editor.document.lineAt(currentLine).text
      if (new RegExp(`\\s*...mapActions\\(\\s*'\\s*\\w*\\s*'\\s*,\\s*\\[.*\\]\\s*\\)\\s*,\\s*`, 'gi').test(text)) {
        if (new RegExp(`\\s*...mapActions\\(\\s*'\\s*${fileName}\\s*'\\s*,\\s*\\[.*\\]\\s*\\)\\s*,\\s*`, 'gi').test(text)) {
          // 已导入文件，判断接口是否导入
          if (!new RegExp(`\\[.*${apiParams.name}.*\\]`, 'gi').test(text)) {
            insertList.push([new Position(currentLine, text.replace(/\s*\].*/gi, '').length), `, '${apiParams.name}' `])
          }
          isImport = true
          break
        }
      } else {
        isImport = false
        break
      }
      currentLine++
    }
    if (currentLine < count && !isImport) {
      insertList.push([new Position(methodsLine + 1, 0), `    ...mapActions('${fileName}', ['${apiParams.name}']),\n`])
    }
    if (insertList.length > 0) {
      editor.edit((editBuilder: any) => {
        for (let i = 0; i < insertList.length; i++) {
          const insertText = insertList[i]
          editBuilder.insert(insertText[0], insertText[1]);
        }
      })
    }
  }
}