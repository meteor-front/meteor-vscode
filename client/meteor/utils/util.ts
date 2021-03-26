import * as os from 'os'
export default {
  url: {
    base: 'http://www.80fight.cn:8080'
  },
  getPlatform() {
    return os.platform().includes('win')
  }
}