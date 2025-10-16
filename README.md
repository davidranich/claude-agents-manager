# Claude Agents Manager

# About

The project will act as a Claude Agent Manager. You will have the ability to update instructions with an intiutive WYSIWYG-like editor that will show a live preview as Rich Text, as well as the ability to launch the agent from the application (via Claude Code from the user's machine).

### Features

* The ability to select a specific directory to work with, such as `/.claude/agents`
  * There will be a side bar in the application that will show the directory and its contents, allowing for quick selection of file (the agent's .md file)
* A full WYSIWYG-like editor that allows for usage of Rich Text that converts into Markdown, with a display of the conversion
  * As well as Markdown -> Rich Text
* The ability to launch Claude Code within the application to run your agents from within

### Preferred Tech Stack

* Frontend: Vue 3 (using Composition Pattern), TailwindCSS
* Backend: Electron JS (node)