"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateGet = exports.dataSave = void 0;
const vscode = require("vscode");
const CONFIGURATION_SECTION = 'zlst';
function dataSave(section, value, configurationTarget, overrideInLanguage) {
    vscode.workspace.getConfiguration(CONFIGURATION_SECTION).update(section, value, vscode.ConfigurationTarget.Global);
}
exports.dataSave = dataSave;
function dateGet(section) {
    return vscode.workspace.getConfiguration(CONFIGURATION_SECTION).get(section);
}
exports.dateGet = dateGet;
//# sourceMappingURL=data.js.map