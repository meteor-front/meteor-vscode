import { workspace, ConfigurationTarget } from 'vscode'
export default class Config {
  public get(section: string) : any {
    return workspace.getConfiguration('meteor').get(section);
  }
  public update(section: string, value: any): void {
    workspace.getConfiguration('meteor').update(section, value, ConfigurationTarget.Global);
  }
}