const os = require('os');
const opn = require('opn');

export default class Util {
    // windows根路径处理
  public static winRootPathHandle(pagePath: string) {
    if (os.platform().includes('win') && pagePath.length > 0 && pagePath[0] === '\\') {
      return pagePath.substr(1, pagePath.length);
    } else {
      return pagePath;
    }
  }
  // 打开浏览器
  public static open(url: string) {
    opn(url);
  }
}