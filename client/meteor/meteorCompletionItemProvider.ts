import { CompletionItemProvider, TextDocument, Position, CancellationToken, ProviderResult, CompletionItem, CompletionList, CompletionItemKind } from 'vscode'
import Meteor from './meteor'
import * as path from 'path'
import * as fs from 'fs'

// meteor组件提示
export default class MeteorFuncCompletionItemProvider implements CompletionItemProvider {
  public meteor: Meteor
  public meteorComponents: any = null // 组件、页面配置信息存放
  constructor(meteor: Meteor) {
    this.meteor = meteor
  }
  provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<CompletionItem[] | CompletionList> {
    try {
      // 组件
      let suggestions: any [] = []
      if (!this.meteorComponents) {
        const componentPath = path.join(this.meteor.context.extensionUri.path, 'asset/component/component.json')
        const componentString = fs.readFileSync(componentPath, 'utf-8')
        this.meteorComponents = JSON.parse(componentString)
      }
      for (const key in this.meteorComponents) {
        const component = this.meteorComponents[key]
        suggestions.push({
          label: key,
          sortText: `000${key}`,
          insertText: '',
          kind: CompletionItemKind.Snippet,
          detail: 'meteor',
          documentation: 'component: ' + key,
          command: { command: 'meteor.componentCompetion', title: 'completions', arguments: [{
            name: key,
            uri: document.uri
          }] }
        })
      }
      return suggestions
    } catch (error) {
      
    }
    
    return []
  }
}