import Completion from './completion'
import Jenkins from './jenkins'
import { _Connection } from 'vscode-languageserver/node'

export default class MeteorServer {
  private root: string
  private connection: _Connection
  private meteorConfig: any
  public completion: Completion
  public jenkins: Jenkins

  constructor(connection: _Connection, meteorConfig: any) {
    this.meteorConfig = meteorConfig
    this.connection = connection
    this.completion = new Completion(this.connection, this.meteorConfig)
    this.jenkins = new Jenkins()
  }
  updateRoot(root: string) {
    this.root = root
  }
  updateConfig(meteorConfig: any) {
    this.meteorConfig = meteorConfig
  }
}