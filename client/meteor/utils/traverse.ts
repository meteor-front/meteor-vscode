import * as fs from 'fs'
import * as path from 'path'
import { WorkspaceConfiguration } from 'vscode'

export default class Traverse {
  private config?: any
  private rootPath?: string
  public constructor(config: WorkspaceConfiguration, rootPath: string) {
    this.config = config
    this.rootPath = rootPath
  }
  // 遍历组件
  search(poster: any, searchName: any) {
    let files: any[] = [];
    let cond = null;
    let that: any = this
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
    let rootPathes = fs.readdirSync(this.rootPath || '');
    let prefix = this.config.pathAlias;
    
    for (let i = 0; i < rootPathes.length; i++) {
      const rootPath = rootPathes[i];
      if (cond(rootPath)) {
        let stat = fs.statSync(path.join(this.rootPath || '', rootPath));
        if (stat.isDirectory()) {
          this.traverseHandle(rootPath, files, prefix, poster, searchName);
        } else {
          this.traverseAdd(rootPath, rootPath, files, prefix, poster, searchName);
        }
      }
    }
    return files;
  }

  // 遍历添加
  traverseAdd(rootPath: string, dir: string, files: any[], prefix: any, poster: string, search: string) {
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
      // dir = dir.replace(posterReg, '$1');
      if (!search || (search && dir.includes(search))) {
        files.push({
          name: name,
          path: dir
        });
      }
    }
  }

  // 遍历处理
  traverseHandle(postPath: string, files: any [], prefix: any, poster: string, search: string) {
    let fileDirs = fs.readdirSync(path.join(this.rootPath || '', postPath));
    for (let i = 0; i < fileDirs.length; i++) {
      const rootPath = fileDirs[i];
      if (!(rootPath.charAt(0) === '.')) {
        let dir = path.join(postPath, rootPath);
        let stat = fs.statSync(path.join(this.rootPath || '', dir));
        if (stat.isDirectory()) {
          this.traverseHandle(dir, files, prefix, poster, search);
        } else {
          this.traverseAdd(rootPath, dir, files, prefix, poster, search);
        }
      }
    }
  }
}