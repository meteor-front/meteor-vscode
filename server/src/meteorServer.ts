import Completion from './completion'
import { _Connection } from 'vscode-languageserver/node'

export default class MeteorServer {
  private root: string
  private connection: _Connection
  private meteorConfig: any
  public completion: Completion

  constructor(connection: _Connection, meteorConfig: any) {
    this.meteorConfig = meteorConfig
    this.connection = connection
    this.completion = new Completion(this.connection, this.meteorConfig)
  }
  updateRoot(root: string) {
    this.root = root
  }
  updateConfig(meteorConfig: any) {
    this.meteorConfig = meteorConfig
  }
}