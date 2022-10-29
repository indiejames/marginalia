# Marginalia

[![Join the chat at https://gitter.im/vscode-marginalia/Lobby](https://badges.gitter.im/vscode-marginalia/Lobby.svg)](https://gitter.im/vscode-marginalia/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

A Visual Studio Code extension for adding embedded markdown notes to code files.

## Features

Add markdown notes to your code using unobtrusive annotated comments. You can use all the standard markdown formatting, including images and links.

Comments are stored as markdown files in a directory or directories of your choice. You can
commit these to your source control or not as you see fit.

![Adding a note](https://i.imgur.com/5KGWEIs.gif)

## Usage

### Adding Notes

Move the cursor to some point in a file where you wish to add a notation line. Select
'Add Margin Note' from the command palette or from the context menu. This will add a commented
line that contains a notation reference and then open an editor
pane in which you can enter markdown for the note. When you are done save the document and the
editor will close automatically. Hover over the decorated note comment to see the rendered
markdown in a hover pane.

### Updating Notes

To update a note simply open the note file file in the notes folder (`.marginaila` by default) that
corresponds to the note. For example, if the note comment has ID `59b951d0-3e92-4ce4-a544-c2827e9101a6`,
then you would open the file `59b951d0-3e92-4ce4-a544-c2827e9101a6.md` in the notes folder.

When you save this file the editor pane will close automatically and your note will immediately update.

### Deleting Notes

Currently this is a manual process. To remove the notation from a file just delete the comment
line containing the notation reference. Then remove the corresponding file (the one with
the file name the same as the id in the notation comment) from the notes directory.

## Extension Settings

This extension contributes the following settings:

* `marginalia.noteFolder`: Specifies the folder to use for storing notes.
* `marginalia.markerPrefix`: Specifies the string to use as a prefix for margin note comment markers.

## Motivation

When performing archeology on a codebase I often come across sections of code that need clarification. I used to jot down notes in a notebook or text file when I came to a section of code that I didn't quite understand, but this meant my notes were separated from the code. Sure I can add clarifying comments to the code, but sometimes I don't want to clutter things up with long comments that might not be needed for everyone.

This extension provides the best of both worlds - notes are embedded in the code the way comments are, but with minimal impact. And you can utitlize all the power of markdown to add formatting, links, and charts to your notes.

## Known Issues

* A normal editor pane is used to enter the markdown for a note - editor panes are not modal, so
don't change focus to another editor pane when entering text or things may not work correctly.
* Adding notes is only supported for documents that support comments, i.e., program code.
* Adding notes is only supported when a folder is open, not a single file.
* When the editor is first launched, decorations for previous notes will not be shown until a new note is added or the command 'Display Margin Notes' is invoked.
