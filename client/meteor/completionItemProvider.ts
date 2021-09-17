import { window, CancellationToken, workspace, CompletionItemProvider, ProviderResult,
  TextDocument, Position, CompletionItem, CompletionList, CompletionItemKind,
  SnippetString, Range, Selection, WorkspaceConfiguration, commands, Uri, TextEditor } from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TAGS } from './tags/index';
import { ATTRS } from './attributes/index';
const pretty = require('pretty');
import { setTabSpace, getWorkspaceRoot, getRelativePath } from '../meteor/utils/util';
import Traverse from './utils/traverse';
import Meteor from './meteor'
import Config from './config'
const camelCase = require('camelcase');

export interface TagObject {
  text: string,
  offset: number
};

export default class MeteorCompletionItemProvider implements CompletionItemProvider {
  private _document!: TextDocument;
  private _position!: Position;
  private tagReg: RegExp = /<([\w-]+)\s+/g;
  private attrReg: RegExp = /(?:\(|\s*)((\w(-)?)*)=['"][^'"]*/;  // 能够匹配 left-right 属性
  private tagStartReg: RegExp = /<([\w-]*)$/;
  private config: Config
  private workspaceRoot: string = ''
  private CompletionItemKey = [
    'Text   ',
    'Method',
    'Function',
    'Constructor',
    'Field',
    'Variable',
    'Class',
    'Interface',
    'Module',
    'Property',
    'Unit',
    'Value',
    'Enum',
    'Keyword',
    'Snippet',
    'Color',
    'Reference',
    'File',
    'Folder',
    'EnumMember',
    'Constant',
    'Struct',
    'Event',
    'Operator',
    'TypeParameter',
    'User',
    'Issue',
  ]
  private symbolKey = [
    'File',
    'Module',
    'Namespace',
    'Package',
    'Class',
    'Method',
    'Property',
    'Field',
    'Constructor',
    'Enum',
    'Interface',
    'Function',
    'Variable',
    'Constant',
    'String',
    'Number',
    'Boolean',
    'Array',
    'Object',
    'Key',
    'Null',
    'EnumMember',
    'Struct',
    'Event',
    'Operator',
    'TypeParameter'
  ]
  private vueFiles: any = []
  private tabSpace: string = ''
  private traverse: Traverse
  private meteor: Meteor
  // 参数提示相关参数
  public swagger: any = null
  public apis: Map<string, Array<any>> = new Map()

  traverseGetParams(ref: string) {
    let ret: any = {}
    if (this.swagger.definitions && this.swagger.definitions[ref]) {
      let propertes = this.swagger.definitions[ref].properties
      for (const propName in propertes) {
        const prop = propertes[propName];
        switch (prop.type) {
          case 'array':
            if (prop.items && prop.items.originalRef) {
              ret[propName] = {
                type: prop.type,
                description: `请求参数：${prop.description || ''}`,
                value: [this.traverseGetParams(prop.items.originalRef)]
              }
            } else {
              ret[propName] = {
                type: prop.type,
                description: `请求参数：${prop.description || ''}`,
                value: []
              }
            }
            break;
          case 'object':
              if (prop.items && prop.items.originalRef) {
                ret[propName] = {
                  type: prop.type,
                  description: `请求参数：${prop.description || ''}`,
                  value: this.traverseGetParams(prop.items.originalRef)
                }
              }
              break;
          default:
            ret[propName] = {
              value: prop.type,
              type: prop.type,
              description: `请求参数：${prop.description || ''}`
            }
            break;
        }
      }
    }
    return ret
  }
  
  setSwagger(swagger: any) {
    this.swagger = swagger
    let docs: any = {};
    this.swagger.tags.forEach((tag: any) => {
      let name = tag.description.replace(/\s/gi, '').replace(/Controller$/gi, '');
      name = name[0].toLowerCase() + name.substr(1, name.length);
      docs[tag.name] = {};
      docs[tag.name].name = name;
      docs[tag.name].url = name + '.js';
    })
    let apiNameList: string[] = []
    for (const apiUrl in this.swagger.paths) {
      const post = this.swagger.paths[apiUrl];
      for (const postWay in post) {
        const postBody = post[postWay];
        let ret = this.meteor.swagger.getApiName(post, postWay, apiUrl, apiNameList)
        let apiName = ret.apiName
        apiNameList.push(apiName)
        let apiParams: any = {}
        postBody.parameters && postBody.parameters.forEach((parameter: any) => {
          if (parameter.schema && parameter.schema.originalRef) {
            apiParams = this.traverseGetParams(parameter.schema.originalRef)
          } else {
            apiParams[parameter.name] = {
              value: parameter.type,
              type: parameter.type,
              description: `请求参数：${parameter.description || ''}`
            }
          }
        })
        if (apiName === 'upload') {
          // console.log(apiParams)
        }
        this.apis.set(apiName, apiParams)
      }
    }
  }

  public constructor(config: Config, meteor: Meteor) {
    this.config = config
    this.meteor = meteor
    this.traverse = new Traverse(config, getWorkspaceRoot(window.activeTextEditor?.document.uri.path || ''))
  }

  // 自动补全
  autoComplement() {
    let editor: any = window.activeTextEditor;
    if (!editor) { return; }
    this.workspaceRoot = getWorkspaceRoot(editor.document.uri.path)
    let txt = editor.document.lineAt(editor.selection.anchor.line).text;
    if(editor.document.lineCount <= editor.selection.anchor.line + 1) { return; }
    // 组件自动导入
    if (/<.*>\s?<\/.*>/gi.test(txt.trim()) || /<.*\/>/gi.test(txt.trim())) {
      this.autoImportComponent(txt, editor, editor.selection.anchor.line);
      return;
    }
    // 本地文件自动导入
    let nextLineTxt = editor.document.lineAt(editor.selection.anchor.line + 1).text;
    
    let baseEmpty = txt.replace(/(\s)\S.*/gi, '$1');
    let replaceTxt = ` {\n${baseEmpty}${this.tabSpace}\n${baseEmpty}}`;
    // 本行全是空
    if(/^\s*$/gi.test(txt) || txt === '') {
      replaceTxt = 'name (params)' + replaceTxt;
    } else if (/[0-9a-zA-Z]\s{0,1}:\s{0,1}[\w\"\']/gi.test(txt)) {
      // key: value
      replaceTxt = ',\n' + baseEmpty;
    } else if(txt.indexOf(')') === -1) {
      replaceTxt = ' (params)' + replaceTxt;
    }
    // 判断下一行是否是单行注释
    if(/\s*\/\/\s+.*/gi.test(nextLineTxt)) {
      if(editor.document.lineCount <= editor.selection.anchor.line + 2) { return; }
      nextLineTxt = editor.document.lineAt(editor.selection.anchor.line + 2).text;
    }
    // 下一行是一个函数
    if (/.*(.*).*{.*/gi.test(nextLineTxt)) {
      let isCond = false;
      let txtTrim = txt.trim();
      const condList = ['if', 'for', 'while', 'switch'];
      condList.forEach(cond => {
        if (txtTrim.indexOf(cond) === 0) {
          isCond = true;
        }
      });
      if (!isCond) {
        replaceTxt += ',';
      }
    }
    editor.edit((editBuilder: any) => {
      editBuilder.insert(new Position(editor.selection.anchor.line, txt.length + 1), replaceTxt);
    });
    let newPosition = editor.selection.active.translate(1, (baseEmpty + this.tabSpace).length);
    editor.selection = new Selection(newPosition, newPosition);
  }

  // 组件自动导入
  autoImportComponent(txt: string, editor: TextEditor, line: number) {
    let tag = txt.trim().replace(/<([\w-]*)[\s>].*/gi, '$1');
    // 没有vue遍历
    if (this.vueFiles.length === 0) {
      this.vueFiles = this.traverse.search('.vue', '');
    }
    for (let i = 0; i < this.vueFiles.length; i++) {
      const vf : any = this.vueFiles[i];
      if (tag === vf.name) {
        let name = vf.name.replace(/(-[a-z])/g, (_: any, c: string) => {
          return c ? c.toUpperCase() : '';
        }).replace(/-/gi, '');
        // 不重复插入引入
        if (editor.document.getText().includes(`import ${name}`)) {
          return
        }
        let countLine = editor.document.lineCount;
        // 找script位置
        while (!/^\s*<script.*>\s*$/.test(<string>editor.document.lineAt(line).text)) {
          if (countLine > line) {
            line++;
          } else {
            break;
          }
        }
        if (editor.document.lineAt(line + 1).text.includes('export default')) {
          line += 1;
        } else {
          line += 1;
          if (countLine < line) {
            return;
          }
          // 找import位置
          while (/import /gi.test(editor.document.lineAt(line).text.trim())) {
            if (countLine > line) {
              line++;
            } else {
              break;
            }
          }
        }
        let importString = `import ${name} from '${getRelativePath(editor.document.uri.path, path.join(this.workspaceRoot, vf.path))}'\n`;
        let importLine = line;
        if (line < countLine) {
          let prorityInsertLine = 0;
          let secondInsertLine = 0;
          let hasComponents = false;
          let baseEmpty = '';
          while(!/\s*<\/script>\s*/gi.test(editor.document.lineAt(line).text.trim())) {
            if (/\s*components\s*:\s*{.*}.*/gi.test(editor.document.lineAt(line).text.trim())) {
              let text = editor.document.lineAt(line).text;
              let preText = text.replace(/\s*}.*$/, '');
              let insertPos = preText.length;
              editor.edit((editBuilder) => {
                importString = importString.replace(/\\/gi, '/');
                editBuilder.insert(new Position(importLine, 0), importString);
                editBuilder.insert(new Position(line, insertPos), ', ' + name);
              });
              break;
            }
            if (hasComponents && /\s*},?\s*$/gi.test(editor.document.lineAt(line).text.trim())) {
              let text = editor.document.lineAt(line - 1).text;
              let insertPos = text.indexOf(text.trim());
              let empty = '';
              for (let i = 0; i < insertPos; i++) {
                empty += ' ';         
              }
              editor.edit((editBuilder) => {
                importString = importString.replace(/\\/gi, '/');
                editBuilder.insert(new Position(importLine, 0), importString);
                editBuilder.insert(new Position(line - 1, editor.document.lineAt(line - 1).text.length), ',\n' + empty + name);
              });
              break;
            }
            if (/\s*components\s*:\s*{\s*$/gi.test(editor.document.lineAt(line).text.trim())) {
              hasComponents = true;
            }
            if (/\s*export\s*default\s*{\s*/gi.test(editor.document.lineAt(line).text.trim())) {
              secondInsertLine = line;
            }
            if (/\s*data\s*\(\s*\)\s*{\s*/gi.test(editor.document.lineAt(line).text.trim())) {
              let text = editor.document.lineAt(line).text;
              let insertPos = text.indexOf(text.trim());
              for (let i = 0; i < insertPos; i++) {
                baseEmpty += ' ';         
              }
              prorityInsertLine = line;
            }
            if (countLine > line) {
              line++;
            } else {
              break;
            }
          }
          if (prorityInsertLine > 0) {
            editor.edit((editBuilder) => {
              importString = importString.replace(/\\/gi, '/');
              editBuilder.insert(new Position(importLine - 1, 0), importString);
              editBuilder.insert(new Position(prorityInsertLine - 1, editor.document.lineAt(prorityInsertLine - 1).text.length), `\n\t${baseEmpty}components: { ${name} },`);
            });
            break;
          }
          if (secondInsertLine > 0) {
            editor.edit((editBuilder) => {
              importString = importString.replace(/\\/gi, '/');
              editBuilder.insert(new Position(importLine, 0), importString);
              editBuilder.insert(new Position(secondInsertLine, editor.document.lineAt(secondInsertLine).text.length),  `\n${this.tabSpace}components: { ${name} },`);
            });
          }
        }

        break;
      }
    }
  }

  // 获取预览标签
  getPreTag(): TagObject | undefined {
    let line = this._position.line;
    let tag: TagObject | string;
    let txt = this.getTextBeforePosition(this._position);

    while (this._position.line - line < 10 && line >= 0) {
      if (line !== this._position.line) {
        txt = this._document.lineAt(line).text;
      }
      tag = this.matchTag(this.tagReg, txt, line);

      if (tag === 'break') {return;}
      if (tag) {return <TagObject>tag;}
      line--;
    }
    return;
  }

  // 获取预览属性
  getPreAttr(): string | undefined {
    let txt = this.getTextBeforePosition(this._position).replace(/"[^'"]*(\s*)[^'"]*$/, '');
    let end = this._position.character;
    let start = txt.lastIndexOf(' ', end) + 1;
    let parsedTxt = this._document.getText(new Range(this._position.line, start, this._position.line, end));

    return this.matchAttr(this.attrReg, parsedTxt);
  }

  // 匹配属性
  matchAttr(reg: RegExp, txt: string): string {
    let match: any;
    match = reg.exec(txt);
    return !/"[^"]*"/.test(txt) && match && match[1];
  }

  // 匹配标签
  matchTag(reg: RegExp, txt: string, line: number): TagObject | string {
    let match: any;
    let arr: any[] = [];
    if (/<\/?[-\w]+[^<>]*>[\s\w]*<?\s*[\w-]*$/.test(txt) || (this._position.line === line && (/^\s*[^<]+\s*>[^<\/>]*$/.test(txt) || /[^<>]*<$/.test(txt[txt.length - 1])))) {
      return 'break';
    }
    while ((match = reg.exec(txt))) {
      arr.push({
        text: match[1],
        offset: this._document.offsetAt(new Position(line, match.index))
      });
    }
    return arr.pop();
  }

  // 获取本行位置前的文本
  getTextBeforePosition(position: Position): string {
    var start = new Position(position.line, 0);
    var range = new Range(start, position);
    return this._document.getText(range);
  }
  // 获取建议标签
  getTagSuggestion() {
    let suggestions = [];

    let id = 1;
    // 添加vue组件提示
    let vueFiles = this.traverse.search('.vue', '');
    this.vueFiles = vueFiles;
    for (let i = 0; i < vueFiles.length; i++) {
      const vf = vueFiles[i];
      suggestions.push({
        label: vf.name,
        sortText: `000${i}${vf.name}`,
        insertText: new SnippetString(`${vf.name}$0></${vf.name}>`),
        kind: CompletionItemKind.Folder,
        detail: 'meteor',
        documentation: 'internal component: ' + vf.path,
        command: { command: 'meteor.functionCompletion', title: 'completions' }
      });
    }

    for (let tag in TAGS) {
      suggestions.push(this.buildTagSuggestion(tag, TAGS[tag], id));
      id++;
    }
    return suggestions;
  }

  // 获取建议属性值
  getAttrValueSuggestion(tag: string, attr: string): CompletionItem[] {
    let suggestions: any[] = [];
    const values = this.getAttrValues(tag, attr);
    values.forEach((value: string) => {
      suggestions.push({
        label: value,
        kind: CompletionItemKind.Value
      });
    });
    return suggestions;
  }

  // 获取建议属性
  getAttrSuggestion(tag: string) {
    let suggestions: any[] = [];
    let tagAttrs = this.getTagAttrs(tag);
    let preText = this.getTextBeforePosition(this._position);
    let prefix: any = preText.replace(/['"]([^'"]*)['"]$/, '').split(/\s|\(+/).pop();
    // 方法属性
    const method = prefix[0] === '@';
    // 绑定属性
    const bind = prefix[0] === ':';

    prefix = prefix.replace(/[:@]/, '');
    if (/[^@:a-zA-z\s]/.test(prefix[0])) {
      return suggestions;
    }

    tagAttrs.forEach((attr: any) => {
      const attrItem = this.getAttrItem(tag, attr);
      if (!prefix.trim() || this.firstCharsEqual(attr, prefix)) {
        const sug = this.buildAttrSuggestion({ attr, tag, bind, method }, attrItem || {});
        sug && suggestions.push(sug);
      }
    });
    for (let attr in ATTRS) {
      const attrItem = this.getAttrItem(tag, attr);
      if (attrItem && attrItem.global && (!prefix.trim() || this.firstCharsEqual(attr, prefix))) {
        const sug = this.buildAttrSuggestion({ attr, tag: null, bind, method }, attrItem);
        sug && suggestions.push(sug);
      }
    }
    return suggestions;
  }

  // 编译建议标签
  buildTagSuggestion(tag: string, tagVal: any, id: number) {
    const snippets: any[] = [];
    let index = 0;
    let that = this;
    function build(tag: string, { subtags, defaults }: any, snippets: any) {
      // 属性
      let attrs = '';
      defaults && defaults.forEach((item: any, i: any) => {
        attrs += ` ${item}="$${index + i + 1}"`;
      });
      // 开始标签
      snippets.push(`${index > 0 ? '<' : ''}${tag}${attrs}>`);
      defaults && (index += defaults.length);
      index++;
      // 子标签
      if (subtags) {
        subtags.forEach((item: any) => build(item, TAGS[item], snippets));
        snippets.push(`</${tag}>`);
      } else {
        // 关闭标签
        snippets.push(`$${index}</${tag}>`);
      }
    };
    build(tag, tagVal, snippets);

    return {
      label: tag,
      sortText: `0${id}${tag}`,
      insertText: new SnippetString(pretty('<' + snippets.join(''), { indent_size: that.tabSpace.length }).substr(1)),
      kind: CompletionItemKind.Snippet,
      detail: `vue component`,
      documentation: tagVal.description
    };
  }

  buildAttrSuggestion({ attr, tag, bind, method }: any, { description, type, global, framework}: any) {
    if ((method && type === "method") || (bind && type !== "method") || (!method && !bind)) {
      let detail = '';
      // detail 指定标签所属框架（目前主要有 element-ui，vux， iview2）
      if(TAGS[tag] && TAGS[tag].framework){
        detail += TAGS[tag].framework;
      }
      if (global) {
        detail += `${framework}(global)`;
      }
      return {
        label: attr,
        sortText: `00${attr}`,
        insertText: (type && (type === 'flag')) ? `${attr} ` : new SnippetString(`${attr}="$1"$0`),
        kind: (type && (type === 'method')) ? CompletionItemKind.Method : CompletionItemKind.Property,
        detail,
        documentation: description || ''
      };
    } else { return; }
  }

  // 获取属性值
  getAttrValues(tag: any, attr: any) {
    let attrItem = this.getAttrItem(tag, attr);
    let options = attrItem && attrItem.options;
    if (!options && attrItem) {
      if (attrItem.type === 'boolean') {
        options = ['true', 'false'];
      } else if (attrItem.type === 'icon') {
        options = ATTRS['icons'];
      } else if (attrItem.type === 'shortcut-icon') {
        options = [];
        ATTRS['icons'].forEach((icon: any) => {
          options.push(icon.replace(/^el-icon-/, ''));
        });
      }
    }
    return options || [];
  }

  // 获取标签包含的属性
  getTagAttrs(tag: string) {
    return (TAGS[tag] && TAGS[tag].attributes) || [];
  }

  // 获取属性项
  getAttrItem(tag: string | undefined, attr: string | undefined) {
    return ATTRS[`${tag}/${attr}`] || (attr && ATTRS[attr]);
  }

  // 属性值开始
  isAttrValueStart(tag: Object | string | undefined, attr: any) {
    return tag && attr;
  }

  // 属性开始
  isAttrStart(tag: TagObject | undefined) {
    return tag;
  }

  // 是否是标签开始
  isTagStart() {
    let txt = this.getTextBeforePosition(this._position);
    return this.tagStartReg.test(txt);
  }

  // 是否是关闭标签
  isCloseTag() {
    let txt = this._document.getText(new Range(new Position(this._position.line, 0), this._position)).trim();
    if(!txt.endsWith('>') || /.*=("[^"]*>|'[^']*>)$/gi.test(txt) || txt.endsWith('/>')) {
      return false;
    }
    let txtArr = txt.match(/<([\w-]+)(\s*|(\s+[\w-_:@\.]+(=("[^"]*"|'[^']*'))?)+)\s*>/gim);
    if(Array.isArray(txtArr) && txtArr.length > 0) {
      let txtStr = txtArr[txtArr.length - 1];
      return /<([\w-]+)(\s*|(\s+[\w-_:@\.]+(=("[^"]*"|'[^']*'))?)+)\s*>$/gi.test(txtStr);
    }
    return false;
  }

  firstCharsEqual(str1: string, str2: string) {
    if (str2 && str1) {
      return str1[0].toLowerCase() === str2[0].toLowerCase();
    }
    return false;
  }
  // vue文件只在template里面提示，已script作为标记
  notInTemplate(): boolean {
    let line = this._position.line;
    while (line) {
      if (/^\s*<script.*>\s*$/.test(<string>this._document.lineAt(line).text)) {
        return true;
      }
      line--;
    }
    return false;
  }

  // 自动补全关闭标签
  getCloseTagSuggestion() {
    let txtInfo = this._document.lineAt(this._position.line);
    let txtArr = txtInfo.text.match(/<([\w-]+)(\s*|(\s+[\w-_:@\.]+(=("[^"]*"|'[^']*'))?)+)\s*>/gim);
    let tag = 'div';
    if(txtArr) {
      tag = txtArr[txtArr.length - 1].replace(/<([\w-]+)(\s*|(\s+[\w-_:@\.]+(=("[^"]*"|'[^']*'))?)+)\s*>/gim, '$1');
    }
    let exclude = ['br', 'img'];
    if (exclude.indexOf(tag) === -1) {
      window.activeTextEditor?.edit((editBuilder) => {
        editBuilder.insert(this._position, '</' + tag + '>');
      });
      let newPosition = window.activeTextEditor?.selection.active.translate(0, 0);
      if (window.activeTextEditor && newPosition) {
        window.activeTextEditor.selection = new Selection(newPosition, newPosition);
      }
    }
  }

  // 判断是否是{}括号开始
  isBrace() {
    let startPosition = new Position(this._position.line, this._position.character > 2 ? this._position.character - 2 : this._position.character);
    return /[^{]{/gi.test(this._document.getText(new Range(startPosition, this._position)));
  }

  // {}括号自动补全，只有行内html标签的地方需要补全
  braceSuggestion() {
    let txt = this.getTextBeforePosition(this._position).trim();
    let lineTxt = this._document.lineAt(this._position.line).text.trim();
    if(/<\w.*$/.test(txt) && lineTxt !== (txt + '}')) {
      window.activeTextEditor?.edit((editBuilder) => {
        editBuilder.insert(this._position, '}');
      });
      let newPosition = window.activeTextEditor?.selection.active.translate(0, 0);
      if (window.activeTextEditor && newPosition) {
        window.activeTextEditor.selection = new Selection(newPosition, newPosition);
      }
    }
  }

  // 判断是否是导入
  isImport() {
    let lineTxt = this._document.lineAt(this._position.line).text.trim();
    return /^\s*import.*/.test(lineTxt);
  }

  // 导入建议
  importSuggestion() {
    let search = this._document.lineAt(this._position.line).text.trim();
    search = search.replace(/^import/, '').trim();
    let suggestions: any[] = [];
    if (search) {
      let files = this.traverse.search('', search);
      files.forEach(vf => {
        let filePath = getRelativePath(this._document.uri.path, path.join(this.workspaceRoot, vf.path));
        let camelName = vf.name.replace(/(-[a-z])/g, (_: any, c: any) => {
          return c ? c.toUpperCase() : '';
        }).replace(/-/gi, '');
        suggestions.push({
          label: vf.name,
          sortText: `0${vf.name}`,
          insertText: new SnippetString(`\${1:${camelName}} from '${filePath}'`),
          kind: CompletionItemKind.Folder,
          detail: vf.name,
          documentation: `import ${camelName} from ${filePath}`
        });
      });
    }
    return suggestions;
  }

  // 获取props属性值
  getPropAttr(documentText: any, tagName: any) {
    // 1. 找出标签所在路径
    let tagNameUpper = tagName.replace(/(-[a-z])/g, (_: any, c: any) => {
      return c ? c.toUpperCase() : '';
    }).replace(/-/gi, '');
    let pathReg = RegExp('import\\\s+(' + tagName + '|' + tagNameUpper + ')\\\s+from\\\s+[\'\"]([^\'\"]*)', 'g');
    let pathRegArr = documentText.match(pathReg);
    if (pathRegArr && pathRegArr.length > 0) {
      let tagPath = pathRegArr[0];
      tagPath = tagPath.replace(/(.*['"])/, '');
      tagPath = tagPath.replace(this.config.get('pathAlias').alias, this.config.get('pathAlias').path);
      if (!tagPath.endsWith('.vue')) {
        tagPath += '.vue';
      }
      if (tagPath.indexOf('./') > 0 || tagPath.indexOf('../') > 0) {
        tagPath = path.join(this._document.fileName, '../', tagPath);
      } else {
        tagPath = path.join(workspace.rootPath || '', tagPath);
      }
      documentText = fs.readFileSync(tagPath, 'utf8');
    } else {
      return;
    }

    // 2. 获取标签文件中的prop属性
    let props = [];
    let scriptIndex = documentText.indexOf('<script');
    if (scriptIndex) {
      let docText = documentText.substr(scriptIndex, documentText.length);
      let propIndex = docText.indexOf('props');
      let propStack = 0;
      if (propIndex) {
        docText = docText.substr(propIndex, docText.length);
        let braceBeforeIndex = docText.indexOf('{');
        let braceAfterIndex = 0;
        if (braceBeforeIndex) {
          ++propStack;
          docText = docText.substr(braceBeforeIndex + 1, docText.length);
        }
        let propText = '';
        while(propStack > 0 && docText.length > 0) {
          braceBeforeIndex = docText.indexOf('{');
          braceAfterIndex = docText.indexOf('}');
          if (braceBeforeIndex === -1) {
            docText = '';
          } else if (braceBeforeIndex < braceAfterIndex) {
            if (propStack === 1) {
              propText += docText.substr(0, braceBeforeIndex);
            }
            ++propStack;
            docText = docText.substr(braceBeforeIndex > 0 ? braceBeforeIndex + 1 : 1, docText.length);
          } else {
            --propStack;
            docText = docText.substr(braceAfterIndex > 0 ? braceAfterIndex + 1 : 1, docText.length);
          }
        }
        let propMatch = propText.match(/\s[\w-]*:/gi);
        if (propMatch && propMatch.length > 0) {
          propMatch.forEach((propItem, propIndex) => {
            propItem = propItem.substr(1, propItem.length - 2);
            propItem = propItem.replace(/([A-Z])/g, (_, c) => {
              return c ? '-' + c.toLowerCase() : '';
            });
            props.push({
              label: propItem,
              sortText: '0' + propIndex,
              insertText: new SnippetString(`:${propItem}="$0"`),
              kind: CompletionItemKind.Property,
              documentation: ''
            });
          });
        }
      }
    }
    let emitReg = documentText.match(/\$emit\(\s?['"](\w*)/g);
    if (emitReg && emitReg.length > 0) {
      for (let i = 0; i < emitReg.length; i++) {
        let emitName = emitReg[i];
        emitName = emitName.replace(/(.*['"])/, '');
        props.push({
          label: emitName,
          sortText: '0' + (props.length + 1),
          insertText: new SnippetString(`@${emitName}="$0"`),
          kind: CompletionItemKind.Method,
          documentation: ''
        });
      }
    }
    return props;
  }

  isImportState() {
    return /^\s*import\s*{\s*[\w,\s]*\s*}\s*.*/.test(this._document.lineAt(this._position.line).text);
  }

  async importStateSuggestion() {
    let filePath = this._document.lineAt(this._position.line).text.replace(/.*[\'\"](.*)[\'\"].*/gi, '$1')
    // 导入提示针对JavaScript文件
    if (!filePath.endsWith('.js')) {
      filePath += '.js';
    }
    if (filePath.includes(this.config.get('pathAlias').alias)) {
      // 别名替换
      filePath = filePath.replace(this.config.get('pathAlias').alias, this.config.get('pathAlias').path);
      filePath = path.join(this.workspaceRoot, filePath)
    } else if (filePath.startsWith('./') || filePath.startsWith('../')) {
      // 相对路径
      filePath = path.join(this._document.uri.path, filePath)
    } else {
      return []
    }
    const symbolList: any = await commands.executeCommand('vscode.executeDocumentSymbolProvider', Uri.file(filePath))
    if (symbolList && symbolList.length > 0) {
      let symbolRet: any[] = []
      for (let i = 0; i < symbolList.length; i++) {
        const symbolItem = symbolList[i];
        let kind = this.CompletionItemKey.indexOf(this.symbolKey[symbolItem.kind])
        symbolRet.push({
          label: symbolItem.name,
          sortText: '0' + symbolRet.length,
          insertText: new SnippetString(`${symbolItem.name}`),
          kind: kind === -1 ? 5 : kind,
          documentation: ''
        })
      }
      return symbolRet
    }
    return []
  }

  // api请求接口参数判断
  isApiParams() {
    let currentLine = this._position.line - 1
    let params = []
    while (currentLine > 0) {
      let text = this._document.lineAt(currentLine).text
      if (/\s*\w*\s*:\s*\w*\s*/gi.test(text) || /^\s*[}\],]*\s*$/gi.test(text)) {
        let paramsNames = text.match(/\s*(\w*)\s*:\s*\w*\s*/i)
        if (paramsNames) {
          params.push(paramsNames[1])
        }
      } else {
        if (/\s*.*await\s*(\w*\.)?\w*\s*\(\{.*/gi.test(text)) {
          // 是api函数
          let textMatch = text.match(/\s*.*await\s+(?:\w*\.)?(\w*)\s*\(\{.*/i)
          if (textMatch) {
            return {
              params: params,
              name: textMatch[1]
            }
          } else {
            return ''
          }
        } else {
          return ''
        }
      }
      --currentLine
    }
    return ''
  }

  // api参数提示
  apiParamsCompletionItem(api: any) {
    let completionItems: CompletionItem[] = []
    let paramsObj: any = this.apis.get(api.name)
    for (const key in paramsObj) {
      const params = paramsObj[key];
      if (!api.params.includes(key)) {
        if (params.type === 'array') {
          let insertText = ``
          if (params.value.length > 0) {
            insertText = `${key}: [{\n`
            for (const itemKey in params.value[0]) {
              const item = params.value[0][itemKey];
              if (typeof item === 'string') {
                insertText += `${this.tabSpace}${itemKey}: ,\n`
              }
            }
            insertText += `}]`
          } else {
            insertText = `[]`
          }
          completionItems.push({
            label: key,
            insertText: new SnippetString(insertText),
            documentation: params.description,
            kind: CompletionItemKind.Field,
            sortText: '000' + completionItems.length
          })
        } else if (params.type === 'object') {
          let insertText = `${key}: {\n`
          for (const itemKey in params.value) {
            const item = params.value[itemKey];
            if (typeof item === 'string') {
              insertText += `${this.tabSpace}${itemKey}: ,\n`
            }
          }
          insertText += `}`
          completionItems.push({
            label: key,
            insertText: new SnippetString(insertText),
            documentation: params.description,
            kind: CompletionItemKind.Field,
            sortText: '000' + completionItems.length
          })
        } else {
          completionItems.push({
            label: key,
            insertText: new SnippetString(`${key}: `),
            documentation: params.description,
            kind: CompletionItemKind.Field,
            sortText: '000' + completionItems.length
          })
        }
      }
    }
    return completionItems
  }

  // 提供完成项(提示入口)
  provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<CompletionItem[] | CompletionList> {
    this._document = document;
    this._position = position;
    this.workspaceRoot = getWorkspaceRoot(this._document.uri.path)
    if (this.tabSpace.length === 0) {
      this.tabSpace = setTabSpace()
    }

    // 函数参数判断
    let api = this.isApiParams()
    if (api) {
      return this.apiParamsCompletionItem(api)
    }
    
    // import导入提示增强
    if (this.isImportState()) {
      return this.importStateSuggestion();
    }
    
    // {}补全处理
    if(this.isBrace()) {
      this.braceSuggestion();
      return null;
    }
    if (this.isCloseTag()) { // 标签关闭标签
      this.getCloseTagSuggestion();
      return null;
    }

    // 标签、属性
    let tag: TagObject | string | undefined = this.getPreTag();
    let attr = this.getPreAttr();
    if (tag && attr && this.isAttrValueStart(tag, attr)) { // 属性值开始
      return this.getAttrValueSuggestion(tag.text, attr);
    } else if (tag && this.isAttrStart(tag)) { // 属性开始
      if (TAGS[tag.text]) {
        // 插件提供
        return this.getAttrSuggestion(tag.text);
      } else {
        return this.getPropAttr(this._document.getText(), tag.text);
      }
    } else if (this.isTagStart()) { // 标签开始
      switch (document.languageId) {
        case 'vue':
          return this.notInTemplate() ? [] : this.getTagSuggestion();
        case 'html':
        case 'wxml':
          return this.getTagSuggestion();
      }
    } else if (this.isImport()) {
      return this.importSuggestion();
    } else { 
      return []; 
    }
  }
}

