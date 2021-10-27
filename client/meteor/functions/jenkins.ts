import { window, QuickInputButton, Uri, commands } from 'vscode'
import Meteor from '../meteor'
import { getWorkspaceRoot, open, url } from '../utils/util'
import JenkinsPanel from './jenkinsConfig'

export default class Jenkins {
  private meteor: Meteor
  private projectName: string = ''
  private url: string = ''
  private token: string = ''
  private job: string = ''
  private workspacePath = ''

  constructor(meteor: Meteor) {
    this.meteor = meteor
  }

  async init() {
    this.workspacePath = getWorkspaceRoot('')
    this.projectName = this.workspacePath.replace(/.*[\/\\](.*)$/gi, '$1')
    this.job = this.projectName
    // 获取配置信息
    let config = this.meteor.config.get('jenkinsConfig')
    this.url = this.meteor.config.get('jenkinsUrl')

    config = config[this.projectName]
    if (config) {
      config = JSON.parse(config)
      this.job = config.job
    } else {
      config = {}
    }

    const quickPick = window.createQuickPick()
    quickPick.title = `Jenkins: 打包生成hub镜像 [Job: ${this.job}]`
    quickPick.placeholder = '选择打包分支'
    // 操作按钮
    class Button implements QuickInputButton {
      constructor(public iconPath: { light: Uri; dark: Uri; }, public tooltip: string) { }
    }
    quickPick.buttons = [new Button({
      light: Uri.file(this.meteor.context.asAbsolutePath('asset/light/web.svg')),
      dark: Uri.file(this.meteor.context.asAbsolutePath('asset/dark/web.svg')),
    }, 'jenkins地址'), new Button({
      light: Uri.file(this.meteor.context.asAbsolutePath('asset/light/publish.svg')),
      dark: Uri.file(this.meteor.context.asAbsolutePath('asset/dark/publish.svg')),
    }, '使用说明'), new Button({
      light: Uri.file(this.meteor.context.asAbsolutePath('asset/light/setting.svg')),
      dark: Uri.file(this.meteor.context.asAbsolutePath('asset/dark/setting.svg')),
    }, '设置')]
    quickPick.items = [{
      label: '打包'
    }]
    // 选中选项
    quickPick.onDidChangeSelection((selection) => {
      if (selection[0] && selection[0].label) {
        commands.executeCommand('meteor.jenkins')
      }
      quickPick.hide()
    })
    
    // 触发按钮
    quickPick.onDidTriggerButton((item) => {
      switch (item.tooltip) {
        case '使用说明':
          open(`${url.official}/mixin/jenkins.html`)
          break;
        case 'jenkins地址':
          open(`${this.url}/job/${this.job}`)
          break;
        case '设置':
          JenkinsPanel.createOrShow(this.meteor.context.extensionPath, {
            projectName: this.projectName,
            url: config.url || this.url,
            token: config.token || this.token,
            job: config.job || this.projectName,
            branches: config.branches
          })
          break;
      
        default:
          break;
      }
    })
    quickPick.onDidHide(() => {
      quickPick.dispose()
    })
    quickPick.show()
  }
}