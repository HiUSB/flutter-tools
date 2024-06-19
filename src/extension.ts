// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { imageGenerate } from "./commands/image-generate";
import { createCommonDirectory } from './commands/create-common-directory.command';
import { routersGenerate } from './commands/routers-generate';
import { newPage } from './commands/new-page.command';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let assetsDisposable = vscode.commands.registerCommand(
		"flutter-tools.assets-generate",
		imageGenerate
	);
	let commonDirectoryDisposable = vscode.commands.registerCommand(
		"flutter-tools.create-directory",
		createCommonDirectory
	);
	let routersGenerateDisposable = vscode.commands.registerCommand(
		"flutter-tools.routers-generate",
		routersGenerate
	);
	let newPageDisposable = vscode.commands.registerCommand(
		"flutter-tools.new-page",
		newPage
	);
	context.subscriptions.push(assetsDisposable, commonDirectoryDisposable, routersGenerateDisposable, newPageDisposable,);
}

// This method is called when your extension is deactivated
export function deactivate() { }
