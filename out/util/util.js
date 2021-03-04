"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require('os');
const opn = require('opn');
class Util {
    // windows根路径处理
    static winRootPathHandle(pagePath) {
        if (os.platform().includes('win') && pagePath.length > 0 && pagePath[0] === '\\') {
            return pagePath.substr(1, pagePath.length);
        }
        else {
            return pagePath;
        }
    }
    // 打开浏览器
    static open(url) {
        opn(url);
    }
}
exports.default = Util;
//# sourceMappingURL=util.js.map