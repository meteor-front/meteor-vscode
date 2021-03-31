import * as os from 'os'
import { workspace } from 'vscode';
import * as path from 'path'
export default {
  url: {
    base: 'http://www.80fight.cn:8080'
  },
  getPlatform() {
    return os.platform().includes('win')
  },
  getWorkspaceRoot(documentUrl: string) {
    let url: string = '';
    workspace.workspaceFolders?.forEach((workspaceFolder) => {
      if(documentUrl.includes(workspaceFolder.uri.path)) {
        url = workspaceFolder.uri.path
      }
    })
    return url
  },
  getRelativePath(src: string, dist: string) {
    let vfPath = path.relative(src, dist)
    if (vfPath.startsWith('../')) {
      vfPath = vfPath.substr(1, vfPath.length)
    }
    return vfPath
  },
  setTabSpace() {
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
}