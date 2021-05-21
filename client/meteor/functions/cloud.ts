import { window, QuickInputButton, Uri, QuickPickItem, ProgressLocation } from 'vscode'
import Meteor from '../meteor'
import { getWorkspaceRoot, open } from '../utils/util'
import CloudPanel from './cloudConfig'
const axios = require('axios');
import * as fs from 'fs'
import * as path from 'path'

export default class Cloud {
  private meteor: Meteor
  private projectName: string = ''
  private url: string = ''
  private username: string = ''
  private password: string = ''
  private serviceName: string = ''
  private config: any = {}
  private token: string = ''
  private envId: string = ''
  private groupId: string = ''
  private configUrl: string = ''
  private image: string = ''
  private serviceVo: any = {}
  private lastLogin: number = 0
  private isSameEnv: boolean = true

  constructor(meteor: Meteor) {
    this.meteor = meteor
  }

  init() {
    this.projectName = getWorkspaceRoot('').replace(/.*[\/\\](.*)$/gi, '$1')
    this.serviceName = this.projectName
    // 获取配置信息
    let config = this.meteor.config.get('cloudConfig')
    this.url = this.meteor.config.get('cloudUrl')
    this.username = this.meteor.config.get('cloudUsername')
    this.password = this.meteor.config.get('cloudPassword')
    this.configUrl = this.meteor.config.get('cloudConfigUrl')
    config = config[this.projectName]
    if (config) {
      config = JSON.parse(config)
      config.envId = config.id
      this.serviceName = config.name
    } else {
      config = {
        envId: ''
      }
    }
    this.config = config
    this.isSameEnv = (this.envId === this.config.envId)
    this.envId = this.config.envId

    const quickPick = window.createQuickPick()
    quickPick.title = `容器云部署`
    quickPick.placeholder = '选择操作方式'
    // 操作按钮
    class Button implements QuickInputButton {
      constructor(public iconPath: { light: Uri; dark: Uri; }, public tooltip: string) { }
    }
    quickPick.buttons = [new Button({
      light: Uri.file(this.meteor.context.asAbsolutePath('asset/light/web.svg')),
      dark: Uri.file(this.meteor.context.asAbsolutePath('asset/dark/web.svg')),
    }, '容器云'), new Button({
      light: Uri.file(this.meteor.context.asAbsolutePath('asset/light/setting.svg')),
      dark: Uri.file(this.meteor.context.asAbsolutePath('asset/dark/setting.svg')),
    }, '设置')]
    quickPick.items = [{
      label: '升级'
    }, {
      label: '重启'
    }, {
      label: '更新配置集'
    }, {
      label: '访问'
    }]
    // 选中选项
    quickPick.onDidChangeSelection((selection) => {
      if (selection[0] && selection[0].label) {
        this.cloudHandle(selection[0].label).catch((err) => {
          window.showInformationMessage('抱歉，网络不给力！')
        })
      }
      quickPick.hide()
    })
    // 触发按钮
    quickPick.onDidTriggerButton((item) => {
      switch (item.tooltip) {
        case '容器云':
          open(this.url)
          break;
        case '设置':
          CloudPanel.createOrShow(this.meteor.context.extensionPath, {
            url: config.url || this.url,
            username: config.username || this.username,
            password: config.password || this.password,
            name: config.name || this.serviceName,
            id: config.id || '',
            projectName: this.projectName
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

  // cloud serviceName编译
  public async cloudHandle(mode: string) {
    if (!this.envId) {
      return window.showInformationMessage('请先设置容器云信息')
    }
    // 1. 登录获取username
    let url = this.config.url || this.url
    let res: any = {}
    // 有token，两小时内部重复登录
    if (!(this.lastLogin > 0 && (new Date().getTime() < this.lastLogin + 7200000) && this.token)) {
      res = await axios.post(`${url}/api/login`, {
        username: this.config.username || this.username,
        password: this.config.password || this.password
      })
      this.lastLogin = new Date().getTime()
    }
    if ((res.data && res.data.data && res.data.data.token) || this.token) {
      if (res.data) {
        this.token = res.data.data.token
      }
      // 切换环境则重新获取环境信息
      if (!this.isSameEnv) {
        res = await axios.post(`${this.url}/api/environment/envDetails`, {
          envId: this.config.envId,
          pageNum: 1,
          pageSize: 9999
        }, {
          headers: {
            token: this.token
          }
        })
        if (res.data.data && res.data.data.apps && res.data.data.apps.content) {
          for (let i = 0; i < res.data.data.apps.content.length; i++) {
            const group = res.data.data.apps.content[i];
            if (group.serviceName === this.serviceName) {
              this.groupId = group.groupId
              this.image = group.serviceVo.image.replace(/:.*/gi, '')
              this.serviceVo = group.serviceVo
              break
            }
          }
        }
      }
      if (this.groupId) {
        if (mode === '重启') {
          res = await axios.delete(`${this.url}/api/environments/${this.envId}/groups/${this.groupId}/services/${this.serviceName}/reboot?deploymentName=${this.serviceName}`, {
            headers: {
              token: this.token
            }
          })
          if (res.data && res.data.code === '0') {
            window.showInformationMessage('重启成功！')
          } else {
            window.showInformationMessage('重启失败，请重试！')
          }
        } else if (mode === '升级') {
          res = await axios.get(`${this.url}/api/harbor/images/${this.image}/tags?environment=${this.envId}`, {
            headers: {
              token: this.token
            }
          })
          if (res.data.data && res.data.data.length > 0) {
            this.serviceVo.image = this.image + ':' + res.data.data[0].name
            res = await axios.put(`${this.url}/api/environments/${this.envId}/groups/${this.groupId}/services/${this.serviceName}/upgrade?upgradeType=roll&autoUpgrade=false`, this.serviceVo, {
              headers: {
                token: this.token
              }
            })
            if (res.data && res.data.code === '0') {
              window.showInformationMessage('升级成功，系统正在重启中...')
            } else {
              window.showInformationMessage('升级失败，请重试！')
            }
          }
        } else if (mode === '更新配置集') {
          let data: any = {}
          try {
            let rootPath = path.join(getWorkspaceRoot(''), this.configUrl || 'config')
            const dirs = fs.readdirSync(rootPath)
            for (let i = 0; i < dirs.length; i++) {
              const dir = dirs[i];
              if (!(dir.charAt(0) === '.')) {
                let stat = fs.statSync(path.join(rootPath, dir))
                if (stat.isFile()) {
                  const file = fs.readFileSync(path.join(rootPath, dir), 'utf-8')
                  data[dir] = file
                }
              }
            }
          } catch (error) {
          }
          if (Object.keys(data).length > 0) {
            res = await axios.put(`${this.url}/api/environments/${this.envId}/configmaps/hs-screen`, {
              environmentId: this.envId,
              id: this.serviceName,
              data: data,
              currentVersion: '1'
            }, {
              headers: {
                token: this.token
              }
            })
            if (res.data && res.data.code === '0') {
              window.showInformationMessage('更新配置信息成功！')
              this.cloudHandle('重启').catch((err) => {
                window.showInformationMessage('抱歉，网络不给力！')
              })
            }
          } else {
            window.showInformationMessage(`请在${this.configUrl}目录下放置配置文件`)
          }
        } else if (mode === '访问') {
          res = await axios.get(`${this.url}/api/service/info?environmentId=${this.envId}&serviceId=${this.serviceName}`, {
            headers: {
              token: this.token
            }
          })
          if (res.data && res.data.data && res.data.data.ingress && res.data.data.ingress[this.serviceName]) {
            let cloudUrl = res.data.data.ingress[this.serviceName]
            if (cloudUrl.includes('http')) {
              open(cloudUrl)
            } else {
              open('http://' + cloudUrl)
            }
          } else {
            window.showInformationMessage('请检查是否配置访问地址')
          }
        }
      } else {
        window.showInformationMessage('操作失败，请重试！')
      }
    } else {
      window.showInformationMessage('操作失败，请重试！')
    }
  }
}