import * as vscode from 'vscode';
const CONFIGURATION_SECTION = 'meteor';

export function dataSave(section: string, value: any, configurationTarget?: boolean | vscode.ConfigurationTarget | undefined, overrideInLanguage?: boolean | undefined): void {
  vscode.workspace.getConfiguration(CONFIGURATION_SECTION).update(section, value, vscode.ConfigurationTarget.Global);
}

export function dateGet(section: string): any {
  return vscode.workspace.getConfiguration(CONFIGURATION_SECTION).get(section);
}