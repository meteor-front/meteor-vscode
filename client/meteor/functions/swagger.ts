import { window, workspace,  Uri, Position, QuickInputButton, QuickPickItem, TextEditorEdit } from 'vscode'
import { getWorkspaceRoot, winRootPathHandle, getRelativePath, open } from '../utils/util'
import * as path from 'path';
import * as fs from 'fs'
const camelCase = require('camelcase');
import NewPage from './newPage'
import Meteor from '../meteor'

export default class SwaggerFactory {
  private workspaceRoot: string
  private projectName: string
  private apis: string [] = []
  private names: string [] = []
  private docs: any = {}
  private paths: any
  public swaggerData: any = null
  public meteor: Meteor

  constructor(meteor: Meteor) {
    this.meteor = meteor
    this.workspaceRoot = getWorkspaceRoot('')
    this.projectName = this.workspaceRoot.replace(/.*\//gi, '')
  }
  // swagger生成api
  async generate(justData: boolean, isForce: boolean, updateUrl: boolean) {
    let swaggerUrlConfig: any = this.meteor.config.get('swaggerUrl') || {};
    let url = swaggerUrlConfig[this.projectName] || ''
    if (updateUrl) {
      url = ''
    }
    // 新增操作
    if (!url && !justData) {
      url = await window.showInputBox({
        placeHolder: '请输入swagger地址'
      });
      if (url) {
        if (Object.keys(swaggerUrlConfig).length === 0) {
          swaggerUrlConfig = {
            [this.projectName]: url
          }
        } else {
          swaggerUrlConfig[this.projectName] = url
        }
        this.meteor.config.update('swaggerUrl', swaggerUrlConfig);
      }
    }
    // url不存在，结束
    if (!url) {
      return
    }
    // 强制刷新数据
    if (!(justData && (!this.swaggerData || isForce))) {
      if (justData) {
        return
      }
    }
    // 生成接口选项列表
    if (url.includes('swagger-ui.html') || url.includes('doc.html')) {
      // html地址，进行转换
      url = url.replace(/(.*)swagger-ui.html.*/gi, '$1swagger-resources').replace(/(.*)doc.html.*/gi, '$1swagger-resources')
      let res = await this.meteor.fetch.get(url);
      if (res && res.data) {
        url = url.replace('/swagger-resources', res.data[0].url || res.data[0].location);
      }
    }
    // 获取swagger api内容
    let res = await this.meteor.fetch.get(url);
    if (res && res.data) {
      if (res.data.paths) {
        this.paths = res.data.paths
        let docs: any = {};
        res.data.tags.forEach((tag: any) => {
          let tagName = ''
          if (/^[a-zA-Z\s]*$/gi.test(tag.name)) {
            tagName = tag.name
          } else if (/^[a-zA-Z\s]*$/gi.test(tag.description)) {
            tagName = tag.description
          }
          let name = camelCase(tagName.replace(/\s/gi, '')).replace(/Controller$/gi, '');
          name = name[0].toLowerCase() + name.substr(1, name.length);
          docs[tagName] = {};
          let apiPath = path.join(this.workspaceRoot, this.meteor.config.get('rootPathApi') || '', name + '.js');
          apiPath = winRootPathHandle(apiPath);
          docs[tagName].name = name;
          docs[tagName].url = apiPath;
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
        this.swaggerData = res
  
        if (justData) {
          return
        }
  
        const templatePick = window.createQuickPick();
        templatePick.title = 'Swagger接口生成';
        templatePick.placeholder = '选择接口名称';
        class TemplateButton implements QuickInputButton {
          constructor(public iconPath: { light: Uri; dark: Uri; }, public tooltip: string) { }
        }
        templatePick.buttons = [new TemplateButton({
          dark: Uri.file(this.meteor.context.asAbsolutePath('asset/dark/web.svg')),
          light: Uri.file(this.meteor.context.asAbsolutePath('asset/light/web.svg')),
        }, '打开Swagger地址'), new TemplateButton({
          dark: Uri.file(this.meteor.context.asAbsolutePath('asset/dark/replace.svg')),
          light: Uri.file(this.meteor.context.asAbsolutePath('asset/light/replace.svg')),
        }, '替换Swagger地址'), new TemplateButton({
          dark: Uri.file(this.meteor.context.asAbsolutePath('asset/dark/all.svg')),
          light: Uri.file(this.meteor.context.asAbsolutePath('asset/light/all.svg')),
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
            case '打开Swagger地址':
              let swaggerUrlConfig: any = this.meteor.config.get('swaggerUrl') || {};
              let url = swaggerUrlConfig[this.projectName] || ''
              open(url)
              break;
            case '替换Swagger地址':
              this.generate(false, false, true)
              break;
            case '生成全部接口':
              this.generateAllApi()
              break;
          
            default:
              break;
          }
        }),
        templatePick.onDidHide(() => templatePick.dispose());
        templatePick.show();
      } else {
        window.showWarningMessage('swagger请求数据错误，[更换地址](command:meteor.replaceSwaggerAddress)！')
      }
    }
  }

  // 生成api名称通用方法
  getApiName(post: any, postWay: string, apiUrl: string, apiNameList: string[]) {
    const postBody = post[postWay];
    let apiName = '';
    let paramName = '';
    // 拼装apiUrl
    let apiUrlArrPrev: string[] = apiUrl.split('/');
    let apiUrlArr: string[] = []
    let apiUrlLen = apiUrlArrPrev.length;
    let remark = '\n/**\n';
    if (postBody.description) {
      remark += '* ' + postBody.description + '\n';
    }
    postBody.parameters && postBody.parameters.forEach((parameter: any) => {
      remark += `* @argument {*} ${parameter.name} ${parameter.description || ''}\n`;
    });
    remark += '*/\n';
    if (apiUrlLen > 2) {
      let last = apiUrlArrPrev[apiUrlLen - 1];
      let prev = apiUrlArrPrev[apiUrlLen - 2];
      let idInParent = false
      if (/^{.*}$/gi.test(prev)) {
        prev = prev.replace(/^{(.*)}$/, '$1');
        paramName += prev + ', ';
        idInParent = true
        prev = 'by' + prev[0].toUpperCase() + prev.substr(1, prev.length);
      }
      if (/^{.*}$/gi.test(last)) {
        last = last.replace(/^{(.*)}$/, '$1');
        paramName += last + ', ';
        last = 'by' + last[0].toUpperCase() + last.substr(1, last.length);
      }
      if (idInParent) {
        apiUrlArr = [prev, last];
      } else {
        apiUrlArr = [last];
      }
    } else {
      apiUrlArr = [apiUrlArrPrev[apiUrlLen - 1]]
    }
    // 加上请求前缀
    if (apiUrlArr[0] && !apiUrlArr[0].toLowerCase().includes(postWay)) {
      apiUrlArr.unshift(postWay);
    }
    // 重名处理
    apiName = camelCase(apiUrlArr);
    if (apiNameList.indexOf(apiName) !== -1) {
      let name = ''
      if (apiUrlLen > 2) {
        name = apiUrlArrPrev[apiUrlLen - 2]
        if (!/^{.*}$/gi.test(name)) {
          apiUrlArr.splice(1, 0, name)
          apiName = camelCase(apiUrlArr);
        }
        if (apiNameList.indexOf(apiName) !== -1) {
          if (apiUrlLen > 3) {
            name = apiUrlArrPrev[apiUrlLen - 3]
            if (!/^{.*}$/gi.test(name)) {
              apiUrlArr.splice(1, 0, name)
              apiName = camelCase(apiUrlArr);
            }
          }
          if (apiNameList.indexOf(apiName) !== -1) {
            if (apiUrlLen > 4) {
              name = apiUrlArrPrev[apiUrlLen - 4]
              if (!/^{.*}$/gi.test(name)) {
                apiUrlArr.splice(1, 0, name)
                apiName = camelCase(apiUrlArr);
              }
            }
          }
        }
      }
    }
    return {
      apiName,
      paramName,
      remark
    }
  }

  // 生成全部接口
  generateAllApi() {
    for (const key in this.docs) {
      if (Object.prototype.hasOwnProperty.call(this.docs, key)) {
        const doc = this.docs[key];
        let apiPath = path.join(this.workspaceRoot, this.meteor.config.get('rootPathApi') || '', doc.name + '.js');
        apiPath = winRootPathHandle(apiPath);
        try {
          fs.writeFileSync(apiPath, `import request from \'${this.meteor.config.get('rootPathRequest')}'\n`);
        } catch (error) {
        }
      }
    }
    this.writeStore(this.writeApi(true, '', ''))
  }

  // 生成单个接口
  generateSingleApi(singleApi: string) {
    // 如果没有入口页面，生成。有，不处理
    let singleApiPath = '';
    let singleApiPathName = '';
    try {
      let index = this.apis.indexOf(singleApi);
      singleApiPathName = this.docs[this.names[index]].name;
      singleApiPath = path.join(this.workspaceRoot, this.meteor.config.get('rootPathApi') || '', singleApiPathName + '.js');
      if (index !== -1) {
        singleApiPath = winRootPathHandle(singleApiPath);
        fs.statSync(singleApiPath);
      }
    } catch (error) {
      fs.writeFileSync(singleApiPath, `import request from \'${this.meteor.config.get('rootPathRequest')}'\n`);
    }
    this.writeApi(false, singleApi, singleApiPathName)
  }

  // 写入api
  writeApi(all: boolean, singleApi: string, singleApiPathName: string) {
    // 生成接口
    let store: any = {};
    let apiNameList: string[] = []
    for (const apiUrl in this.paths) {
      const post = this.paths[apiUrl];
      for (const postWay in post) {
        let dataName = '';
        let ret = this.getApiName(post, postWay, apiUrl, apiNameList)
        let apiName = ret.apiName
        let paramName = ret.paramName
        let remark = ret.remark
        apiNameList.push(apiName)
        if (postWay === 'get') {
          paramName += 'data';
          dataName = '{ ...config, params: data }';
        } else {
          paramName += 'data';
          dataName = 'data, config';
        }
        let apiUrlName = apiUrl.replace(/{/g, '${');
let func = `export function ${apiName}(${paramName}, config) {
  return request.${postWay}(\`${apiUrlName}\`, ${dataName})
}\n`;
        try {
          const postBody = post[postWay];
          if (this.docs[postBody.tags[0]]) {
            if (all || (!all && singleApi === `[${postWay}] ${apiUrl}`)) {
              let apiText = fs.readFileSync(this.docs[postBody.tags[0]].url, 'utf-8')
              if (!all && new RegExp(`export\\s*function\\s*${apiName}`).test(apiText)) {
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
                let modulesPath = path.join(this.workspaceRoot, this.meteor.config.get('rootPathStore') || '', 'modules');
                try {
                  fs.statSync(modulesPath);
                } catch (error) {
                  hasModules = false;
                }
                let apiStoreJs = '';
                let rootPathStore: string = this.meteor.config.get('rootPathStore') || '';
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
                  let pathTemplate = path.join(this.meteor.context.extensionUri.path, NewPage.templateRoot, 'api.js');
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
      let relativePath = getRelativePath(path.join(this.workspaceRoot, this.meteor.config.get('rootPathStore'), 'modules/store'), path.join(this.workspaceRoot, this.meteor.config.get('rootPathApi')))
      storeStr = `import { #import#} from '${relativePath}/${storeFileName}'

const state = () => {
${this.meteor.tabSpace}return {
${this.meteor.tabSpace}}
}
const mutations = {
#mutations#
}
const actions = {
#actions#
}
export default {
${this.meteor.tabSpace}namespaced: true,
${this.meteor.tabSpace}state,
${this.meteor.tabSpace}mutations,
${this.meteor.tabSpace}actions
}
`;
      let importStr = ' ';
      let mutationStr = '';
      let actionStr = '';
      storeMethods.forEach((method: any) => {
        if (importStr === ' ') {
        importStr = method;
        mutationStr += `${this.meteor.tabSpace}${method}(state, payload) {\n  }`;
        actionStr += `${this.meteor.tabSpace}async ${method}({ commit }, data, config) {
${this.meteor.tabSpace}${this.meteor.tabSpace}const res = await ${method}(data)
${this.meteor.tabSpace}${this.meteor.tabSpace}commit('${method}', res.data, config)
${this.meteor.tabSpace}${this.meteor.tabSpace}return res.data
${this.meteor.tabSpace}}`;
      } else {
          importStr += ', ' + method;
          mutationStr += `,\n  ${method}(state, payload) {\n  }`;
          actionStr += `,\n${this.meteor.tabSpace}async ${method}({ commit }, data, config) {
${this.meteor.tabSpace}${this.meteor.tabSpace}const res = await ${method}(data)
${this.meteor.tabSpace}${this.meteor.tabSpace}commit('${method}', res.data, config)
${this.meteor.tabSpace}${this.meteor.tabSpace}return res.data
${this.meteor.tabSpace}}`;
        }
      });
      importStr += ' ';
      storeStr = storeStr.replace(/#import#/gi, importStr);
      storeStr = storeStr.replace(/#mutations#/gi, mutationStr);
      storeStr = storeStr.replace(/#actions#/gi, actionStr);
      let rootPathStore: string = this.meteor.config.get('rootPathStore') || '';
      if (rootPathStore) {
        // 判断modules目录是否存在
        let hasModules = true;
        let modulesPath = path.join(this.workspaceRoot, this.meteor.config.get('rootPathStore') || '', 'modules');
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
          fs.writeFileSync(storePath, storeStr, 'utf-8');
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
        let tagName = ''
        if (/^[a-zA-Z\s]*$/gi.test(tag.name)) {
          tagName = tag.name
        } else if (/^[a-zA-Z\s]*$/gi.test(tag.description)) {
          tagName = tag.description
        }
        let name = camelCase(tagName.replace(/\s/gi, '')).replace(/Controller$/gi, '');
        name = name[0].toLowerCase() + name.substr(1, name.length);
        docs[tagName] = {};
        // 生成接口入口文件
        if (!this.workspaceRoot) {
          window.showInformationMessage("请先打开工程");
          return;
        }
        let apiPath = path.join(this.workspaceRoot, this.meteor.config.get('rootPathApi') || '', name + '.js');
        apiPath = winRootPathHandle(apiPath);
        docs[tagName].name = name;
        docs[tagName].url = apiPath;
        try {
          if (all) {
            fs.writeFileSync(apiPath, `import request from \'${this.meteor.config.get('rootPathRequest')}'\n`);
          }
        } catch (error) {
        }
        let rootPathStore: string = this.meteor.config.get('rootPathStore') || '';
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

  // 从服务端生成api
  apiGenerateFileExtra(apiParams: any) {
    if (apiParams.text) {
      switch (apiParams.type) {
        case 'api':
          this.apiGenerateFileExtraInApi(apiParams)
          break;
        case 'store':
            this.apiGenerateFileExtraInStore(apiParams)
            break;
      
        default:
          break;
      }
    }
  }

  // 直接调用api里面的接口
  apiGenerateFileExtraInApi(apiParams: any) {
    let editor = window.activeTextEditor;
    if (!editor) { return; }
    let relativePath = getRelativePath(editor.document.uri.path, path.join(this.workspaceRoot, this.meteor.config.get('rootPathApi') || '', apiParams.path))
    let currentLine = 0
    let count = editor.document.lineCount
    let endReg = /\s*export\s*default\s*{\s*/gi
    while (currentLine < count) {
      let text = editor.document.lineAt(currentLine).text
      if (endReg.test(text)) {
        // 上一行为空判断
        text = editor.document.lineAt(currentLine - 1).text
        while (!text.trim() && currentLine > 0) {
          --currentLine
          text = editor.document.lineAt(currentLine - 1).text
        }
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
      // 判断是否存在async
      let currentActiveLine = window.activeTextEditor?.selection.active.line
      let AddAsyncPosition: Position = new Position(0, 0)
      if (currentActiveLine && currentActiveLine > 0) {
        let text = ''
        while(currentActiveLine > 0) {
          text = editor.document.lineAt(currentActiveLine - 1).text
          if (/^\s*async\s*\w*\(\w*\)\s*{\s*$/gi.test(text)) {
            break
          } else if (/^\s*\w*\(\w*\)\s*{\s*$/gi.test(text)) {
            AddAsyncPosition = new Position(currentActiveLine - 1, text.indexOf(text.trim()))
            break
          } else if (/^\s*methods\s*:\s*{\s*$/gi.test(text)) {
            break
          }
          --currentActiveLine
        }
      }
      editor.edit((editBuilder: any) => {
        if (AddAsyncPosition.line > 0) {
          editBuilder.insert(AddAsyncPosition, 'async ');
        }
        editBuilder.insert(new Position(currentLine, 0), `import { ${apiParams.name} } from '${relativePath}'\n`);
      })
    }
  }

  // 通过store调用接口
  apiGenerateFileExtraInStore(apiParams: any) {
    let editor = window.activeTextEditor;
    if (!editor) { return; }
    let fileName = apiParams.path.replace(/.*\/(\w*).\w*/gi, '$1')
    let currentLine = 0
    let count = editor.document.lineCount
    let endReg = /\s*export\s*default\s*{\s*/gi
    let isImport = false
    let insertList: any[] = []
    while (currentLine < count) {
      let text = editor.document.lineAt(currentLine).text
      if (endReg.test(text)) {
        // 上一行为空判断
        text = editor.document.lineAt(currentLine - 1).text
        while (!text.trim() && currentLine > 0) {
          --currentLine
          text = editor.document.lineAt(currentLine - 1).text
        }
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
        if (new RegExp(`\\s*...mapActions\\(\\s*'\\s*${fileName.replace(/(.*)\..*/, '$1')}\\s*'\\s*,\\s*\\[.*\\]\\s*\\)\\s*,\\s*`, 'gi').test(text)) {
          // 已导入文件，判断接口是否导入
          if (!new RegExp(`\\[.*${apiParams.name}.*\\]`, 'gi').test(text)) {
            insertList.push([new Position(currentLine, text.replace(/\s*\].*/gi, '').length), `, '${apiParams.name}'`])
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
      insertList.push([new Position(methodsLine + 1, 0), `    ...mapActions('${fileName.replace(/(.*)\..*/, '$1')}', ['${apiParams.name}']),\n`])
    }
    if (insertList.length > 0) {
      // 判断是否存在async
      let currentActiveLine = window.activeTextEditor?.selection.active.line
      let AddAsyncPosition: Position = new Position(0, 0)
      if (currentActiveLine && currentActiveLine > 0) {
        let text = ''
        while(currentActiveLine > 0) {
          text = editor.document.lineAt(currentActiveLine - 1).text
          if (/^\s*async\s*\w*\(\w*\)\s*{\s*$/gi.test(text)) {
            break
          } else if (/^\s*\w*\(\w*\)\s*{\s*$/gi.test(text)) {
            AddAsyncPosition = new Position(currentActiveLine - 1, text.indexOf(text.trim()))
            break
          } else if (/^\s*methods\s*:\s*{\s*$/gi.test(text)) {
            break
          }
          --currentActiveLine
        }
      }
      editor.edit((editBuilder: TextEditorEdit) => {
        if (AddAsyncPosition.line > 0) {
          editBuilder.insert(AddAsyncPosition, 'async ');
        }
        for (let i = 0; i < insertList.length; i++) {
          const insertText = insertList[i]
          editBuilder.insert(insertText[0], insertText[1]);
        }
      })
    }
  }
}