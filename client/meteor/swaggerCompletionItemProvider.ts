import { CompletionItemProvider, TextDocument, Position, CancellationToken, ProviderResult, CompletionItem, CompletionList,
  WorkspaceConfiguration, CompletionItemKind, SnippetString } from "vscode";
import Meteor from './meteor'
import { setTabSpace, getWorkspaceRoot, getRelativePath } from '../meteor/utils/util';
import * as path from 'path';
import * as fs from 'fs'

export default class SwaggerCompletionItemProvider implements CompletionItemProvider {
  private meteor: Meteor
  private docs: any
  private workspaceRoot: string = ''
  private tabSpace: string = ''
  private completions: CompletionItem[] = []

  public constructor(meteor: Meteor) {
    this.meteor = meteor
  }

  provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<CompletionItem[] | CompletionList> {
    // 该行为空，才触发
    if (!/^[\w\s]*$/gi.test(document.lineAt(position.line).text.trim())) {
      return []
    }
    if (this.completions.length === 0) {
      this.workspaceRoot = getWorkspaceRoot(document.uri.path)
      this.tabSpace = setTabSpace()
      this.meteor.swagger.generate(true, false, false)
      let url = this.meteor.swagger.generate(true, false, false)
      if (true) {
        let res: any = this.meteor.swagger.swaggerData
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
          let type = fs.existsSync(path.join(this.workspaceRoot, this.meteor.config.get('rootPathStore') || '', 'modules')) ? 'store' : 'api'
          let completions: CompletionItem[] = []
          let apiNameList: string[] = []
          for (const apiUrl in res.data.paths) {
            const post = res.data.paths[apiUrl];
            for (const postWay in post) {
              let insertText = ''
              let ret = this.meteor.swagger.getApiName(post, postWay, apiUrl, apiNameList)
              let apiName = ret.apiName
              const postBody = post[postWay];
              apiNameList.push(apiName)
              if (type === 'api') {
                insertText = `const res = await ${apiName}({\n`
              } else {
                insertText = `const res = await this.${apiName}({\n`
              }
              insertText += this.tabSpace + '${1}\n'
              insertText += '})'
              completions.push({
                label: apiName,
                insertText: new SnippetString(insertText),
                sortText: '444' + completions.length,
                kind: CompletionItemKind.Function,
                command: { command: 'meteor.apiGenerateFileExtra', title: 'meteor.apiGenerateFileExtra', arguments: [{
                  path: this.docs[postBody.tags[0]].url,
                  name: apiName,
                  type: type,
                  text: insertText,
                  swagger: this.meteor.swagger.swaggerData.data,
                  postWay: postWay,
                  apiUrl: apiUrl
                }] },
                documentation: `[${postBody.tags[0] || 'meteor'}] ${postBody.summary}`
              })
            }
          }
          return completions
        }
      } else if (false) {
        // 通过api文件生成
        // let pathApi = path.join(this.root, 'src/api')
        // if (fs.existsSync(pathApi)) {
        //   this.traversePath = pathApi
        //   let paths = this.traverse()
        //   let type = fs.existsSync(path.join(this.root, 'src/store/modules')) ? 'store' : 'api'
        //   // 存在api文件
        //   if(paths.length > 0) {
        //     let completions: any = []
        //     paths.forEach(pathName => {
        //       let argumentList: object[] = []
        //       let file = fs.readFileSync(pathName, 'utf-8')
        //       let fileList = file.split('\n')
        //       for (let i = 0; i < fileList.length; i++) {
        //         const content = fileList[i];
        //         let argument: any = content.match(/.*argument\s*{(.*)}\s(\w*).*/i)
        //         let func = content.match(/.*export\s*function\s*(\w*)\s*.*/i)
        //         if (argument) {
        //           argumentList.push({
        //             name: argument[2] || '',
        //             type: argument[1] === '*' ? "''" : argument[1] || "''"
        //           })
        //         } else if (func && func[1]) {
        //           let insertText = ''
        //           if (type === 'api') {
        //             insertText = `const res = await ${func[1]}({\n`
        //           } else {
        //             insertText = `const res = await this.${func[1]}({\n`
        //           }
        //           argumentList.forEach((argumentItem: any, argumentIndex) => {
        //             insertText += `  ${argumentItem.name}: ${argumentItem.type}`
        //             if (argumentList.length > argumentIndex + 1) {
        //               insertText += ',\n'
        //             } else {
        //               insertText += '\n'
        //             }
        //           });
        //           insertText += '})'
        //           completions.push({
        //             label: func[1],
        //             insertText: insertText,
        //             sortText: '555' + completions.length,
        //             kind: CompletionItemKind.Folder,
        //             command: { command: 'meteor.apiGenerateFileExtra', title: 'meteorApi', arguments: [{
        //               path: pathName,
        //               name: func[1],
        //               args: argumentList,
        //               type: type
        //             }] },
        //             documentation: `[meteor] api`
        //           })
        //           argumentList = []
        //         }
        //       }
        //     })
        //     return completions
        //   }
        // }
      }
    }
    return this.completions
  }

  traverseGetParams(resource: string, ref: string, space: string) {
    if (this.meteor.swagger.swaggerData.data.definitions && this.meteor.swagger.swaggerData.data.definitions[ref]) {
      let propertes = this.meteor.swagger.swaggerData.data.definitions[ref].properties
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