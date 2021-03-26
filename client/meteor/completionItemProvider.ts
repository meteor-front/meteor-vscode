import { window, CancellationToken, workspace, CompletionItemProvider, ProviderResult,
  TextDocument, Position, CompletionItem, CompletionList, CompletionItemKind,
  SnippetString, Range, Selection, WorkspaceConfiguration } from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TAGS } from './tags/index';
import { ATTRS } from './attributes/index';
const pretty = require('pretty');

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
  private size!: number;
  private quotes!: string;
  private config: WorkspaceConfiguration

  public constructor(config: WorkspaceConfiguration) {
    this.config = config
  }

  // 遍历组件
  traverse(poster: any, search: any) {
    let vueFiles: any[] = [];
    let cond = null;
    let that = this
    if (this.config.componentPath && Array.isArray(this.config.componentPath) && this.config.componentPath.length > 0) {
      cond = function (rootPath: any) {
        return that.config.componentPath.indexOf(rootPath) !== -1;
      };
    } else {
      let ignore = this.config.componentIgnore || [];
      if (!Array.isArray(ignore)) {
        ignore = [ignore];
      }
      ignore = ignore.concat(['node_modules', 'dist', 'build']);
      cond = function (rootPath: any) {
        return !(rootPath.charAt(0) === '.' || ignore.indexOf(rootPath) !== -1);
      };
    }
    let rootPathes = fs.readdirSync(workspace.rootPath || '');
    let prefix = this.config.componentPrefix;
    
    for (let i = 0; i < rootPathes.length; i++) {
      const rootPath = rootPathes[i];
      if (cond(rootPath)) {
        let stat = fs.statSync(path.join(workspace.rootPath || '', rootPath));
        if (stat.isDirectory()) {
          this.traverseHandle(rootPath, vueFiles, prefix, poster, search);
        } else {
          this.traverseAdd(rootPath, rootPath, vueFiles, prefix, poster, search);
        }
      }
    }
    return vueFiles;
  }

  // 遍历添加
  traverseAdd(rootPath: string, dir: string, vueFiles: any[], prefix: any, poster: string, search: string) {
    if (rootPath.endsWith(poster)) {
      let posterReg = new RegExp('-?(.*)' + (poster ? poster : '\\.\\w*') + '$', 'gi');
      let name = rootPath;
      if (poster === '.vue') {
        if (this.config.componentNamingRule === 'kebabCase') {
          name = name.replace(/([A-Z_])/g, (_, c) => {
            if (c === '_') {
              return '-';
            } else {
              return c ? ('-' + c.toLowerCase()) : '';
            }
          }).replace(posterReg, '$1'); 
        } else if (this.config.componentNamingRule === 'camelCase') {
          name = name.replace(/(-[a-z])/g, (_, c) => {
            return c ? c.toUpperCase() : '';
          }).replace(/-/gi, '').replace(posterReg, '$1');
        }  else if (this.config.componentNamingRule === 'CamelCase') {
          name = name.replace(/(-[a-z])/g, (_, c) => {
            return c ? c.toUpperCase() : '';
          }).replace(/-/gi, '').replace(posterReg, '$1');
          if (name && name.length > 0) {
            name = name[0].toUpperCase() + name.substr(1, name.length);
          }
        }
      } else {
        name = name.replace(posterReg, '$1');
      } 
      dir = dir.replace(posterReg, '$1');
      if (!search || (search && dir.includes(search))) {
        if (prefix.path === './' || prefix.path === '') {
          vueFiles.push({
            name: name,
            path: prefix.alias + '/' + dir
          });
        } else {
          vueFiles.push({
            name: name,
            path: dir.replace(new RegExp('^' + prefix.path), prefix.alias)
          });
        }
      }
    }
  }

  // 遍历处理
  traverseHandle(postPath: string, vueFiles: any [], prefix: any, poster: string, search: string) {
    let fileDirs = fs.readdirSync(path.join(workspace.rootPath || '', postPath));
    for (let i = 0; i < fileDirs.length; i++) {
      const rootPath = fileDirs[i];
      if (!(rootPath.charAt(0) === '.')) {
        let dir = path.join(postPath, rootPath);
        let stat = fs.statSync(path.join(workspace.rootPath || '', dir));
        if (stat.isDirectory()) {
          this.traverseHandle(dir, vueFiles, prefix, poster, search);
        } else {
          this.traverseAdd(rootPath, dir, vueFiles, prefix, poster, search);
        }
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

    let id = 100;
    // 添加vue组件提示
    let vueFiles = this.traverse('.vue', '');
    for (let i = 0; i < vueFiles.length; i++) {
      const vf = vueFiles[i];
      suggestions.push({
        label: vf.name,
        sortText: `1000${i}${vf.name}`,
        insertText: new SnippetString(`${vf.name}$0></${vf.name}>`),
        kind: CompletionItemKind.Module,
        detail: 'vue component',
        documentation: 'internal component: ' + vf.path
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
      if (attrItem && (!prefix.trim() || this.firstCharsEqual(attr, prefix))) {
        const sug = this.buildAttrSuggestion({ attr, tag, bind, method }, attrItem);
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
        attrs += ` ${item}=${that.quotes}$${index + i + 1}${that.quotes}`;
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
      insertText: new SnippetString(pretty('<' + snippets.join(''), { indent_size: this.size }).substr(1)),
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
        insertText: (type && (type === 'flag')) ? `${attr} ` : new SnippetString(`${attr}=${this.quotes}$1${this.quotes}$0`),
        kind: (type && (type === 'method')) ? CompletionItemKind.Method : CompletionItemKind.Property,
        detail,
        documentation: description
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
    let startPosition = new Position(this._position.line, this._position.character - 2);
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
      let vueFiles = this.traverse('', search);
      vueFiles.forEach(vf => {
        let filePath = vf.path.replace(/\\/gi, '/');
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
      tagPath = tagPath.replace(this.config.componentPrefix.alias, this.config.componentPrefix.path);
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

  importStateSuggestion() {
    let filePath = this._document.lineAt(this._position.line).text.replace(/.*[\'\"](.*)[\'\"].*/gi, '$1')
    filePath = filePath.replace(this.config.componentPrefix.alias, this.config.componentPrefix.path);
    if (!filePath.endsWith('.js')) {
      filePath += '.js';
    }
    try {
      let dist = fs.readFileSync(path.join(workspace.rootPath || '', filePath), 'utf-8');
      let lineTexts = dist.split('\n');
      let props = []
      for (let i = 0; i < lineTexts.length; i++) {
        const lienText = lineTexts[i];
        if (/export.*/gi.test(lienText.trim())) {
          let stateName = lienText.replace(/\s*export\s*\w*\s*(\w*).*/gi, '$1');
          props.push({
            label: stateName,
            sortText: '0' + (props.length + 1),
            insertText: new SnippetString(`${stateName}`),
            kind: CompletionItemKind.Property,
            documentation: ''
          });
        }
      }
      return props;
    } catch (error) {
      return [];
    }
  }

  // 提供完成项(提示入口)
  provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): ProviderResult<CompletionItem[] | CompletionList> {
    this._document = document;
    this._position = position;
    
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
    this.size = <number>this.config.get('indent-size');
    this.quotes = this.config.get('quotes') === 'double' ? '"' : "'";

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
          // todo
          return this.getTagSuggestion();
      }
    } else if (this.isImport()) {
      return this.importSuggestion();
    } else { return []; }
  }
}
