import { ExtensionContext, window, ProgressLocation, env } from 'vscode';
import { BaseLanguageClient } from 'vscode-languageclient';
import Meteor from './meteor/meteor';
import * as path from 'path';
import * as fs from 'fs';
import { getWorkspaceRoot } from './meteor/utils/util'
const execa = require('execa')

let projectName: string = ''
let url: string = ''
let job: string = ''
let workspacePath = ''
let username = '' 
let password = ''
let hubBaseUrl = ''

function buildJenkinsJob(client: BaseLanguageClient) {
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
        client.sendRequest('jenkinsBuild').then((res: any) => {
          res && env.clipboard.writeText(res)
          retResolve && retResolve('')
        }).catch((err: any) => {
          console.log('err', err)
          retResolve && retResolve('')
        })
      } catch (error) {
        console.log(error)
        retResolve && retResolve('')
      }
      _token.onCancellationRequested(() => {
      });
      const p = new Promise((resolve, reject) => {
        retResolve = resolve
      })
      return p
    })
}

function buildDist(client: BaseLanguageClient) {
  // dist目录自动打包
  let buildResolve: any = null
  let buildReject: any = null
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
        buildJenkinsJob(client)
        buildResolve('')
      } catch (error: any) {
        // 未提交，同样可以打包
        if (error.message.includes('nothing to commit')) {
          buildJenkinsJob(client)
        } else {
          window.showErrorMessage(error.message)
        }
        buildResolve('')
      }
    })
    return new Promise((resolve, reject) => {
      buildResolve = resolve
      buildReject = reject
    })
  })
}

export function jenkinsBuild(context: ExtensionContext, client: BaseLanguageClient, meteor: Meteor) {
  // 获取配置信息
  workspacePath = getWorkspaceRoot('')
  projectName = workspacePath.replace(/.*[\/\\](.*)$/gi, '$1')
  job = projectName
  let config = meteor.config.get('jenkinsConfig')
  url = meteor.config.get('jenkinsUrl')
  username = meteor.config.get('jenkinsUserName')
  password = meteor.config.get('jenkinsPassword')
  hubBaseUrl = meteor.config.get('jenkinsHubBaseUrl')

  config = config[projectName]
  if (config) {
    config = JSON.parse(config)
    job = config.job
  }

  buildDist(client)
}