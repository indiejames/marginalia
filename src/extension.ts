'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { workspace, window, WorkspaceEdit, Position, CommentRule } from 'vscode';
const uuidv4 = require('uuid/v4');

// The TextDocument where a note was created
// TODO replace this with a map of uuids to TextDocuemnts
let notatedTextDocument;

let noteDirectory = '.marginalia';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    const smallNumberDecorationType = vscode.window.createTextEditorDecorationType({
		borderWidth: '1px',
		borderStyle: 'solid',
		overviewRulerColor: 'blue',
		overviewRulerLane: vscode.OverviewRulerLane.Right,
		light: {
			// this color will be used in light color themes
			borderColor: 'darkblue'
		},
		dark: {
			// this color will be used in dark color themes
			borderColor: 'lightblue'
		}
    });
    
    

    // Read the stored notes file if it exists.
    // const dataFilePath = "./marginalia.json";
    // const relDataFilePath = vscode.workspace.asRelativePath(dataFilePath);
    // let annotations = [];
    // if (fs.existsSync(relDataFilePath)) {
    //     const file = fs.readFileSync(relDataFilePath);
    //     annotations = JSON.parse(file.toString());
    // };
    

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.annotate', async () => {
        // The code you place here will be executed every time your command is executed
        if (workspace.workspaceFolders) {
            const folder = workspace.workspaceFolders[0];
            const rootPath = folder.uri.fsPath
            const noteDir = path.join(rootPath, noteDirectory);
            if (!fs.existsSync(noteDir)) {
                fs.mkdirSync(noteDir);
            }
            
            let activeEditor = vscode.window.activeTextEditor;
            notatedTextDocument = activeEditor.document;
    
            const active = activeEditor.selection.active;
            const anchor = activeEditor.selection.anchor;
            const commentPos = new Position(anchor.line, 0);

            const uuid = uuidv4();
            // TODO - add code to get the proper comment string
            const comment = ";; MN:" + uuid + "\n";

            activeEditor.edit(edit => {
                edit.insert(commentPos, comment);
            }, {
                undoStopAfter: false,
                undoStopBefore: false
            });

            const noteFilePath = path.join(noteDir, uuid + ".md");
            const uri = vscode.Uri.parse("untitled:" + noteFilePath);
            const doc = await vscode.workspace.openTextDocument(uri);
            vscode.window.showTextDocument(doc, vscode.ViewColumn.Three);
        } else {
            vscode.window.showErrorMessage("Adding notes requires an open folder.")
        }
    });

    context.subscriptions.push(disposable);

    workspace.onDidOpenTextDocument(document => {
        if (workspace.workspaceFolders) {
            const folder = workspace.workspaceFolders[0];
            const rootPath = folder.uri.fsPath
            const noteDir = path.join(rootPath, noteDirectory);
            const activeEditor = vscode.window.activeTextEditor;
            const decs: vscode.DecorationOptions[] = [];
            if (fs.existsSync(noteDir)) {
                // set all the decorations for all the notes
                const uuidRegex = /(\d|[a-z]){8}-(\d|[a-z]){4}-(\d|[a-z]){4}-(\d|[a-z]){4}-(\d|[a-z]){12}/g;
                const text = document.getText();
                const matches = text.match(uuidRegex);
                for (let uuid of matches) {
                    // read the file for the uuid
                    const filePath = path.join(noteDir, `${uuid}.md`);
                    fs.readFile(filePath, (err, data) => {
                        if (err) {
                            window.showWarningMessage(err.message);
                        } else {
                            // set the decoration for the comment
                            const offset = text.indexOf(uuid);
                            if (offset != -1) {
                                const pos = activeEditor.document.positionAt(offset);
                                const range = new vscode.Range(pos, new Position(pos.line, 100) );
                                // const position = new vscode.Range(anchor, active);
                                // const decoration = { range: range, hoverMessage: "## TEST\nABC *123*\n```javascript\nvar x = 4;\n```\n![alt text](https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png \"Logo Title Text 1\")"};
                                const decoration = { range: range, hoverMessage: data.toString() }
                                decs.push(decoration);
                                // TODO - is this a leak?
                                activeEditor.setDecorations(smallNumberDecorationType, decs);
                            }
                        }
                    });
                }
            }
        }      
    });

    // When a document is saved check to see if it a margin note
    workspace.onDidSaveTextDocument(async document => {
        const mdEditor = vscode.window.activeTextEditor;
        const fileName = document.uri.fsPath;
        const text = document.getText();
        const match = fileName.match(/.*\.marginalia.((\d|[a-z]){8}-(\d|[a-z]){4}-(\d|[a-z]){4}-(\d|[a-z]){4}-(\d|[a-z]){12})\.md/);
        const decs: vscode.DecorationOptions[] = [];
        if (match) {
            // Get the text of the document and set it as the decoration for the note tag
            const uuid = match[1];
            await vscode.window.showTextDocument(notatedTextDocument, { preserveFocus: false });
            const activeEditor = vscode.window.activeTextEditor;
            const commentIndex = activeEditor.document.getText().indexOf(uuid);
            const anchor = activeEditor.document.positionAt(commentIndex);  
            
            if (anchor) {
                const range = new vscode.Range(anchor, new Position(anchor.line, 100) );
                // const position = new vscode.Range(anchor, active);
                // const decoration = { range: range, hoverMessage: "## TEST\nABC *123*\n```javascript\nvar x = 4;\n```\n![alt text](https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png \"Logo Title Text 1\")"};
                const decoration = { range: range, hoverMessage: text }
                decs.push(decoration);
            }

            
            activeEditor.setDecorations(smallNumberDecorationType, decs);
            mdEditor.hide();
        }
    });
}

// this method is called when your extension is deactivated
export function deactivate() {
}