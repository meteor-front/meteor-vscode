import path from 'path';
import fs from 'fs'
import { CompletionItemKind } from 'vscode-languageserver/node'

export default class Completion {
  private root: string
  private traversePath: string
  private connection: any
  constructor(root: string, connection: any) {
    this.root = root
    this.connection = connection
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
  provider() {
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
                command: { command: 'meteor.apiGenerateFromServer', title: 'meteorApi', arguments: [{
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
    return []
  }
}