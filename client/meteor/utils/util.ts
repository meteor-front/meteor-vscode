import * as os from 'os'
import { workspace, commands, window } from 'vscode';
import * as path from 'path'
import * as fs from 'fs'
const opn = require('opn');
export const url = {
  base: 'http://www.80fight.cn:8080',
  official: 'http://www.80fight.cn'
}
export function getPlatform() {
  return os.platform().includes('win')
}
export function getWorkspaceRoot(documentUrl: string) {
  let url: string = '';
  if (workspace.workspaceFolders?.length === 1) {
    return workspace.workspaceFolders[0].uri.path 
  }
  workspace.workspaceFolders?.forEach((workspaceFolder) => {
    if(documentUrl.includes(workspaceFolder.uri.path)) {
      url = workspaceFolder.uri.path
    }
  })
  return url
}
export function getRelativePath(src: string, dist: string) {
  let vfPath = path.relative(src, dist)
  if (vfPath.startsWith('../')) {
    vfPath = vfPath.substr(1, vfPath.length)
  }
  return vfPath
}
export function setTabSpace() {
  let veturConfig = workspace.getConfiguration('vetur');
  const tabSize = workspace.getConfiguration('editor').tabSize;
  let space = '';
  if (veturConfig) {
    for (let i = 0; i < veturConfig.format.options.tabSize; i++) {
      space += ' ';
    }
  } else {
    for (let i = 0; i < tabSize; i++) {
      space += ' ';
    }
  }
  if (space.length === 0) {
    space = '  '
  }
  return space
}
export function open(url: string) {
  opn(url);
}

export function asNormal(key: string, modifiers?: string) {
  switch (key) {
    case 'enter':
      if (modifiers === 'ctrl') {
        return commands.executeCommand('editor.action.insertLineAfter');
      } else {
        return commands.executeCommand('type', { source: 'keyboard', text: '\n' });
      }
    case 'tab':
        if (workspace.getConfiguration('emmet').get<boolean>('triggerExpansionOnTab')) {
          return commands.executeCommand('editor.emmet.action.expandAbbreviation');
        } else if (modifiers === 'shift') {
          return commands.executeCommand('editor.action.outdentLines');
        } else {
          return commands.executeCommand('tab');
        }
    case 'backspace':
      return commands.executeCommand('deleteLeft');
  }
}
// windows根路径处理
export function winRootPathHandle(pagePath: string) {
  if (os.platform().includes('win') && pagePath.length > 0 && pagePath[0] === '\\') {
    return pagePath.substr(1, pagePath.length);
  } else {
    return pagePath;
  }
}
