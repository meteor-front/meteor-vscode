import { window, Position, Selection, Range } from 'vscode'
import { asNormal } from '../utils/util'
export default class BackSpace {
  // backspace删除处理
  async deleteComplete() {
    let editor: any = window.activeTextEditor;
    if(!editor) {
      asNormal('backspace');
      return; 
    }
    // 多选择点删除处理
    if(window.activeTextEditor?.selections.length && window.activeTextEditor?.selections.length > 1) {
      let selections = window.activeTextEditor?.selections;
      let selectionList: Array<Selection> = [];
      for (let index = 0; index < selections.length; index++) {
        const selection = selections[index];
        if(selection.start.line === selection.end.line && selection.start.character === selection.end.character) {
          if(selection.anchor.character > 0) {
            selectionList.push(new Selection(new Position(selection.anchor.line, selection.anchor.character - 1), selection.anchor));
          } else if (selection.anchor.line > 0) {
            let len = editor.document.lineAt(selection.anchor.line - 1).text.length;
            selectionList.push(new Selection(new Position(selection.anchor.line - 1, len), selection.anchor));
          }
        } else {
          selectionList.push(selection);
        }
      }
      await editor.edit((editBuilder: any) => {
        for (let i = 0; i < selectionList.length; i++) {
          editBuilder.delete(selectionList[i]); 
        }
      });
      return;
    }
    if(window.activeTextEditor?.selection.start.line === window.activeTextEditor?.selection.end.line 
      && window.activeTextEditor?.selection.start.character === window.activeTextEditor?.selection.end.character) {
      // 首行
      if(editor.selection.anchor.line === 0) {
        if(editor.selection.anchor.character > 0) {
          await editor.edit((editBuilder: any) => {
            editBuilder.delete(new Selection(new Position(editor.selection.anchor.line, editor.selection.anchor.character - 1), editor.selection.anchor));
          });
        }
      } else {
        let isLineEmpty = editor.document.lineAt(editor.selection.anchor.line).text.trim() === '';
        // 整行都是空格
        if(isLineEmpty) {
          let preText = '';
          let line = editor.selection.anchor.line;
          while(preText.trim() === '' && line >= 0) {
            line -= 1;
            preText = editor.document.lineAt(line).text;
          }
          await editor.edit((editBuilder: any) => {
            editBuilder.delete(new Selection(new Position(line, preText.length), editor.selection.anchor));
          });
        } else {
          let startPosition: Position;
          let endPosition: Position = editor.selection.anchor;
          let preLineText = editor.document.getText(new Range(new Position(endPosition.line, 0), endPosition));
          if(endPosition.character === 0 || preLineText.trim() === '') {
            startPosition = new Position(endPosition.line - 1, editor.document.lineAt(endPosition.line - 1).text.length);
          } else {
            startPosition = new Position(endPosition.line, endPosition.character - 1);
            // 对{}, (), [], '', "", <>进行成对删除处理
            let txt = editor.document.getText(new Range(new Position(endPosition.line, endPosition.character - 1), endPosition));
            if(editor.document.lineAt(endPosition.line).text.length > endPosition.character) {
              let nextTxt = editor.document.getText(new Range(endPosition, new Position(endPosition.line, endPosition.character + 1)));
              if((txt === '{' && nextTxt === '}') 
              || (txt === '(' && nextTxt === ')') 
              || (txt === '\'' && nextTxt === '\'') 
              || (txt === '"' && nextTxt === '"') 
              || (txt === '[' && nextTxt === ']') 
              || (txt === '<' && nextTxt === '>')) {
                endPosition = new Position(endPosition.line, endPosition.character + 1);
              }
            }
          }
          await editor.edit((editBuilder: any) => {
            editBuilder.delete(new Selection(startPosition, endPosition));
          });
        }
      }
    } else {
      // 选择块
      asNormal('backspace');
    }
  }
}