'use strict';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { workspace, window, WorkspaceEdit, Position, TextEditor, Range, commands, TextDocument } from 'vscode';
import { disconnect } from 'cluster';
const uuidv4 = require('uuid/v4');

let notatedEditor = {};

let noteDirectory = '.marginalia';

let activeEditor;

const marginaliaDecorationType = vscode.window.createTextEditorDecorationType({
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

const noteFolder = (document: TextDocument) => {
    const folderSetting:string = vscode.workspace.getConfiguration('marginalia').get('noteFolder');
    if (folderSetting.match(/\$\{workspaceTopLevelFolder\}/)) {
        const documentPath = document.fileName;
        for (let folder of workspace.workspaceFolders) {
            const folderPath = folder.uri.fsPath
            if (documentPath.indexOf(folderPath) != -1) {
                return folderSetting.replace('${workspaceTopLevelFolder}',folderPath);
            }
        }
    }

    return folderSetting;
}

export function activate(context: vscode.ExtensionContext) {

    let disposable = vscode.commands.registerCommand('extension.annotate', async () => {
        if (workspace.workspaceFolders) {
            activeEditor = vscode.window.activeTextEditor;
            // const folder = workspace.workspaceFolders[0];
            // const rootPath = folder.uri.fsPath
            // const noteDir = path.join(rootPath, noteDirectory);
            const noteDir = noteFolder(activeEditor.document);

            if (!fs.existsSync(noteDir)) {
                fs.mkdirSync(noteDir);
            }
    
            const active = activeEditor.selection.active;
            const anchor = activeEditor.selection.anchor;
            const commentPos = new Position(anchor.line, 0);

            const uuid = uuidv4();
            notatedEditor[uuid] = {
                editor: activeEditor,
                commentPos: commentPos
            };

            const prefix = vscode.workspace.getConfiguration('marginalia').get('markerPrefix');
            const marker = `${prefix}${uuid}\n`;

            const editWorked = await activeEditor.edit(edit => {
                edit.insert(commentPos, marker);
            }, {
                undoStopAfter: false,
                undoStopBefore: false
            });

            // Use editor actions to comment the marker - this lets us work with any language
            if (editWorked) {
                await commands.executeCommand('cursorMove', {to: 'up'})
                // TODO add a check here to make sure this works - otherwise I should remove the
                // marker.
                vscode.commands.executeCommand('editor.action.commentLine');
            }

            const noteFilePath = path.join(noteDir, uuid + ".md");
            const uri = vscode.Uri.parse("untitled:" + noteFilePath);
            const doc = await vscode.workspace.openTextDocument(uri);
            vscode.window.showTextDocument(doc, vscode.ViewColumn.Three);

        } else {
            vscode.window.showErrorMessage("Adding notes requires an open folder.")
        }
    });

    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('extension.displayMarginNotes', () => {
        // Update the active editor
        updateDecorations();
    });

    context.subscriptions.push(disposable);

    vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			updateDecorations();
		}
    }, null, context.subscriptions);
    
    // workspace.onDidOpenTextDocument(document => {
    // });
    

    workspace.onDidCloseTextDocument(async document => {
        const fileName = document.uri.fsPath;
        const match = fileName.match(/.*\.marginalia.((\d|[a-z]){8}-(\d|[a-z]){4}-(\d|[a-z]){4}-(\d|[a-z]){4}-(\d|[a-z]){12})\.md/);

        if (match) {
            if (document.getText() === '') {
                const editInfo = notatedEditor[match[1]];
                if (editInfo) {
                    notatedEditor[match[1]] = null;
                    const editor: TextEditor = editInfo["editor"];
                    const pos = editInfo["commentPos"];

                    if (pos) {
                        const start = new Position(pos.line, 0);
                        const end = new Position(pos.line+1, 0);
                        const range = new Range(start, end);
                        const applied = await editor.edit(edit => {
                            edit.delete(range);
                        }, {
                            undoStopAfter: false,
                            undoStopBefore: false
                        });

                        updateDecorations();

                    }
                }
            }
        }
    });

    // When a document is saved check to see if it a margin note
    workspace.onDidSaveTextDocument(async document => {
        
        const fileName = document.uri.fsPath;
        const text = document.getText();
        const match = fileName.match(/.*\.marginalia.((\d|[a-z]){8}-(\d|[a-z]){4}-(\d|[a-z]){4}-(\d|[a-z]){4}-(\d|[a-z]){12})\.md/);

        if (match) {
            // if (document.getText() === '') {
            //     const editInfo = notatedEditor[match[1]];
            //     if (editInfo) {
            //         const editor: TextEditor = editInfo["editor"];
            //         const pos = editInfo["commentPos"];

            //         if (pos) {
            //             const start = new Position(pos.line, 0);
            //             const end = new Position(pos.line+1, 0);
            //             const range = new Range(start, end);
            //             editor.edit(edit => {
            //                 edit.delete(range);
            //             }, {
            //                 undoStopAfter: false,
            //                 undoStopBefore: false
            //             });
            //         }
            //     }
            // }
            vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        }
    });
}

// this method is called when your extension is deactivated
export function deactivate() {
    console.log("Deactivating marginalia")
}

export function updateDecorations() {
    if (workspace.workspaceFolders) {
        const folder = workspace.workspaceFolders[0];
        const rootPath = folder.uri.fsPath
        // const noteDir = path.join(rootPath, noteDirectory);
        activeEditor = vscode.window.activeTextEditor;
        const noteDir = noteFolder(activeEditor.document);

        const decs: vscode.DecorationOptions[] = [];
        if (fs.existsSync(noteDir)) {
            // set all the decorations for all the notes
            // TODO - update this to include the prefix to prevent finding text that just happens
            // to match this regex
            const uuidRegex = /(\d|[a-z]){8}-(\d|[a-z]){4}-(\d|[a-z]){4}-(\d|[a-z]){4}-(\d|[a-z]){12}/g;
            const text = activeEditor.document.getText();
            const matches = text.match(uuidRegex);
            for (let uuid of matches) {
                // read the file for the uuid
                const filePath = path.join(noteDir, `${uuid}.md`);
                fs.readFile(filePath, (err, data) => {
                    let noteText;
                    if (err) {
                        // ignore errors for now and add a warning message
                        noteText = `WARNING: MISSING NOTE FILE\nNote file ${filePath} does not exist or could not be read. To stop seeing this warning message create that file and add markdown content to it or remove this comment.`
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
                        activeEditor.setDecorations(marginaliaDecorationType, decs);
                    }
                });
            }
        }
    }    
}