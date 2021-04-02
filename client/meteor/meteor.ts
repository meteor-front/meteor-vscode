import { ExtensionContext, workspace, WorkspaceConfiguration } from 'vscode'
import axios, { AxiosInstance } from 'axios';
import MeteorCompletionItemProvider from './completionItemProvider';
import Block from './block';
import BackSpace from './functions/backSpace'
import { url } from './utils/util'
import Swagger from './functions/swagger'
export default class Meteor {
  // vscode上下文
  public context: ExtensionContext
  // 配置信息
  private config: WorkspaceConfiguration
  // 完成项提供Provider
  public completionItemProvider: MeteorCompletionItemProvider
  public block: Block
  public backSpace: BackSpace
  public fetch: AxiosInstance
  public swagger: Swagger
  constructor(context: ExtensionContext) {
    this.context = context
    this.config = workspace.getConfiguration('meteor');
    this.fetch = axios.create({
      baseURL: url.base,
      withCredentials: false,
      headers: {
        token: '20'
      }
    })
    this.completionItemProvider = new MeteorCompletionItemProvider(this.config)
    this.block = new Block()
    this.backSpace = new BackSpace()
    this.swagger = new Swagger(this.config, this.fetch, this.context)
  }

}