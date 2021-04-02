import { WorkspaceConfiguration, window, ConfigurationTarget, ExtensionContext } from 'vscode'
import { AxiosInstance } from 'axios';
import { getWorkspaceRoot, winRootPathHandle } from '../utils/util'
import * as path from 'path';
import * as fs from 'fs'
const camelCase = require('camelcase');
import NewPage from './newPage'

export default class SwaggerFactory {
  private config: WorkspaceConfiguration
  private fetch: AxiosInstance
  private workspaceRoot: string
  private context: ExtensionContext
  constructor(config:WorkspaceConfiguration, fetch: AxiosInstance, context: ExtensionContext) {
    this.config = config
    this.fetch = fetch
    this.context = context
    this.workspaceRoot = getWorkspaceRoot('')
  }
  // swagger生成api
  async generate() {
    let swaggerUrl: string[] = this.config.get('swaggerUrl') || [];
    let addText = '新增';
    let url = await window.showQuickPick([addText].concat(swaggerUrl), {
      placeHolder: '请选择swagger地址'
    });
    // 新增操作
    if (url === addText) {
      url = await window.showInputBox({
        placeHolder: '请输入swagger地址'
      });
      if (url && swaggerUrl.indexOf(url) === -1) {
        swaggerUrl.push(url);
        this.config.update('swaggerUrl', swaggerUrl, ConfigurationTarget.Global);
      }
    }
    // 生成选项
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

}