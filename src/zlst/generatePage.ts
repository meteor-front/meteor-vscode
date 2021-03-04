import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import pageTemplate from './vue';
export default class GeneratePage {
  root: string;
  constructor(extensionPath: string) {
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
    } catch (error) {
      // console.log(error);
    }
    try {
      // fs.mkdirSync(componentPath);
      // fs.createWriteStream(componentPath).write(pageTemplate.vue, 'utf-8');
      fs.writeFileSync(componentPath, pageTemplate.vue, 'utf-8');
      if (isExist) {
      }
    } catch (error) {
      console.log(error);
    }
    console.log(isExist, componentPath);
  }
}