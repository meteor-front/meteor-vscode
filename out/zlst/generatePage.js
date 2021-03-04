"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const vue_1 = require("./vue");
class GeneratePage {
    constructor(extensionPath) {
        this.root = extensionPath;
    }
    generate() {
        if (!this.root) {
            return vscode.window.showErrorMessage('请先打开工程！');
        }
        let isExist = false;
        let componentPath = path.join(this.root, 'src/components/demo.js');
        try {
            let stateInfo = fs.statSync(componentPath);
            console.log('stateInfo', stateInfo);
            isExist = true;
        }
        catch (error) {
            // console.log(error);
        }
        try {
            // fs.mkdirSync(componentPath);
            // fs.createWriteStream(componentPath).write(pageTemplate.vue, 'utf-8');
            fs.writeFileSync(componentPath, vue_1.default.vue, 'utf-8');
            if (isExist) {
            }
        }
        catch (error) {
            console.log(error);
        }
        console.log(isExist, componentPath);
    }
}
exports.default = GeneratePage;
//# sourceMappingURL=generatePage.js.map