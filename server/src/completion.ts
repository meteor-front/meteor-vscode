import path from 'path';
import fs from 'fs'
import { CompletionItemKind, _Connection,  } from 'vscode-languageserver/node'
import axios, { AxiosInstance } from 'axios'
const camelCase = require('camelcase');
import Utils from './utils'
export default class Completion {
  private root: string
  private traversePath: string
  private fetch: AxiosInstance
  private meteorConfig: any
  private docs: any
  private swagger: any = null
  constructor(connection: any, meteorConfig: any) {
    this.meteorConfig = meteorConfig
    this.fetch = axios.create({
      baseURL: 'http://www.80fight.cn:8080',
      withCredentials: false
    })
  }
  updateConfig(meteorConfig: any) {
    this.meteorConfig = meteorConfig
  }
  updateRoot(root: string) {
    this.root = root
  }
  traverse() {
    let paths: string[] = []
    if (this.traversePath) {
      let dirs = fs.readdirSync(this.traversePath)
      dirs.forEach(dir => {
        try {
          let filePath = path.join(this.traversePath, dir)
          if (fs.statSync(filePath).isFile()) {
            paths.push(filePath)
          }
        } catch (error) {
          
        }
      })
    }
    return paths
  }
  // 获取swagger返回信息
  async getSwagger(isForce: boolean) {
    let url = this.getUrl()
    if (url && (!this.swagger || isForce)) {
      // 生成接口选项列表
      if (url.includes('swagger-ui.html') || url.includes('doc.html')) {
        // html地址，进行转换
        url = url.replace(/(.*)swagger-ui.html.*/gi, '$1swagger-resources').replace(/(.*)doc.html.*/gi, '$1swagger-resources')
        let res = await this.fetch.get(url);
        if (res && res.data) {
          url = url.replace('/swagger-resources', res.data[0].url || res.data[0].location);
        }
      }
      // 获取swagger api内容
      this.swagger = await this.fetch.get(url);
    }
  }
  getUrl() {
    return this.meteorConfig.swaggerUrl && this.meteorConfig.swaggerUrl[Utils.getProjectName(this.root)] || ''
  }
  provider() {
    let url = this.getUrl()
    if (url) {
      let res: any = this.swagger
      if (res && res.data) {
        let docs: any = {};
        res.data.tags.forEach((tag: any) => {
          let name = tag.description.replace(/\s/gi, '').replace(/Controller$/gi, '');
          name = name[0].toLowerCase() + name.substr(1, name.length);
          docs[tag.name] = {};
          docs[tag.name].name = name;
          docs[tag.name].url = name + '.js';
        })
        this.docs = docs
        let type = fs.existsSync(path.join(this.root, 'src/store/modules')) ? 'store' : 'api'
        let completions: any = []
        for (const apiUrl in res.data.paths) {
          const post = res.data.paths[apiUrl];
          for (const postWay in post) {
            const postBody = post[postWay];
            let apiName = '';
            // 拼装apiUrl
            let apiUrlArr = apiUrl.split('/');
            let apiUrlLen = apiUrlArr.length;
            let insertText = ''
            if (apiUrlLen > 2) {
              let last = apiUrlArr[apiUrlLen - 1];
              let prev = apiUrlArr[apiUrlLen - 2];
              if (/^{.*}$/gi.test(prev)) {
                prev = prev.replace(/^{(.*)}$/, '$1');
                prev = 'by' + prev[0].toUpperCase() + prev.substr(1, prev.length);
              }
              if (/^{.*}$/gi.test(last)) {
                last = last.replace(/^{(.*)}$/, '$1');
                last = 'by' + last[0].toUpperCase() + last.substr(1, last.length);
              }
              apiUrlArr = [prev, last];
              if (last.length >= 15) {
                // 如果api名称超过15位，则默认只取最后一个字段
                apiUrlArr = [last];
              }
            }
            if (!(apiUrlArr[0] && apiUrlArr[0].toLowerCase().includes(postWay))) {
              apiUrlArr.unshift(postWay);
            }
            apiName = camelCase(apiUrlArr);
            if (type === 'api') {
              insertText = `const res = await ${apiName}({\n`
            } else {
              insertText = `const res = await this.${apiName}({\n`
            }
            // postBody.parameters && postBody.parameters.forEach((parameter: any) => {
            //   if (parameter.schema && parameter.schema.originalRef) {
            //     insertText = this.traverseGetParams(insertText, parameter.schema.originalRef, '  ')
            //   } else {
            //     insertText += `  ${parameter.name}: '${parameter.type}',\n`
            //   }
            // })
            insertText += '})'
            let lineCount = insertText.split('\n').length
            completions.push({
              label: apiName,
              insertText: lineCount < 8 ? insertText : '',
              sortText: '555' + completions.length,
              kind: CompletionItemKind.Folder,
              command: { command: 'meteor.apiGenerateFileExtra', arguments: [{
                path: this.docs[postBody.tags[0]].url,
                name: apiName,
                type: type,
                lineCount: lineCount,
                text: insertText,
                swagger: this.swagger.data
              }] },
              documentation: `[${postBody.tags[0] || 'meteor'}] ${postBody.summary}`
            })
          }
        }
        return completions
      }
    } else if (false) {
      // 通过api文件生成
      let pathApi = path.join(this.root, 'src/api')
      if (fs.existsSync(pathApi)) {
        this.traversePath = pathApi
        let paths = this.traverse()
        let type = fs.existsSync(path.join(this.root, 'src/store/modules')) ? 'store' : 'api'
        // 存在api文件
        if(paths.length > 0) {
          let completions: any = []
          paths.forEach(pathName => {
            let argumentList: object[] = []
            let file = fs.readFileSync(pathName, 'utf-8')
            let fileList = file.split('\n')
            for (let i = 0; i < fileList.length; i++) {
              const content = fileList[i];
              let argument: any = content.match(/.*argument\s*{(.*)}\s(\w*).*/i)
              let func = content.match(/.*export\s*function\s*(\w*)\s*.*/i)
              if (argument) {
                argumentList.push({
                  name: argument[2] || '',
                  type: argument[1] === '*' ? "''" : argument[1] || "''"
                })
              } else if (func && func[1]) {
                let insertText = ''
                if (type === 'api') {
                  insertText = `const res = await ${func[1]}({\n`
                } else {
                  insertText = `const res = await this.${func[1]}({\n`
                }
                argumentList.forEach((argumentItem: any, argumentIndex) => {
                  insertText += `  ${argumentItem.name}: ${argumentItem.type}`
                  if (argumentList.length > argumentIndex + 1) {
                    insertText += ',\n'
                  } else {
                    insertText += '\n'
                  }
                });
                insertText += '})'
                completions.push({
                  label: func[1],
                  insertText: insertText,
                  sortText: '555' + completions.length,
                  kind: CompletionItemKind.Folder,
                  command: { command: 'meteor.apiGenerateFileExtra', title: 'meteorApi', arguments: [{
                    path: pathName,
                    name: func[1],
                    args: argumentList,
                    type: type
                  }] },
                  documentation: `[meteor] api`
                })
                argumentList = []
              }
            }
          })
          return completions
        }
      }
    }
    return []
  }

  traverseGetParams(resource: string, ref: string, space: string) {
    if (this.swagger.data.definitions && this.swagger.data.definitions[ref]) {
      let propertes = this.swagger.data.definitions[ref].properties
      for (const propName in propertes) {
        const prop = propertes[propName];
        switch (prop.type) {
          case 'array':
            if (prop.items && prop.items.originalRef) {
              resource += `${space}${propName}: [{\n`
              resource = this.traverseGetParams(resource, prop.items.originalRef, space + '  ')
              resource += `${space}}],\n`
            } else {
              resource += `${space}${propName}: [],\n`
            }
            break;
          case 'object':
              if (prop.items && prop.items.originalRef) {
                resource += `${space}${propName}: {\n`
                resource += this.traverseGetParams(resource, prop.items.originalRef, space + '  ')
                resource += `${space}},\n`
              }
              break;
          default:
            resource += `${space}${propName}: '${prop.type}',\n`
            break;
        }
      }
    }
    return resource
  }
}