import { ExtensionContext, workspace, WorkspaceConfiguration } from 'vscode'
import axios from 'axios';
import MeteorCompletionItemProvider from './completionItemProvider';
export default class Meteor {
  // vscode上下文
  public context: ExtensionContext
  // 配置信息
  private config: WorkspaceConfiguration
  // 完成项提供Provider
  public completionItemProvider: MeteorCompletionItemProvider
  constructor(context: ExtensionContext) {
    this.context = context
    this.config = workspace.getConfiguration('meteor');
    this.completionItemProvider = new MeteorCompletionItemProvider(this.config)
  }
}