export default class Utils {
  static getWorkspaceRoot(workspaceFolders: any[], documentUrl: string) {
    let url: string = '';
    if (workspaceFolders?.length === 1) {
      url = workspaceFolders[0]
    } else {
      workspaceFolders?.forEach((workspaceFolder) => {
        if(documentUrl.includes(workspaceFolder)) {
          url = workspaceFolder
        }
      })
    }
    if (url.startsWith('file://')) {
      url = url.replace(/file\:\/\//gi, '')
    }
    return url
  }
  static getProjectName(rootPath: string) {
    return rootPath.replace(/.*\//gi, '')
  }
}