# Marginalia

A Visual Studio Code extension for adding embedded markdown notes to files.

## Features

Add markdown notes to your code using unobtrusive annotated comments. You can use all the standard markdown formatting, including images and links. 

Comments are stored as markdown files in a directory or directories of your choice. You can
commit these to your source control or not as you see fit.

For example if there is an image subfolder under your extension project workspace:

![Adding a note](https://i.imgur.com/bLHVZAR.gifv)

## Usage

### Adding Notes
Move the cursor to some point in a document where you wish to add a notation line. Select 
'Add Margin Note' from the command palette or from the context menu. This will add a commented 
line that contains a notation reference and then open an editor
pane in which you can enter markdown for the note. When you are done save the document and the
editor will close automatically. Hover over the decorated note comment to see the rendered
markdown in a hover pane.

## Deleting Notes
Currently this is a manual process. To remove the notation from a file just delete the comment
line containing the notation reference. Then remove the corresponding file (the one with
the file name the same as the id in the notation comment) from the notes directory.

## Extension Settings

This extension contributes the following settings:

* `marginalia.noteFolder`: Specifies the folder to use for storing notes.
* `marginalia.markerPrefix`: Specifies the string to use as a prefix for margin note comment markers.

## Known Issues

* An normal editor pane is used to enter the markdown for a note - editor panes are not modal, so 
don't change focus to another editor pane when entering text or things may not work correctly.
* Adding notes is only supported for documents that support comments, i.e., program code.
