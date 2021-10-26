import { window, QuickInputButton, Uri, ProgressLocation, env } from 'vscode'
import Meteor from '../meteor'
import { getWorkspaceRoot, open, url } from '../utils/util'
import JenkinsPanel from './jenkinsConfig'
const execa = require('execa');
const axios = require('axios');
import * as fs from 'fs'
import * as path from 'path'
const puppeteer = require('puppeteer')

export default class Jenkins {
  private meteor: Meteor
  private projectName: string = ''
  private url: string = ''
  private token: string = ''
  private job: string = ''
  private cookie: string = ''
  private workspacePath = ''
  private browser: any = null
  private page: any = null
  private username = '' 
  private password = ''
  private hubBaseUrl = ''

  constructor(meteor: Meteor) {
    this.meteor = meteor
  }

  buildJenkinsJob() {
    let retResolve: any = null
      window.withProgress({
        location: ProgressLocation.Notification,
        title: 'Meteor',
        cancellable: true
      }, (progress, _token) => {
        progress.report({
          message: 'Jenkins构建...'
        })
        try {
          (async ()=> {
            try {
              // 登录
              this.browser = await puppeteer.launch();
              const page = await this.browser.newPage();
              this.page = page
              await page.goto(`${this.url}`);
              await page.type('#j_username', this.username)
              await page.type('[name="j_password"]', this.password)
              const submitBtn = await page.$('[name="Submit"]')
              await submitBtn.click()
              await this.page.waitFor(1000)

              let url = `${this.url}job/${this.job}/build?delay=0sec`
              const branchCmd = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
                cwd: this.workspacePath
              })
              await this.page.goto(url)
              await this.page.waitFor('[name="parameter"]');//等待下拉框出现
              const options = await this.page.$$eval('[name="parameter"] option', (options: any) => {
                const ret: string[] = []
                options.forEach((option: any) => {
                  ret.push(option.value)
                });
                return ret
              })
              if (options.includes(branchCmd.stdout)) {
                // 选择分支
                await this.page.select('[name="value"]', branchCmd.stdout)
                const genBtn = await this.page.$('#yui-gen1-button')
                if (genBtn) {
                  await genBtn.click()
                  await this.page.waitFor(500)
                  const text = await this.page.$eval('.build-link', (node: any) => {
                    // 编译版本号
                    return node.text.replace(/#/gi, '')
                  })
                  if (text) {
                    let hub = this.hubBaseUrl + this.job + ':' + text
                    env.clipboard.writeText(hub)
                    window.showInformationMessage(`镜像地址[已复制到剪切板]：${hub}`)
                  } else {
                    window.showInformationMessage('获取版本号失败！')
                  }
                }
              } else {
                window.showInformationMessage(`[前往设置分支](${this.url}/job/${this.job}/configure)`)
              }
              retResolve('')
              this.browser.close()
            } catch (error) {
              console.log(error)
              this.browser.close()
              retResolve('')
            }
          })()
        } catch (error) {
          this.browser.close()
          retResolve('')
        }
        _token.onCancellationRequested(() => {
        });
        const p = new Promise((resolve, reject) => {
          retResolve = resolve
        })
        return p
      })
  }

  async jenkinsLogin() {
    try {
      this.browser = await puppeteer.launch();
      const page = await this.browser.newPage();
      this.page = page
      await page.goto(`${this.url}`);
      await page.type('#j_username', this.username)
      await page.type('[name="j_password"]', this.password)
      const submitBtn = await page.$('[name="Submit"]')
      await submitBtn.click()
      await this.page.waitFor(1000)
      this.buildJenkinsJob()
    } catch (error) {
      this.browser.close()
    }
  }

  jenkinsBuild() {
    // 获取配置信息
    this.workspacePath = getWorkspaceRoot('')
    this.projectName = this.workspacePath.replace(/.*[\/\\](.*)$/gi, '$1')
    this.job = this.projectName
    let config = this.meteor.config.get('jenkinsConfig')
    this.url = this.meteor.config.get('jenkinsUrl')
    this.username = this.meteor.config.get('jenkinsUserName')
    this.password = this.meteor.config.get('jenkinsPassword')
    this.hubBaseUrl = this.meteor.config.get('jenkinsHubBaseUrl')

    config = config[this.projectName]
    if (config) {
      config = JSON.parse(config)
      this.job = config.job
    }
    this.buildDist()
  }

  async init() {
    this.workspacePath = getWorkspaceRoot('')
    this.projectName = this.workspacePath.replace(/.*[\/\\](.*)$/gi, '$1')
    this.job = this.projectName
    // 获取配置信息
    let config = this.meteor.config.get('jenkinsConfig')
    this.url = this.meteor.config.get('jenkinsUrl')
    this.username = this.meteor.config.get('jenkinsUserName')
    this.password = this.meteor.config.get('jenkinsPassword')
    this.hubBaseUrl = this.meteor.config.get('jenkinsHubBaseUrl')

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
        this.jenkinsBuild()
      }
      quickPick.hide()
    })
    // git http://git.cs2025.com/
    // jenkins http://jenkins.cs2025.com/
    // cloud http://cloud.cs2025.com/
    // 触发按钮
    quickPick.onDidTriggerButton((item) => {
      switch (item.tooltip) {
        case '使用说明':
          open(`${url}/mixin/jenkins.html`)
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

  // 编译dist
  public async buildDist() {
    // dist目录自动打包
    let buildResolve: any = null
    let buildReject: any = null
    let workspacePath = this.workspacePath
    window.withProgress({
      location: ProgressLocation.Notification,
      title: 'Meteor',
      cancellable: true
    }, async (progress, _token) => {
      progress.report({
        message: '打包dist...'
      })
      new Promise(async (resolve, reject) => {
        try {
          fs.statSync(path.join(workspacePath, 'dist'))
          await execa('npm', ['run', 'build'], {
            cwd: workspacePath
          })
          await execa('git', ['add', '.'], {
            cwd: workspacePath
          })
          await execa('git', ['commit', '-m', 'build: dist'], {
            cwd: workspacePath
          })
          await execa('git', ['push'], {
            cwd: workspacePath
          })
          this.buildJenkinsJob()
          buildResolve('')
        } catch (error: any) {
          window.showErrorMessage(error.message)
          buildResolve('')
        }
      })
      return new Promise((resolve, reject) => {
        buildResolve = resolve
        buildReject = reject
      })
    })
  }
}