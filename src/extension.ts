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

let activeEditor;

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

export function activate(context: vscode.ExtensionContext) {

    let disposable = vscode.commands.registerCommand('extension.annotate', async () => {
        // The code you place here will be executed every time your command is executed
        if (workspace.workspaceFolders) {
            const folder = workspace.workspaceFolders[0];
            const rootPath = folder.uri.fsPath
            const noteDir = path.join(rootPath, noteDirectory);
            if (!fs.existsSync(noteDir)) {
                fs.mkdirSync(noteDir);
            }
            
            activeEditor = vscode.window.activeTextEditor;
            notatedTextDocument = activeEditor.document;
    
            const active = activeEditor.selection.active;
            const anchor = activeEditor.selection.anchor;
            const commentPos = new Position(anchor.line, 0);

            const uuid = uuidv4();
            // TODO - add code to get the proper comment string from prefs
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

    vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

    // workspace.onDidOpenTextDocument(document => {
          
    // });

    // When a document is saved check to see if it a margin note
    workspace.onDidSaveTextDocument(async document => {
        
        const fileName = document.uri.fsPath;
        const text = document.getText();
        const match = fileName.match(/.*\.marginalia.((\d|[a-z]){8}-(\d|[a-z]){4}-(\d|[a-z]){4}-(\d|[a-z]){4}-(\d|[a-z]){12})\.md/);

        if (match) {
            if (document.lineCount == 0) {
                // note is empty so remove notation from active document

            }
            vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        }
    });
}

// this method is called when your extension is deactivated
export function deactivate() {
    console.log("Deactivating marginalia")
}

export function triggerUpdateDecorations() {
    if (workspace.workspaceFolders) {
        const folder = workspace.workspaceFolders[0];
        const rootPath = folder.uri.fsPath
        const noteDir = path.join(rootPath, noteDirectory);
        activeEditor = vscode.window.activeTextEditor;

        const decs: vscode.DecorationOptions[] = [];
        if (fs.existsSync(noteDir)) {
            // set all the decorations for all the notes
            const uuidRegex = /(\d|[a-z]){8}-(\d|[a-z]){4}-(\d|[a-z]){4}-(\d|[a-z]){4}-(\d|[a-z]){12}/g;
            const text = activeEditor.document.getText();
            const matches = text.match(uuidRegex);
            for (let uuid of matches) {
                // read the file for the uuid
                const filePath = path.join(noteDir, `${uuid}.md`);
                fs.readFile(filePath, (err, data) => {
                    let noteText;
                    if (err) {
                        // window.showWarningMessage(`Could not find margin note for id [${uuid}]`);
                        // ignore errors for now and add a warning message
                        noteText = `WARNING: MISSING NOTE FILE\nNote file ${filePath} does not exist or could not be read. To stop seeing this warning message create that file and add markdown content to it.`
                    } else {
                        noteText = data.toString();
                    }

                    // set the decoration for the comment
                    let offset = text.indexOf(uuid);
                    if (offset != -1) {
                        // move back three places to include "MN:" part
                        offset -= 3;
                        const pos = activeEditor.document.positionAt(offset);
                        const range = new vscode.Range(pos, new Position(pos.line, 100) );
                        const decoration = { range: range, hoverMessage: noteText }
                        decs.push(decoration);
                        activeEditor.setDecorations(smallNumberDecorationType, decs);
                    }
                });
            }
        }
    }    
}