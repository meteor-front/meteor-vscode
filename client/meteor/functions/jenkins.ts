import { window, QuickInputButton, Uri, QuickPickItem, ProgressLocation } from 'vscode'
import Meteor from '../meteor'
import { getWorkspaceRoot, open } from '../utils/util'
const axios = require('axios');

export default class Jenkins {
  private meteor: Meteor
  // 默认环境选项
  private defaultItems: QuickPickItem[] = [{
    label: '开发环境',
    description: '分支[develop]'
  }, {
    label: '测试环境',
    description: '分支[develop]'
  }, {
    label: '预上线环境',
    description: '分支[master]'
  }, {
    label: '上线环境',
    description: '分支[master]'
  }]
  private projectName: string = ''
  private url: string = ''
  private token: string = ''

  constructor(meteor: Meteor) {
    this.meteor = meteor
  }

  init() {
    this.projectName = getWorkspaceRoot('').replace(/.*[\/\\](.*)$/gi, '$1')
    const quickPick = window.createQuickPick()
    quickPick.title = `Jenkins: 打包生成hub镜像 [Job: ${this.projectName}]`
    quickPick.placeholder = '选择打包环境'
    // 操作按钮
    class Button implements QuickInputButton {
      constructor(public iconPath: { light: Uri; dark: Uri; }, public tooltip: string) { }
    }
    quickPick.buttons = [new Button({
      light: Uri.file(this.meteor.context.asAbsolutePath('asset/light/document.svg')),
      dark: Uri.file(this.meteor.context.asAbsolutePath('asset/dark/document.svg'))
    }, '使用说明'), new Button({
      light: Uri.file(this.meteor.context.asAbsolutePath('asset/light/web.svg')),
      dark: Uri.file(this.meteor.context.asAbsolutePath('asset/dark/web.svg')),
    }, 'jenkins地址'), new Button({
      light: Uri.file(this.meteor.context.asAbsolutePath('asset/light/setting.svg')),
      dark: Uri.file(this.meteor.context.asAbsolutePath('asset/dark/setting.svg')),
    }, '设置')]
    // 获取配置信息
    let config = this.meteor.config.get('jenkinsConfig')
    this.url = this.meteor.config.get('jenkinsUrl')
    this.token = this.meteor.config.get('jenkinsToken')
    let items = []
    config = config[this.projectName]
    if (config) {
      items = JSON.parse(config)
    } else {
      items = this.defaultItems
    }
    quickPick.items = items
    // 选中选项
    quickPick.onDidChangeSelection((selection) => {
      if (selection[0] && selection[0].description) {
        this.buildJob(selection[0].description.replace(/分支\[(.*)\]/gi, '$1'))
      }
      quickPick.hide()
    })
    // 触发按钮
    quickPick.onDidTriggerButton((item) => {
      switch (item.tooltip) {
        case '使用说明':
          open('http://www.80fight.cn/mixin/jenkins.html')
          break;
        case 'jenkins地址':
          open(this.url)
          break;
        case '设置':
          
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

  // jenkins job编译
  public async buildJob(branch: string) {
    try {
      const versionUrl = `${this.url}/job/${this.projectName}/lastSuccessfulBuild/buildNumber`
      let res = await axios.get(versionUrl)
      let oldVersion = res.data
      await axios.get(`${this.url}/job/${this.projectName}/buildWithParameters?token=${this.token}&BRANCH_NAME=${branch}`)

      let retResolve: any = null
      window.withProgress({
        location: ProgressLocation.Notification,
        title: 'Meteor',
        cancellable: true
      }, (progress, _token) => {
        progress.report({
          message: '正在打包中...'
        })
        let version = oldVersion
        const s = setInterval(() => {
          axios.get(versionUrl).then((res: any) => {
            version = res.data
            if (version > oldVersion) {
              clearInterval(s)
              retResolve('')
              // 通过日志获取hub地址
              axios.get(`${this.url}/job/${this.projectName}/${version}/console`).then((res: any) => {
                const reg = new RegExp(`\\s[\\w.\\/]*\\/${this.projectName}:${version}\\s`, 'gi')
                let ret: any = res.data.match(reg)
                if (ret) {
                  window.showInformationMessage(`最新镜像版本：${ret[0]}`)
                }
              })
            }
          })
        }, 3000);
        _token.onCancellationRequested(() => {
          clearInterval(s)
        });
        const p = new Promise((resolve, reject) => {
          retResolve = resolve
        })
        return p
      })
    } catch (error) {
      window.showInformationMessage('检查Job名称、分支是否正确？`')
      console.error(error)
    }
  }
}