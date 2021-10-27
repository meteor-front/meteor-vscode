const puppeteer = require("puppeteer-core")
const execa = require('execa');
const findChrome = require('carlo/lib/find_chrome')
import { _Connection } from 'vscode-languageserver/node';

export default class Jenkins {
  private projectName: string = ''
  private url: string = ''
  private job: string = ''
  private workspacePath = ''
  private browser: any = null
  private page: any = null
  private username = '' 
  private password = ''
  private hubBaseUrl = ''
  
  setWorkspacePath(url: string) {
    this.workspacePath = url
  }

  async buildJob(config: any, connection: _Connection) {
    let hub = ''
    this.projectName = this.workspacePath.replace(/.*[\/\\](.*)$/gi, '$1')
    this.job = this.projectName
    let conf = config.jenkinsConfig
    this.url = config.jenkinsUrl
    this.username = config.jenkinsUserName
    this.password = config.jenkinsPassword
    this.hubBaseUrl = config.jenkinsHubBaseUrl

    conf = conf[this.projectName]
    if (conf) {
      conf = JSON.parse(conf)
      this.job = conf.job
    }

    try {
      // 登录
      let findChromePath = await findChrome({})
      let executablePath = findChromePath.executablePath
      if (!executablePath) {
        connection.window.showInformationMessage(`未找到Chrome浏览器`)
        return ''
      }
      this.browser = await puppeteer.launch({
        executablePath,
        headless: false,
        defaultViewport: {
          width: 1366,
          height: 768
        }
      });
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
      await this.page.waitFor(500);//等待下拉框出现
      // 判断页面是否能够正常访问
      try {
        const h2Text = await this.page.$eval('body > h2', (node: any) => node.innerText)
        if (h2Text === 'HTTP ERROR 404 Not Found') {
          connection.window.showInformationMessage(`Jenkins中没有${this.job}任务，[前往设置](${this.url})`)
          return ''
        }        
      } catch (error) {
      }
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
            hub = this.hubBaseUrl + this.job + ':' + text
            connection.window.showInformationMessage(`镜像地址[已复制到剪切板]：${hub}`)
          } else {
            connection.window.showInformationMessage('获取版本号失败！')
          }
        }
      } else {
        connection.window.showInformationMessage(`[前往设置分支](${this.url}/job/${this.job}/configure)`)
      }
      this.browser.close()
      return hub
    } catch (error: any) {
      connection.console.log(error.message)
      this.browser.close()
      return hub
    }
  }
}