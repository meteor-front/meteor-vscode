# CHANGELOG FOR METEOR

# 扩展功能
插件meteor的宗旨是提高开发效率，一切能够提高效率的功能，meteor都是欢迎的。<br>
目前meteor中扩展的功能主要有以下部分：<br>
![扩展功能](https://www.80fight.cn/vscode/componentExtend.png)
## vue方法生成
快捷键 （alt + shift + enter）
![newMethod.gif](https://www.80fight.cn/vscode/newMethod.gif)
## api接口生成
在vscode命令行执行 `meteor:api`
![apiCreate.gif](https://www.80fight.cn/vscode/apiCreate.gif)
## swagger生成接口
在vscode命令行执行 `meteor:swagger`。可根据swagger一次性全部生成，也可以根据某个接口名称单个生成。
![swaggerCreate.gif](https://www.80fight.cn/vscode/swaggerCreate.gif)
## vscode右上角进入官网
![goOfficial.gif](https://www.80fight.cn/vscode/goOfficial.gif)
## 完成项功能增强
#### 一、import导入提示<br>
![goOfficial.gif](https://www.80fight.cn/vscodeImgs/completionItemImport.gif)
相关配置参数：<br>
[componentNamingRule]() 指定组件生成规则，有`kebabCase`、`camelCase`、`CamelCase`<br>
[pathAlias]() 指定别名对应的路径<br>
#### 二、 element代码块提示，属性提示
![completionItemElement.gif](https://www.80fight.cn/vscodeImgs/completionItemElement.gif)
#### 三、工程内组件引入
![autoImportComponent](https://www.80fight.cn/vscodeImgs/autoImportComponent.gif)
#### 四、自动导入文件
![autoImport](https://www.80fight.cn/vscodeImgs/autoImport.gif)
#### 五、函数自动完成
![functionAutoComplete](https://www.80fight.cn/vscodeImgs/functionAutoComplete.gif)
## 块选择功能
![blockSelect](https://www.80fight.cn/vscodeImgs/blockSelect.gif)