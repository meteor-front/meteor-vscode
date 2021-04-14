import { ExtensionContext, window, ProgressLocation, Position, Selection, Range, TextEditorRevealType } from 'vscode'
import axios, { AxiosInstance } from 'axios';
import MeteorCompletionItemProvider from './completionItemProvider';
import SwaggerCompletionItemProvider from './swaggerCompletionItemProvider';
import Block from './block';
import BackSpace from './functions/backSpace'
import { url, winRootPathHandle, setTabSpace } from './utils/util'
import Swagger from './functions/swagger'
import NewPage from './functions/newPage'
import * as path from 'path'
import * as fs from 'fs'
import Config from './config'

export default class Meteor {
  // vscode上下文
  public context: ExtensionContext
  // 配置信息
  public config: Config
  // 完成项提供Provider
  public completionItemProvider: MeteorCompletionItemProvider
  public swaggerCompletionItemProvider: SwaggerCompletionItemProvider
  public block: Block
  public backSpace: BackSpace
  public fetch: AxiosInstance
  public swagger: Swagger
  public newPage: NewPage
  public tabSpace: string = '  '
  constructor(context: ExtensionContext) {
    this.context = context
    this.config = new Config()
    this.fetch = axios.create({
      baseURL: url.base,
      withCredentials: false
    })
    this.tabSpace = setTabSpace()
    this.swagger = new Swagger(this)
    this.completionItemProvider = new MeteorCompletionItemProvider(this.config, this)
    this.swaggerCompletionItemProvider = new SwaggerCompletionItemProvider(this)
    this.block = new Block()
    this.backSpace = new BackSpace()
    NewPage.meteor = this
    NewPage.context = context
    this.newPage = new NewPage()
  }

  /**
   * 同步服务器数据
   * @param uri 
   */
   async sync() {
    // 获取页面数据
    let user = this.config.get('user')
    if (user) {
      user = JSON.parse(user)
    } else {
      window.showInformationMessage('请先[登录](command:meteor.upload)')
      return
    }
    let res = await this.fetch.get('widget?tag=&type=&searchValue=', {
      headers: {
        token: user.token
      }
    });
    window.withProgress({
      location: ProgressLocation.Notification,
      title: 'meteor',
      cancellable: true
    }, (progress, _token) => {
      let msg = '正在同步中，请耐心等待...';
      progress.report({
        increment: 0,
        message: msg
      });
      // 拼接配置文件， 并生成文件
      let current: number = 0;
      let count: number = 1;
      let files: any [] = [];
      if (res.data && res.data.data) {
        let data = res.data.data;
        let page: any = {};
        let component: any = {};
        data.forEach((item: any) => {
          let obj = null;
          // type: 0 组件   1 页面
          if (item.type === '1') {
            obj = page;
          } else {
            obj = component;
          }
          obj[item.description.name] = {
            category: item.category,
            type: item.type,
            block: item.block
          };
          let pages: any = [];
          item.code.forEach((codeItem: any) => {
            let dotPosition = codeItem.name.lastIndexOf('.');
            pages.push({
              template: item.id + '/' + codeItem.name,
              type: codeItem.type,
              fileName: codeItem.name.substr(0, dotPosition),
              poster: codeItem.name.substr(dotPosition, codeItem.name.length)
            });
            files.push({
              pageId: item.id,
              pageType: item.type,
              ...codeItem
            });
            count++;
          });
          obj[item.description.name].pages = pages;
        });
        // 生成page文件
        let rootPagePath = path.join(this.context.extensionUri.path, 'asset/template');
        let pagePath = path.join(rootPagePath, 'page.json');
        let rootComponentPath = path.join(this.context.extensionUri.path, 'asset/component');
        let componentPath = path.join(rootComponentPath, 'component.json');
        current++;
        pagePath = winRootPathHandle(pagePath);
        componentPath = winRootPathHandle(componentPath);
        try {
          fs.writeFileSync(pagePath, JSON.stringify(page));
          fs.writeFileSync(componentPath, JSON.stringify(component));
        } catch (error) {
          console.log(error);
        }
        progress.report({
          increment: current * 100 / count,
          message: msg
        });
        // 生成页面文件
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          let root = file.pageType === '1' ? rootPagePath :  rootComponentPath;
          let filePath = path.join(root, file.pageId.toString());
          filePath = winRootPathHandle(filePath);
          try {
            fs.statSync(filePath);
          } catch (error) {
            fs.mkdirSync(filePath);
          }
          let filePathName = path.join(filePath, file.name || 'index.txt');
          filePathName = winRootPathHandle(filePathName);
          fs.writeFileSync(filePathName, file.code);
          current++;
          progress.report({
            increment: current * 100 / count,
            message: msg
          });
        }
      }
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve('success');
        }, 3000);
      });
    });
  }

  // 生成方法，并跳转到方法处
  generateMethod() {
    // 查找方法名称
    let character = (window.activeTextEditor?.selection.anchor.character || 0) - 1;
    let txt = window.activeTextEditor?.document.lineAt(window.activeTextEditor?.selection.anchor.line).text;
    let word: string = '';
    while(txt && character && character > 0) {
      if (txt[character] === '"') {
        break;
      }
      word = txt[character] + word;
      --character;
    }
    // 没有参数往后找
    character = (window.activeTextEditor?.selection.anchor.character || 0);
    while(txt && character && txt.length > character) {
      if (txt[character] === '"') {
        break;
      }
      word = word + txt[character];
      ++character;
    }
    if (window.activeTextEditor?.document && window.activeTextEditor?.selection.anchor.line) {
      let lineCount = window.activeTextEditor.document.lineCount;
      let currentLine = window.activeTextEditor?.selection.anchor.line;
      let isJs = false;
      let isInMethods = false;
      while(currentLine < lineCount) {
        let text = window.activeTextEditor.document.lineAt(currentLine).text;
        if (/^\s*<\/script>\s*$/g.test(text)) {
          break;
        }
        // 判断是否到js
        if (!isJs) {
          if (/^\s*<script.*>\s*$/g.test(text)) {
            isJs = true;
          }
          ++currentLine;
          continue;
        }
        // 查找到methods开始位置
        if (!isInMethods) {
          if (/\s*methods\s*:\s*{\s*/gi.test(text)) {
            isInMethods = true;
          }
          ++currentLine;
          continue;
        }
        if (text.includes('...')) {
          ++currentLine;
          // 是三木运算，下起一行
          continue;
        }
        ++currentLine;
        break;
      }
      if (currentLine < lineCount && isInMethods) {
        let editor = window.activeTextEditor;
        editor.edit((editBuilder) => {
          editBuilder.insert(new Position(currentLine - 1, 0), `    ${word.includes('(') ? (word + ' {') : word + '() {'}\n      \n    },\n`);
        }).then(() => {
          editor.selection = new Selection(new Position(currentLine - 1, 4), new Position(currentLine - 1, 4));
          let lineEnd = currentLine - 1 + editor.visibleRanges.length;
          let lineStart = currentLine - 1;
          if (lineEnd > editor.document.lineCount) {
            lineEnd = editor.document.lineCount;
            lineStart = lineEnd = editor.visibleRanges.length;
          }
          editor.revealRange(new Range(new Position(lineStart, 4), new Position(lineEnd, 4)), TextEditorRevealType.Default);
        });
      }
    }
  }
}