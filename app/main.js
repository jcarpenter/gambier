'use strict';

var electron = require('electron');
var path = require('path');
var ElectronStore = require('electron-store');
var produce = require('immer');
var fsExtra = require('fs-extra');
var fs = require('fs');
var nonSecure = require('nanoid/non-secure');
require('colors');
var chroma = require('chroma-js');
require('deep-eql');
var Database = require('better-sqlite3');
var matter = require('gray-matter');
var convert = require('xml-js');
var CSL = require('citeproc');
var chokidar = require('chokidar');
var removeMd = require('remove-markdown');
var mime = require('mime-types');
var sizeOf = require('image-size');
var debounce = require('debounce');
var url = require('url');
require('os');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var ElectronStore__default = /*#__PURE__*/_interopDefaultLegacy(ElectronStore);
var produce__default = /*#__PURE__*/_interopDefaultLegacy(produce);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var chroma__default = /*#__PURE__*/_interopDefaultLegacy(chroma);
var Database__default = /*#__PURE__*/_interopDefaultLegacy(Database);
var matter__default = /*#__PURE__*/_interopDefaultLegacy(matter);
var convert__default = /*#__PURE__*/_interopDefaultLegacy(convert);
var CSL__default = /*#__PURE__*/_interopDefaultLegacy(CSL);
var chokidar__default = /*#__PURE__*/_interopDefaultLegacy(chokidar);
var removeMd__default = /*#__PURE__*/_interopDefaultLegacy(removeMd);
var mime__default = /*#__PURE__*/_interopDefaultLegacy(mime);
var sizeOf__default = /*#__PURE__*/_interopDefaultLegacy(sizeOf);
var url__default = /*#__PURE__*/_interopDefaultLegacy(url);

produce.enablePatches();

const update = (state, action, window) =>
  produce__default["default"](state, (draft) => {

    // Set a few useful, commonly-used variables
    const project = draft.projects.byId[window?.projectId];

    switch (action.type) {


      // ------------------------ APP-WIDE ------------------------ //

      case 'START_COLD_START': {

        // Update appStatus 
        draft.appStatus = 'coldStarting';

        // Set platform, if it's blank
        if (!draft.platform) {
          if (process.platform === 'darwin') {
            draft.platform = 'mac';
          } else if (process.platform === 'win32') {
            draft.platform = 'win';
          }
        }

        if (draft.projects.allIds.length) {
          draft.projects.allIds.forEach((id) => {

            const project = draft.projects.byId[id];

            // Delete existing projects that 1) are missing their directory, or 2) have an inaccessible directory
            const directoryIsMissing = !project.directory;
            const directoryIsInaccessible = !isDirectoryAccessible(project.directory);
            if (directoryIsMissing || directoryIsInaccessible) {
              delete draft.projects.byId[id];
            }

            // Set unsavedChanages on all panels to false
            // This shouldn't be necessary, when app is working normally, user is saving changes before closing, etc. Should only be needed when app crashes with unsaved changes. They're lost, unfortunately, so this should be false on next cold start.
            project.panels.forEach((p) => p.unsavedChanges = false);

            // Same as above...
            project.window.status = 'open';
          });

          // Update `allIds` to match `byId`
          draft.projects.allIds = Object.keys(draft.projects.byId);
        }

        // Set keyboard nav
        draft.system.keyboardNavEnabled = electron.systemPreferences.getUserDefault('AppleKeyboardUIMode', 'boolean');

        // If theme has not yet been defined, use the default (first one).
        if (!draft.theme.id) {
          draft.theme.id = draft.theme.installed[0].id;
        }

        // If there are no projects, create a new empty one.
        if (!draft.projects.allIds.length) {
          const id = nonSecure.nanoid();
          draft.projects.byId[id] = { ...newProject };
          draft.projects.allIds.push(id);
        }

        // Make sure preferences are closed
        draft.prefs.isOpen = false;

        // Reset cursor position histories
        // The first time each session that we open a doc, we want the 
        // cursor to start at the top.
        draft.cursorPositionHistory = {};

        break
      }

      case 'FINISH_COLD_START': {
        draft.appStatus = 'open';
        break
      }

      case 'START_TO_QUIT': {
        draft.appStatus = 'wantsToQuit';
        break
      }

      case 'CAN_SAFELY_QUIT': {
        draft.appStatus = 'safeToQuit';
        break
      }

      // FOCUSED/UNFOCUSED WINDOW

      case 'FOCUSED_WINDOW': {
        draft.focusedWindowId = window.projectId;
        break
      }

      case 'NO_WINDOW_FOCUSED': {
        draft.focusedWindowId = "";
        break
      }

      // PREFERENCES

      case 'OPEN_PREFERENCES': {
        draft.prefs.isOpen = true;
        break
      }

      case 'FOCUS_PREFERENCES_WINDOW': {
        const prefsWindow = electron.BrowserWindow.getAllWindows().find(({ projectId }) => projectId == 'preferences');
        prefsWindow.focus();
        // draft.focusedWindowId = 'preferences'
        break
      }

      case 'CLOSE_PREFERENCES': {
        draft.prefs.isOpen = false;
        break
      }

      // THEME

      case 'SAVE_SYSTEM_COLORS': {
        draft.systemColors = action.colors;
        break
      }

      case 'SET_THEME': {
        draft.theme.id = action.id;
        draft.theme.isDark = draft.theme.installed[action.id].isDark;
        break
      }

      case 'SET_DARK_MODE': {
        draft.darkMode = action.value;
        break
      }

      case 'SET_TABBABLES': {
        if (action.blockquote) draft.tabbables.blockquote = action.blockquote;
        if (action.citation) draft.tabbables.citation = action.citation;
        if (action.code) draft.tabbables.code = action.code;
        if (action.emphasis) draft.tabbables.emphasis = action.emphasis;
        if (action.fencedcodeblock) draft.tabbables.fencedcodeblock = action.fencedcodeblock;
        if (action.footnote) draft.tabbables.footnote = action.footnote;
        if (action.header) draft.tabbables.header = action.header;
        if (action.hr) draft.tabbables.hr = action.hr;
        if (action.image) draft.tabbables.image = action.image;
        if (action.link) draft.tabbables.link = action.link;
        if (action.list) draft.tabbables.list = action.list;
        if (action.math) draft.tabbables.math = action.math;
        if (action.strikethrough) draft.tabbables.strikethrough = action.strikethrough;
        if (action.strong) draft.tabbables.strong = action.strong;
        if (action.taskList) draft.tabbables.taskList = action.taskList;
        break
      }

      // SYSTEM VALUES
      // E.g. Keyboard navigation turned on...

      case 'SET_SYSTEM_VALUES': {
        draft.system = action.values;
        break
      }

      // CHROMIUM VALUES
      // E.g. Dark mode, high contrast mode, inverted colors...

      case 'SAVE_CHROMIUM_VALUES': {
        draft.chromium = action.values;
        break
      }

      // TYPOGRAPHY

      // Font size
      case 'SET_EDITOR_FONT_SIZE': {
        const { min, max } = draft.editorFont;
        if (action.value >= min && action.value <= max) {
          draft.editorFont.size = action.value;
        }
        break
      }

      case 'INCREASE_EDITOR_FONT_SIZE': {
        if (draft.editorFont.size < draft.editorFont.max) {
          draft.editorFont.size += draft.editorFont.increment;
        }
        break
      }

      case 'DECREASE_EDITOR_FONT_SIZE': {
        if (draft.editorFont.size > draft.editorFont.min) {
          draft.editorFont.size -= draft.editorFont.increment;
        }
        break
      }

      // Line height
      case 'SET_EDITOR_LINE_HEIGHT': {
        const { min, max } = draft.editorLineHeight;
        if (action.value >= min && action.value <= max) {
          draft.editorLineHeight.size = action.value;
        }
        break
      }

      case 'INCREASE_EDITOR_LINE_HEIGHT': {
        if (draft.editorLineHeight.size < draft.editorLineHeight.max) {
          let newSize = (draft.editorLineHeight.size * 10 + draft.editorLineHeight.increment * 10) / 10;
          draft.editorLineHeight.size = newSize;
        }
        break
      }

      case 'DECREASE_EDITOR_LINE_HEIGHT': {
        if (draft.editorLineHeight.size > draft.editorLineHeight.min) {
          let newSize = (draft.editorLineHeight.size * 10 - draft.editorLineHeight.increment * 10) / 10;
          draft.editorLineHeight.size = newSize;
        }
        break
      }

      // Max line width
      case 'SET_EDITOR_MAX_LINE_WIDTH': {
        const { min, max } = draft.editorMaxLineWidth;
        if (action.value >= min && action.value <= max) {
          draft.editorMaxLineWidth.size = action.value;
        }
        break
      }

      // DEVELOPER OPTIONS
      
      case 'SET_DEVELOPER_OPTIONS': {
        draft.developer = action.options;
        break
      }

      // MARKDOWN

      case 'SET_MARKDOWN_OPTIONS': {
        draft.markdown = action.options;
        break
      }



      // ------------------------ PROJECT-SPECIFIC ------------------------ //

      // CREATE, EDIT, REMOVE

      case 'CREATE_NEW_PROJECT': {
        const id = nonSecure.nanoid();
        draft.projects.byId[id] = { ...newProject };
        draft.projects.allIds.push(id);
        break
      }

      case 'REMOVE_PROJECT': {
        delete draft.projects.byId[window.projectId];
        draft.projects.allIds = Object.keys(draft.projects.byId);
        break
      }

      case 'SET_PROJECT_DIRECTORY': {
        // Do we have write permissions for the selected directory? If yes, proceed. 
        // Else, if current directory is valid, keep using it.
        // Else, set directory as blank.
        if (isDirectoryAccessible(action.directory)) {
          project.directory = action.directory;
        } else {
          if (isDirectoryAccessible(project.directory)) ; else {
            project.directory = "";
          }
        }

        // Reset panels
        project.focusedPanelIndex = 0;
        project.panels = [{ ...newPanel, id: nonSecure.nanoid() }];

        break
      }

      case 'PROJECT_FILES_MAPPED': {

        // If nothing is selected in the project yet, select
        // the first doc. Most likely to happen when user
        // specifies new project directory (e.g. first run).

        // Get the active sidebar tab.
        // If undefined, set to 'project'
        const activeSidebarTab = project.sidebar.tabsById[project.sidebar.activeTabId];
        if (activeSidebarTab == undefined) {
          project.sidebar.activeTabId == 'project';
          activeSidebarTab = project.sidebar.tabsById.project;
        }

        const nothingIsSelected = activeSidebarTab.selected.length == 0;
        const projectIsEmpty = !action.firstDocId;

        // If nothing is selected, try to select first doc in active sidebar.
        // Else, if project is empty, create new doc.
        if (nothingIsSelected && action.firstDocId) {

          // Load doc in panel
          project.panels[0].docId = action.firstDocId;

          // Select doc in the active project sidebar tab 
          activeSidebarTab.lastSelected = action.firstDocId;
          activeSidebarTab.selected = [action.firstDocId];

        } else if (projectIsEmpty) {

          project.panels[0].docId = 'newDoc';

        }
        break
      }

      case 'PROJECT_FILES_UPDATED': {
        // Called whenever a Watcher instance catches a change
        // and updates files (note: does not fire when a directory)
        // is added or removed.

        // See if project panels are effected
        project.panels.forEach((panel) => {

          // Get watcher
          const watcher = global.watchers.find((w) => {
            return w.id == window.projectId
          });

          // If panel is waiting for a new file, 
          // check files from watcher to see if it exists yet.
          // If yes, set `panel.docId` to the file's id.
          // This will load it in the editor.
          if (panel.status == 'justSavedAsAndWaitingToLoadTheNewFile') {
            const newDocId = watcher.files.allIds.find((id) => {
              const file = watcher.files.byId[id];
              return file.path == panel.pendingFilePathToLoad
            });
            if (newDocId) {
              panel.docId = newDocId;
              panel.status = '';
              delete panel.pendingFilePathToLoad;

              // Select doc in sidebar
              const activeTab = project.sidebar.tabsById[project.sidebar.activeTabId];
              activeTab.selected = [newDocId];
            }
          } else {

            // Else, check if panel's file was deleted.
            // If yes, show an empty doc.
            const panelFileWasDeleted = !watcher.files.allIds.includes(panel.docId);
            if (panelFileWasDeleted) {
              panel.docId = 'newDoc';
              panel.unsavedChanges = false;
            }
          }
        });

        // Are any of the project panels waiting for a file?
        const aPanelIsWaitingForAFile = project.panels.some((p) => {
          return p.status == 'justSavedAsAndWaitingToLoadTheNewFile'
        });

        // If yes, check if the file exists yet
        if (aPanelIsWaitingForAFile) {

          // Get watcher
          const watcher = global.watchers.find((w) => {
            return w.id == window.projectId
          });

          // For each panel that is waiting for a new file, 
          // check files from watcher to see if it exists yet.
          // If yes, `panel.docId` to the file's id.
          // This will load it in the editor.
          project.panels.forEach((panel) => {
            if (panel.status == 'justSavedAsAndWaitingToLoadTheNewFile') {
              const newDocId = watcher.files.allIds.find((id) => {
                const file = watcher.files.byId[id];
                return file.path == panel.pendingFilePathToLoad
              });
              if (newDocId) {
                panel.docId = newDocId;
                panel.status = '';
                delete panel.pendingFilePathToLoad;

                // Select doc in sidebar
                const activeTab = project.sidebar.tabsById[project.sidebar.activeTabId];
                activeTab.selected = [newDocId];
              }
            }
          });
        }


        break
      }

      // PROJECT WINDOW

      case 'OPENED_PROJECT_WINDOW': {
        // Update window status
        project.window.status = 'open';
        break
      }

      // If window is already safe to close, do it
      // Else, start to close window by setting 'wantsToClose'
      // Editor instances in the window catch this store change
      // and if the have unsaved changes, save them.
      // As each save is mode, 'SAVE_DOC_SUCCESS' is dispatched
      // If app wants

      case 'START_TO_CLOSE_PROJECT_WINDOW': {
        const allPanelsAreSafeToClose = project.panels.every((p) => !p.unsavedChanges);
        if (allPanelsAreSafeToClose) {
          // Close the window by setting 'safeToClose'. 
          // ProjectManager catches this, and closes the window.
          project.window.status = 'safeToClose';
        } else {
          // Start closing the window
          project.window.status = 'wantsToClose';
        }
        break
      }

      // case 'CAN_SAFELY_CLOSE_PROJECT_WINDOW': {

      //   project.window.status = 'safeToClose'

      //   // Every time a window marks itself 'safeToClose', check if the app is quitting. If true, check if all windows are 'safeToClose' yet. If true, we can safely quit the app.

      //   if (draft.appStatus == 'wantsToQuit') {

      //     const allWindowsAreSafeToClose = draft.projects.allIds.every((id) => {
      //       const windowStatus = draft.projects.byId[id].window.status
      //       return windowStatus == 'safeToClose'
      //     })

      //     if (allWindowsAreSafeToClose) {
      //       draft.appStatus = 'canSafelyQuit'
      //     }
      //   }

      //   break
      // }

      // Save window bounds to state, so we can restore later
      case 'SAVE_PROJECT_WINDOW_BOUNDS': {
        project.window.bounds = action.windowBounds;
        break
      }

      case 'PROJECT_WINDOW_DRAG_OVER': {
        project.window.isDraggedOver = true;
        break
      }

      case 'PROJECT_WINDOW_DRAG_LEAVE': {
        project.window.isDraggedOver = false;
        break
      }

      case 'SET_LAYOUT_FOCUS': {
        project.focusedSectionId = action.section;
        break
      }

      // case 'SET_DRAGGED_FILE': {
      //   project.draggedFileId = action.id
      //   break
      // }

      // SIDEBAR

      case 'SIDEBAR_SET_OPEN_CLOSED': {
        project.sidebar.isOpen = action.value;
        break
      }

      case 'SELECT_SIDEBAR_TAB_BY_ID': {
        project.sidebar.activeTabId = action.id;
        project.focusedSectionId = 'sidebar';
        // Make sure sidebar is open
        project.sidebar.isOpen = true;
        break
      }

      case 'SIDEBAR_SET_WIDTH': {
        project.sidebar.width = action.value;
        break
      }

      case 'SIDEBAR_SHOW_SEARCH_TAB': {

        // Make sure sidebar is open, and focus it.
        project.sidebar.isOpen = true;
        project.focusedSectionId = 'sidebar';
        
        // Select search tab
        project.sidebar.activeTabId = 'search';

        // Select the correct input (search or replace), 
        // if user has specified `action.inputToFocus` value.
        if (action.inputToFocus !== undefined) {
          const searchTab = project.sidebar.tabsById.search;
          
          // `inputToFocus` will equal "search", "replace" or undefined.
          searchTab.inputToFocusOnOpen = action.inputToFocus;

          // Set search input value, if user has specified
          if (action.queryValue) searchTab.queryValue = action.queryValue;

          // Make sure Replace expandable is open
          if (action.inputToFocus == 'replace') {
            searchTab.replace.isOpen = true;
          }
        }

        break
      }

      case 'SAVE_SEARCH_QUERY_VALUE': {
        project.sidebar.tabsById.search.queryValue = action.value;
        break
      }

      case 'SIDEBAR_SET_SORTING': {
        const tab = project.sidebar.tabsById[action.tabId];
        if (tab.sortBy) {
          tab.sortBy = action.sortBy;
        }
        if (tab.sortOrder) {
          tab.sortOrder = action.sortOrder;
        }
        break
      }

      case 'SIDEBAR_SET_EXPANDED': {
        const tab = project.sidebar.tabsById[action.tabId];
        tab.expanded = action.expanded;
        break
      }

      case 'SIDEBAR_SET_SELECTED': {
        const tab = project.sidebar.tabsById[action.tabId];
        tab.lastSelected = action.lastSelected;
        tab.selected = action.selected;
        break
      }

      case 'SIDEBAR_SELECT_TAGS': {
        // Switch to Tags tab, if we're not already viewing it
        project.sidebar.activeTabId = 'tags';
        // Set tags to `tags` argument. 
        // Should be an array of strings, eg: ["climate", "water"]
        project.sidebar.tabsById.tags.selectedTags = action.tags;
        break
      }

      case 'SIDEBAR_SET_SEARCH_OPTIONS': {
        const tab = project.sidebar.tabsById.search;
        tab.options = action.options;
        break
      }

      case 'SIDEBAR_TOGGLE_EXPANDABLE': {
        const tab = project.sidebar.tabsById[action.tabId];
        tab[action.expandable].isOpen = !tab[action.expandable].isOpen;
        break
      }

      case 'TOGGLE_SIDEBAR_PREVIEW': {
        project.sidebar.isPreviewOpen = !project.sidebar.isPreviewOpen;
        break
      }

      // PANEL

      case 'CREATE_NEW_DOC': {
        // Tell the focused panel to load a new (empty) doc 
        const panel = project.panels[project.focusedPanelIndex];
        panel.docId = 'newDoc';
        // Focus the editor
        project.focusedSectionId = 'editor';
      // Deselect everything in active sidebar tab
        const activeTab = project.sidebar.tabsById[project.sidebar.activeTabId];
        activeTab.selected = [];
        break
      }

      case 'OPEN_NEW_DOC_IN_PANEL': {

        const panel = project.panels[action.panelIndex];

        const isSafeToCreateNewDoc = action.saveOutcome.equalsAny("noUnsavedChanges", "saved", "dontSave");

        if (isSafeToCreateNewDoc) {
          panel.docId = 'newDoc';
          panel.unsavedChanges = false;
        }

        break
      }

      case 'OPEN_DOC_IN_PANEL': {

        const panel = project.panels[action.panelIndex];

        const canOpenDoc =
          action.saveOutcome == "noUnsavedChanges" ||
          action.saveOutcome == "saved" ||
          action.saveOutcome == "dontSave";

        // If we can open the doc, do so. Else, do nothing. 
        if (canOpenDoc) {
          // Open doc
          panel.docId = action.doc.id;
          panel.unsavedChanges = false;
          // Select doc in sidebar 
          if (action.selectInSideBar) {
            const tab = project.sidebar.tabsById[project.sidebar.activeTabId];
            tab.lastSelected = action.doc.id;
            tab.selected = [action.doc.id];
          }
        }

        break
      }

      case 'OPEN_NEW_PANEL': {

        // Insert new panel at specified index
        project.panels.splice(action.panelIndex, 0, {
          ...newPanel,
          id: nonSecure.nanoid(),
          docId: action.docId,
        });

        // Update panel indexes
        project.panels.forEach((p, i) => p.index = i);

        // Focus new panel
        project.focusedPanelIndex = action.panelIndex;

        // Set all panels equal width
        const panelWidth = (100 / project.panels.length).toFixed(1);
        project.panels.forEach((p) => p.width = panelWidth);

        break
      }

      case 'MOVE_PANEL': {

        // Delete the panel from it's current position.
        // Splice returns the moved panel's array item.
        const movedPanel = project.panels.splice(action.fromIndex, 1);

        // Move the item to its new position
        project.panels.splice(action.toIndex, 0, movedPanel[0]);

        // Update panel indexes
        project.panels.forEach((p, i) => p.index = i);

        // Focus the panel  
        project.focusedPanelIndex = action.toIndex;

        break
      }

      case 'CLOSE_PANEL': {

        const canClosePanel =
          action.saveOutcome == "noUnsavedChanges" ||
          action.saveOutcome == "saved" ||
          action.saveOutcome == "dontSave";

        // If it's safe to close the panel, do so. 
        // Else, do nothing. 
        if (canClosePanel) {
          closePanel(project, action.panelIndex);
        }

        break
      }

      case 'SAVE_PANEL_CHANGES_SO_WE_CAN_CLOSE_WINDOW': {

        const panel = project.panels[action.panelIndex];

        const panelChangesAreSaved =
          action.saveOutcome == 'noUnsavedChanges' ||
          action.saveOutcome == 'saved' ||
          action.saveOutcome == 'dontSave';

        // If there are no unsaved changes in any panels,
        // mark the window `safeToClose`.
        // Else, if the user cancelled a save flow.
        // cancel the window closing.
        if (panelChangesAreSaved && project.window.status == 'wantsToClose') {

          panel.unsavedChanges = false;

          const allPanelsHaveSaved = project.panels.every((p) => !p.unsavedChanges);
          if (allPanelsHaveSaved) {
            project.window.status = 'safeToClose';
          }

        } else if (action.saveOutcome == 'cancelled' && project.window.status == 'wantsToClose') {

          // Cancel window closing
          project.window.status = 'open';

          // Cancel app quitting (if it's in progress)
          if (draft.appStatus == 'wantsToQuit') {
            draft.appStatus = 'open';
          }

        }

        break
      }

      case 'SET_PANEL_WIDTHS': {
        project.panels.forEach((panel, i) => panel.width = action.widths[i]);
        break
      }

      case 'FOCUS_PANEL': {
        project.focusedPanelIndex = action.panelIndex;
        const panel = project.panels[action.panelIndex];
        // Select the file in the sidebar
        const activeSideBarTab = project.sidebar.tabsById[project.sidebar.activeTabId];
        activeSideBarTab.lastSelected = panel.docId;
        activeSideBarTab.selected = [panel.docId];
        break
      }

      // EDITING

      case 'SET_SOURCE_MODE': {
        draft.sourceMode = action.enabled;
        break
      }

      case 'SET_FRONT_MATTER_COLLAPSED': {
        draft.frontMatterCollapsed = action.value;
        break
      }

      case 'SET_UNSAVED_CHANGES': {
        const panel = project.panels[action.panelIndex];
        panel.unsavedChanges = action.value;
        break
      }

      case 'SAVE_DOC': {
        const panel = project.panels[action.panelIndex];
        if (action.saveOutcome == 'saved') {
          panel.unsavedChanges = false;
        }
        break
      }

      case 'SAVE_DOC_AS': {
        const panel = project.panels[action.panelIndex];

        // If saved successfully, set unsavedChanges false,
        // and tell panel to load the new file.
        if (action.saveOutcome == 'saved') {
          panel.unsavedChanges = false;
          panel.status = 'justSavedAsAndWaitingToLoadTheNewFile';
          panel.pendingFilePathToLoad = action.saveToPath;
        }

        break
      }

      case 'SAVE_CURSOR_POSITION': {
        draft.cursorPositionHistory[action.docId] = {
          line: action.line,
          ch: action.ch
        };
        break
      }

      // WIZARD

      case 'TOGGLE_WIZARD_OPTIONAL_LINK_FIELDS': {
        draft.wizard.showOptionalLinkFields = action.value;
        break
      }

      case 'TOGGLE_WIZARD_OPTIONAL_IMAGE_FIELDS': {
        draft.wizard.showOptionalImageFields = action.value;
        break
      }

      // LIGHTBOX

      case 'OPEN_LIGHTBOX': {
        draft.lightbox.open = true;
        draft.lightbox.selectedIndex = action.selectedIndex;
        draft.lightbox.images = action.images;
        break
      }

      case 'CLOSE_LIGHTBOX': {
        draft.lightbox.open = false;
        draft.lightbox.selectedIndex = 0;
        draft.lightbox.images = [];
        break
      }

      case 'LIGHTBOX_PREV': {
        draft.lightbox.selectedIndex -= 1;
        break
      }
      
      case 'LIGHTBOX_NEXT': {
        draft.lightbox.selectedIndex += 1;
        break
      }

    }
  }, (patches) => {
    // Update `global.patches`
    global.patches = patches;
  }
  );

/**
 * Remove panel from the `panels` index of the selected project.
 * Then update index of other panels as needed.
 */
function closePanel(project, panelIndex) {
  project.panels.splice(panelIndex, 1);

  // Set all panels to equal percentage of total
  const panelWidth = (100 / project.panels.length).toFixed(1);
  project.panels.forEach((p) => p.width = panelWidth);

  // Update focusedPanel:
  // If there is only one panel left, focus it. Else...
  // * If it was to LEFT of the closed panel, the value is unchanged.
  // * If it WAS closed the closed panel, the value is unchanged (this will focus the adjacent panel).
  // * ...unless it was the panel furthest right, in which case we focus the new last panel.
  // * If it was to RIGHT of the closed panel, decrement the value by one.

  if (project.panels.length == 1) {
    project.focusedPanelIndex = 0;
  } else {
    const closedPanelWasLeftOfFocusedPanel = panelIndex < project.focusedPanelIndex;
    const closedPanelWasFocusedAndFurthestRight = panelIndex == project.focusedPanelIndex && panelIndex == project.panels.length;

    if (closedPanelWasLeftOfFocusedPanel) {
      project.focusedPanelIndex = project.focusedPanelIndex - 1;
    } else if (closedPanelWasFocusedAndFurthestRight) {
      project.focusedPanelIndex = project.panels.length - 1;
    }
  }

  // Update panel indexes
  project.panels.forEach((p, i) => p.index = i);
}

/**
 * Check that directory exists, and we can write to it.
 * @param {} directory - System path to check
 */
function isDirectoryAccessible(directory) {
  try {
    fsExtra.accessSync(directory, fs__default["default"].constants.W_OK);
    return true
  } catch (err) {
    return false
  }
}

class Store extends ElectronStore__default["default"] {
  constructor() {
    // Note: `super` lets us access and call functions on object's parent (MDN)
    // We pass in our config options for electron-store
    // Per: https://github.com/sindresorhus/electron-store#options
    super({
      name: "store",
      defaults: storeDefault
      // schema: StoreSchema
    });
  }

  async dispatch(action, window = undefined) {

    if (!electron.app.isPackaged) logTheAction(action);

    // Get next state. 
    // `update` function also updates `global.patches`.
    const nextState = update(store.store, action, window);

    // Apply next state to Store
    this.set(nextState);

    // Send patches to render proces
    const windows = electron.BrowserWindow.getAllWindows();
    if (windows.length) {
      windows.forEach((win) => win.webContents.send('statePatchesFromMain', global.patches));
    }
  }
}

function logTheAction(action) {
  console.log(
    // `Action:`.bgBrightGreen.black,
    `${action.type}`.bgBrightGreen.black.bold,
    // `(Store.js)`.green
  );
}

const storeDefault = {

  // ----------- APP ----------- //

  platform: '', // 'mac' or 'windows'

  appStatus: 'open',

  darkMode: 'match-system',

  theme: {
    id: 'warm',
    isDark: false,
    installed: {
      "warm": { name: "Warm", isDark: false },
      "cupertino-dark": { name: "Cupertino Dark", isDark: true },
      "dracula": { name: "Dracula", isDark: true }
    }
  },

  // Array of system colors. E.g.
  // accentColor: "#007aff"
  systemColors: {
  },

  developer: {
    showGrid: false
  },

  editorFont: {
    default: 15,
    size: 15,
    min: 12,
    max: 18,
    increment: 1
  },

  editorLineHeight: {
    default: 1.6,
    size: 1.6,
    min: 1.2,
    max: 2.0,
    increment: 0.1,
  },

  editorMaxLineWidth: {
    default: 38,
    size: 38,
    min: 30,
    max: 50,
    increment: 2,
  },

  system: {
    // macos: We check using `systemPreferences.getUserDefault(AppleKeyboardUIMode, integer)`
    keyboardNavEnabled: false
  },

  chromium: {
    themeSource: 'system',
    isDarkMode: false,
    isHighContrast: false,
    isInverted: false,
    isReducedMotion: false,
  },

  lightbox: {
    open: false,
    selectedIndex: 0,
    images: []
  },

  wizard: {
    showOptionalLinkFields: false,
    showOptionalImageFields: false
  },

  sourceMode: false,

  frontMatterCollapsed: false,

  focusedWindowId: 0,

  prefs: {
    isOpen: false
  },

  timing: {
    treeListFolder: 300,
  },

  markdown: {
    implicitFigures: true,
    emoji: true,
    strikethrough: true,
    taskLists: true,
    fencedCodeBlockHighlighting: false,
    allowAtxHeaderWithoutSpace: false,
    ulMarkerChar: '*',
    strongChar: '**',
    emphasisChar: '_'
  },

  // When tabbing through document, we can control which elements are tabbable
  tabbables: {
    blockquote: false,
    citation: true,
    code: false,
    emphasis: false,
    fencedcodeblock: false,
    footnote: true,
    // frontmatter: false // TODO
    header: false,
    hr: false,
    image: true,
    link: true,
    list: false,
    math: false,
    strikethrough: false,
    strong: false,
    taskList: false,
  },

  // Set of objects where key is doc id, and cursor position is 
  // recorded in `line` and `ch` properties.
  cursorPositionHistory: {},

  // ----------- PROJECTS ----------- //

  projects: {
    allIds: [],
    byId: {}
  }

  // projects: []

};

const newPanel = {
  status: '', // E.g. 'userWantsToLoadDoc'
  index: 0,
  id: '', // Generate with nanoid
  docId: '',
  width: '100', // Percentage
  unsavedChanges: false
};

const newProject = {

  // Used to associate windows with projects. Generated by nanoid.
  // id: '',

  window: {
    // Used to associate windows with projects
    id: 0,
    // Used when closing window (to check if it's safe to do so or not)
    status: 'new',
    isDraggedOver: false,
    bounds: { x: 0, y: 0, width: 1600, height: 1200 }
  },

  // User specified directory to folder containing their project files
  directory: '',

  // User specified path to CSL-JSON file containing their citatons
  citations: '',

  focusedSectionId: 'sidebar',

  // Index of focused panel
  focusedPanelIndex: 0,

  // draggedFileId: '',

  // A copy of the object of the document currently visible in the editor.
  // TODO: Is made obsolete by switch to panels. Remove.
  openDoc: {},

  // List of the open panels
  // See `newPanel` for template
  panels: [],

  // SideBar
  sidebar: {
    isOpen: true,
    isPreviewOpen: true,
    activeTabId: 'project',
    width: 250,
    defaultWidth: 250,
    tabsById: {
      project: {
        title: 'Project',
        lastSelected: {}, // id
        selected: [], // Array of ids
        expanded: [], // Array of folder ids
        sortBy: 'By Title',
        sortOrder: 'Ascending'
      },
      allDocs: {
        title: 'All Documents',
        lastSelected: {},
        selected: [],
        sortBy: 'By Title',
        sortOrder: 'Ascending'
      },
      mostRecent: {
        title: 'Most Recent',
        lastSelected: {},
        selected: [],
        sortBy: 'By Title',
        sortOrder: 'Ascending'
      },
      tags: {
        title: 'Tags',
        lastSelected: {},
        selected: [],
        sortBy: 'By Title',
        sortOrder: 'Ascending',
        selectedTags: []
      },
      media: {
        title: 'Media',
        lastSelected: {},
        selected: [],
        sortBy: 'By Name',
        sortOrder: 'Ascending'
      },
      // citations: {
      //   title: 'Citations',
      //   lastSelected: {},
      //   selected: [],
      // },
      search: {
        title: 'Search',
        lastSelected: {},
        selected: [],
        queryValue: '',
        inputToFocusOnOpen: 'search',
        options: {
          isOpen: false,
          matchCase: false,
          matchExactPhrase: false,
          lookIn: '*',
          tags: []
        },
        replace: {
          isOpen: false,
        }
      }
    },
    tabsAll: ['project', 'allDocs', 'mostRecent', 'tags', 'media', 'search']
    // tabsAll: ['project', 'allDocs', 'mostRecent', 'tags', 'media', 'citations', 'search']
  }
};

// import path from 'path'
// import mime from 'mime-types'


/* -------------------------------------------------------------------------- */
/*                            PROTOTYPE EXTENSIONS                            */
/* -------------------------------------------------------------------------- */

/**
 * Return true if array has ALL of the items
 * @param  {...any} items - One or more strings
 */
Array.prototype.hasAll = function (...items) {
  return items.every((i) => this.includes(i))
};

/**
 * Return true if array has ANY of the items
 * @param  {...any} items - One or more strings
 */
Array.prototype.hasAny = function (...items) {
  return items.some((i) => this.includes(i))
};

/**
 * Return true if string includes any of the items.
 * E.g. Returns true if item is `-span` and string is `text-span`
 * @param  {...any} items - One or more strings
 */
String.prototype.includesAny = function (...items) {
  return items.some((i) => this.includes(i))
};

/**
 * Return true if string includes ALL of the items.
 * E.g. Returns true if string is "reference-full" and items
 * are "reference" and "full"
 * @param  {...any} items - One or more strings
 */
String.prototype.includesAll = function (...items) {
  return items.every((i) => this.includes(i))
};

/**
 * Return true if string equals any of the items.
 * E.g. Returns true if item is `hello` and string is `hello`
 * @param  {...any} items - One or more strings
 */
String.prototype.equalsAny = function (...items) {
  return items.some((i) => i === this)
};

/**
 * Return first character of string
 */
String.prototype.firstChar = function () {
  return this.charAt(0)
};

/**
 * Return last character of string
 */
String.prototype.lastChar = function () {
  return this.charAt(this.length - 1)
};

/**
 * Round a number to two decimal places
 * From: https://www.delftstack.com/howto/javascript/javascript-round-to-2-decimal-places/
 */
Number.prototype.roundToTwo = function () {
  return +(Math.round(this + "e+2") + "e-2")
};

/**
 * Get the diff between two arrays
 * For [1, 2, 3] and [1, 2], it will return [3]
 * From: https://stackoverflow.com/a/33034768
 */
function getArrayDiff(arr1, arr2) {
  return arr1.filter(x => !arr2.includes(x));
}

/**
 * Wrap setTimeout in a promise so we can use with async/await. 
 * Use like: `await wait(1000);`
 * @param {*} ms 
 */
async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function findInTree(tree, value, key = 'id', reverse = false) {
  const stack = [tree[0]];
  while (stack.length) {
    const node = stack[reverse ? 'pop' : 'shift']();
    if (node[key] === value) return node
    node.children && stack.push(...node.children);
  }
  return null
}


/* -------------------------------------------------------------------------- */
/*                                CHECK FORMAT                                */
/* -------------------------------------------------------------------------- */

const formats = {
  document: ['.md', '.markdown'],
  image: ['.apng', '.bmp', '.gif', '.jpg', '.jpeg', '.jfif', '.pjpeg', '.pjp', '.png', '.svg', '.tif', '.tiff', '.webp'],
  av: ['.flac', '.mp4', '.m4a', '.mp3', '.ogv', '.ogm', '.ogg', '.oga', '.opus', '.webm'],

  // Video containers (file types)
  // If a container supports both audio and video (e.g. WebM), we categorize as video,
  // since <video> also works for audio, but <audio> does not work for video.
  // See: https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Containers#index_of_media_container_formats_file_types
  // video: [

  //   // Mp4
  //   // Supported by Chrome? - Y
  //   '.mp4', 

  //   // WebM
  //   // Supported by Chrome? - Y
  //   '.webm',

  //   // Ogg
  //   // Supported by Chrome? - Y
  //   '.ogg',

  //   // QuickTime
  //   // Supported by Chrome? - N
  //   '.mov',

  //   // The OGM file format is a compressed video container file format. The files can contain streams of audio and video data as well as text and metadata. OGM files use the Ogg Vorbis compression technology and contain audio and video stream files that can be played on a user's computer.
  //   '.ogm', 

  //   // An OGV file is a video file saved in the Xiph.Org open source Ogg container format. It contains video streams that may use one or more different codecs, such as Theora, Dirac, or Daala.
  //   '.ogv',

  //   // The 3GP or 3GPP media container is used to encapsulate audio and/or video that is specifically intended for transmission over cellular networks for consumption on mobile devices.
  //   '.3gp'
  // ],

  // audio: [

  //   // "The Free Lossless Audio Codec (FLAC) is a lossless audio codec; there is also an associated simple container format, also called FLAC, that can contain this audio."
  //   // https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Containers#flac
  //   '.flac', 

  //   // M4A is a file extension for an audio file encoded with advanced audio coding (AAC) which is a lossy compression. M4A was generally intended as the successor to MP3, which had not been originally designed for audio only but was layer III in an MPEG 1 or 2 video files. M4A stands for MPEG 4 Audio.
  //   '.m4a', 

  //   // Mp4s are MPEG files that contain Layer_III/MP3 sound data.
  //   '.mp3', 
  //   ''
  // ]
};

/**
 * Return true if `string` is URL and protocol is http or https.
 * Uses browser `URL` interface.
 * @param {*} string - url to text
 */
function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

/**
 * Return true if file extension is among valid doc formats.
 */
function isDoc(extension) {
  return formats.document.includes(extension)
}

/**
 * Return true if Content-Type of file is 
 */
function isMedia(extension) {

  // Return false if json. Helps prevent error from mime package.
  // if (filepath.includesAny('.DS_Store', '.json')) return false

  // const contentType = mime.lookup(filepath)

  // return contentType.includesAny('video', 'audio', 'image')

  const isImage = formats.image.includes(extension);
  const isAV = formats.av.includes(extension);
  return isImage || isAV
}

/**
 * Return media type ('img' or 'av'), based on file extension.
 */
function getMediaType(extension) {
  const isImage = formats.image.includes(extension);
  const isAV = formats.av.includes(extension);
  if (isImage) {
    return 'img'
  } else if (isAV) {
    return 'av'
  } else {
    console.error('File extension does not match supported media types');
  }
}


/* -------------------------------------------------------------------------- */
/*                               COMPARE PATCHES                              */
/* -------------------------------------------------------------------------- */

/**
 * Check if state property has changed by comparing Immer patches. And (optionally) if property now equals a specified value. For each patch, check if `path` array contains specified `props`, and if `value` value equals specified `toValue`.
 * @param {*} props - Either a string, or an array (for more precision).
 * @param {*} [toValue] - Optional value to check prop against
 */
function stateHasChanged(patches, props, toValue = '') {
  return patches.some((patch) => {

    const pathAsString = patch.path.toString();
    const checkMultipleProps = Array.isArray(props);

    const hasChanged = checkMultipleProps ?
      props.every((key) => pathAsString.includes(key)) :
      pathAsString.includes(props);

    // If optional 'toValue' argument is specified, check it.
    // Else, only check `hasChanged`
    if (toValue) {
      const equalsValue = patch.value == toValue;
      return hasChanged && equalsValue
    } else {
      return hasChanged
    }
  })
}

/**
 * Check if an object property has changed to a specific value,
 * by comparing old and new versions of the object.
 * @param {*} keysAsString 
 * @param {*} value 
 * @param {*} objTo 
 * @param {*} objFrom 
 */
function propHasChangedTo(keysAsString, value, objTo, objFrom) {
  if (!keysAsString || !value) {
    // If either required arguments are missing or empty, return undefined
    return undefined
  } else {
    const keys = extractKeysFromString(keysAsString);
    const objToVal = getNestedObject(objTo, keys);
    const objFromVal = getNestedObject(objFrom, keys);
    if (typeof objToVal == 'object' || typeof objFromVal == 'object') {
      // If either value is an object, return undefined.
      // For now, we don't allow checking against objects.
      return undefined
    } else if (objToVal === objFromVal) {
      // If no change, return false
      return false
    } else {
      // Else, check if objTo equals value
      return objToVal === value
    }
  }
}

/**
 * Utility function for `propHasChangedTo`. 
 * Convert propAddress string to array of keys.
 * Before: "projects[5].window"
 * After: ["projects", 5, "window"]
 * @param {*} keyAsString 
 */
function extractKeysFromString(keyAsString) {
  const regex = /[^\.\[\]]+?(?=\.|\[|\]|$)/g;
  const keys = keyAsString.match(regex);
  if (keys && keys.length) {
    keys.forEach((p, index, thisArray) => {
      // Find strings that are just integers, and convert to integers
      if (/\d/.test(p)) {
        thisArray[index] = parseInt(p, 10);
      }
    });
  }
  return keys
}

/**
 * Utility function for ``propHasChangedTo``. 
 * @param {*} nestedObj 
 * @param {*} pathArr 
 */
const getNestedObject = (nestedObj, pathArr) => {
  return pathArr.reduce((obj, key) =>
    (obj && obj[key] !== 'undefined') ? obj[key] : undefined, nestedObj);
};

process.platform == 'darwin';
process.platform == 'win32';

/**
 * User changes value in OS (e.g. accent color)
 * Or we manually set value (e.g. dark mode)
 * Could be dark mode, accent color, etc.
 * Native theme updates.
 * 
 * 
 */

/**
 * Setup listeners and get initial values.
 */
function init$4() {

  // When user changes theme, update chromium dark mode to match
  global.store.onDidAnyChange((state, oldState) => {
    
    const hasThemeChanged = stateHasChanged(global.patches, "theme");
    if (hasThemeChanged) setChromiumDarkMode(false);
    
    // When user makes changes to View > Dark Mode option, set the 
    // `nativeTheme.themeSource` value on Chromium to match.
    // const darkModeChanged = stateHasChanged(global.patches, "darkMode")
    // if (darkModeChanged) setNativeTheme(false)
  });

  // When nativeTheme changes for any reason, save updated 
  // chromium and system color values to store.
  // Can be triggered by either user app interaction or the OS:
  // 1) App: User changes theme and we set `nativeTheme.themeSource` to match.
  // 2) OS: User turns on OS high contrast accessibility option.
  electron.nativeTheme.on('updated', () => {
    saveChromiumValues();
    saveSystemColors();
  });


  // Set initial Chromium dark mode value, per theme
  setChromiumDarkMode(true);
}


/**
 * When user changes theme, update chromium dark mode to match
 * @param {boolean} isFirstRun 
 */
function setChromiumDarkMode(isFirstRun) {

  electron.nativeTheme.themeSource = global.state().theme.isDark ? 'dark' : 'light';

  if (!isFirstRun) {
    // If dev tools is open, reload (close then open) to force it to load the new theme. Unfortunately it doesn't do so automatically, in either Electron or Chrome.
    const win = electron.BrowserWindow.getFocusedWindow();
    const devToolsIsOpen = !electron.app.isPackaged && win?.webContents?.isDevToolsOpened();
    if (devToolsIsOpen) {
      win.webContents.closeDevTools();
      win.webContents.openDevTools();
    }
  }
}

/**
 * Save Chromium appearance-related values to store.
 */
 function saveChromiumValues() {
  store.dispatch({
    type: 'SAVE_CHROMIUM_VALUES',
    values: {
      themeSource: electron.nativeTheme.themeSource,
      isDarkMode: electron.nativeTheme.shouldUseDarkColors,
      isHighContrast: electron.nativeTheme.shouldUseHighContrastColors,
      isInverted: electron.nativeTheme.shouldUseInvertedColorScheme,
      isReducedMotion: electron.systemPreferences.getAnimationSettings().prefersReducedMotion
    }
  });
}


/**
 * Save system colors to store.
 */
 async function saveSystemColors() {
  
  const accentColor = chroma__default["default"](electron.systemPreferences.getAccentColor()).hex();
  let accentColor_h = chroma__default["default"](accentColor).get("hsl.h").roundToTwo(); 
  const accentColor_s = (chroma__default["default"](accentColor).get("hsl.s") * 100).roundToTwo().toString() + "%";
  const accentColor_l = (chroma__default["default"](accentColor).get("hsl.l") * 100).roundToTwo().toString() + "%";
  
  // Annoyingly, Chroma sets 0 hue values to NaN.
  // so we have to manually correct them to zero.
  if (!accentColor_h) accentColor_H = 0; 

  let systemColors = {
    accentColor,
    accentColor_h,
    accentColor_s,
    accentColor_l,
    ...getSystemColors()
  };


  await global.store.dispatch({ 
    type: 'SAVE_SYSTEM_COLORS', 
    colors: systemColors
  });
}


/**
 * Return macOS system colors.
 * TODO: Dynamically get these once this electron issue is fixed:
 * https://github.com/electron/electron/issues/26628
 * For now we have to hard code these values.
 * NOTE: Commented-out values are unused, so we comment them
 * to keep them from cluttering our CSS variables.
 * @returns Object with system colors
 */
function getSystemColors() {
  
  if (global.state().theme.isDark) {
    return {
      // alternateSelectedControlTextColor: '#FFFFFFFF',
      // findHighlightColor: '#FFFF00FF',
      // highlightColor: '#B4B4B4FF',
      // linkColor: '#419CFFFF',
      // selectedTextColor: '#FFFFFFFF',
      // textBackgroundColor: '#1E1E1EFF',
      // unemphasizedSelectedContentBackgroundColor: '#464646FF',
      // unemphasizedSelectedTextBackgroundColor: '#464646FF',
      // unemphasizedSelectedTextColor: '#FFFFFFFF',
      // windowFrameTextColor: '#FFFFFFD8',
      controlBackgroundColor: '#1E1E1EFF',
      controlColor: '#FFFFFF3F',
      controlTextColor: '#FFFFFFD8',
      disabledControlTextColor: '#FFFFFF3F',
      gridColor: '#FFFFFF19',
      headerTextColor: '#FFFFFFFF',
      labelColor: '#FFFFFFD8',
      placeholderTextColor: '#FFFFFF3F',
      quaternaryLabelColor: '#FFFFFF19',
      secondaryLabelColor: '#FFFFFF8C',
      selectedControlTextColor: '#FFFFFFD8',
      selectedMenuItemTextColor: '#FFFFFFFF',
      separatorColor: '#FFFFFF19',
      shadowColor: '#000000FF',
      tertiaryLabelColor: '#FFFFFF3F',
      textColor: '#FFFFFFFF',
      windowBackgroundColor: '#323232FF',
    }
  } else {
    return {
      // alternateSelectedControlTextColor: '#FFFFFFFF',
      // findHighlightColor: '#FFFF00FF',
      // highlightColor: '#FFFFFFFF',
      // linkColor: '#0068DAFF',
      // selectedTextColor: '#000000FF',
      // textBackgroundColor: '#FFFFFFFF',
      // unemphasizedSelectedContentBackgroundColor: '#DCDCDCFF',
      // unemphasizedSelectedTextBackgroundColor: '#DCDCDCFF',
      // unemphasizedSelectedTextColor: '#000000FF',
      // windowFrameTextColor: '#000000D8',  
      controlBackgroundColor: '#FFFFFFFF',
      controlColor: '#FFFFFFFF',
      controlTextColor: '#000000D8',
      disabledControlTextColor: '#0000003F',
      gridColor: '#E6E6E6FF',
      headerTextColor: '#000000D8',
      labelColor: '#000000D8',
      placeholderTextColor: '#0000003F',
      quaternaryLabelColor: '#00000019',
      secondaryLabelColor: '#0000007F',
      selectedControlTextColor: '#000000D8',
      selectedMenuItemTextColor: '#FFFFFFFF',
      separatorColor: '#00000019',
      shadowColor: '#000000FF',
      tertiaryLabelColor: '#00000042',
      textColor: '#000000FF',
      windowBackgroundColor: '#ECECECFF',
    }
  }

}









/**
 * Update `nativeTheme` electron property
 * Setting `nativeTheme.themeSource` has several effects, including: it tells Chrome how to render UI elements such as menus, window frames, etc; it sets `prefers-color-scheme` css query; it sets `nativeTheme.shouldUseDarkColors` value.
 * Per: https://www.electronjs.org/docs/api/native-theme
 */
// function setNativeTheme(isFirstRun) {
//   const darkMode = global.state().darkMode
//   switch (darkMode) {
//     case 'match-system':
//       nativeTheme.themeSource = 'system'
//       break
//     case 'light':
//       nativeTheme.themeSource = 'light'
//       break
//     case 'dark':
//       nativeTheme.themeSource = 'dark'
//       break
//   }

//   if (!isFirstRun) {
//     // If dev tools is open, reload (close then open) to force it to load the new theme. Unfortunately it doesn't do so automatically, in either Electron or Chrome.
//     const win = BrowserWindow.getFocusedWindow()
//     const devToolsIsOpen = !app.isPackaged && win?.webContents?.isDevToolsOpened()
//     if (devToolsIsOpen) {
//       win.webContents.closeDevTools()
//       win.webContents.openDevTools()
//     }
//   }
// }






// -------- COLORS -------- //



/**
 * Return an object with list of named colors. 
 * These are turned into CSS variables by the render process.
 * Colors start off taken from the operating system, and (optionally)
 * overrides are applied by the loaded theme.
 * @param {*} observeThemeValues - If true, adhere to theme overrides.
 */
// export function getSystemColorsOld(observeThemeValues = true) {

//   let colors = {}
//   let overriddenVariables = []
//   const state = global.state()

//   // Get initial colors. By default, we match what Chromium's state.
//   // E.g. If Chromium isDarkMode is true, we return dark colors.
//   // Themes can override this with `theme.baseColorScheme` value.
//   // If `observeThemeValues` is true, we use this value.
//   if (!observeThemeValues) {
//     colors = state.chromium.isDarkMode ? getDarkColors() : getLightColors()
//   } else {
//     switch (state.theme.baseColorScheme) {
//       case 'match-app':
//         if (state.chromium.isDarkMode) {
//           colors = getDarkColors()
//         } else {
//           colors = getLightColors()
//         }
//         break
//       case 'dark':
//         colors = getDarkColors()
//         break
//       case 'light':
//         colors = getLightColors()
//         break
//     }
//   }


//   // Apply color overrides. Themes can specify overrides for
//   // individual color variables. `withMode` specifies when they
//   // apply. Always, or only when app is in light or dark mode.
//   if (observeThemeValues) {
//     state.theme.colorOverrides.forEach(({ variable, newValue, withMode }) => {

//       const appliesToCurrentMode =
//         withMode == 'always' ||
//         withMode == 'dark' && state.chromium.isDarkMode ||
//         withMode == 'light' && !state.chromium.isDarkMode

//       if (appliesToCurrentMode) {
//         colors[variable] = newValue
//         overriddenVariables.push(variable)
//         // If overrides sets `controlAccentColor` variable (and only it), 
//         // we need to also generate the darker variation.
//         if (variable == 'controlAccentColor') {
//           colors.darkerControlAccentColor = getDarkerAccentColor(colors.controlAccentColor)
//         }
//       }
//     })
//   }

//   return {
//     colors,
//     overriddenVariables
//   }
// }


// function getDarkColors() {
//   return {

//     // Gambier-specific colors
//     // errorColor: '#FA6E50',

//     // macOS "Dynamic colors":
//     // https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/color#dynamic-system-colors
//     ...getAccentColors(true),
//     alternateSelectedControlTextColor: '#FFFFFFFF',
//     controlBackgroundColor: '#1E1E1EFF',
//     controlColor: '#FFFFFF3F',
//     controlTextColor: '#FFFFFFD8',
//     disabledControlTextColor: '#FFFFFF3F',
//     findHighlightColor: '#FFFF00FF',
//     gridColor: '#FFFFFF19',
//     headerTextColor: '#FFFFFFFF',
//     highlightColor: '#B4B4B4FF',
//     labelColor: '#FFFFFFD8',
//     linkColor: '#419CFFFF',
//     placeholderTextColor: '#FFFFFF3F',
//     quaternaryLabelColor: '#FFFFFF19',
//     secondaryLabelColor: '#FFFFFF8C',
//     selectedControlTextColor: '#FFFFFFD8',
//     selectedMenuItemTextColor: '#FFFFFFFF',
//     selectedTextColor: '#FFFFFFFF',
//     separatorColor: '#FFFFFF19',
//     shadowColor: '#000000FF',
//     tertiaryLabelColor: '#FFFFFF3F',
//     textBackgroundColor: '#1E1E1EFF',
//     textColor: '#FFFFFFFF',
//     unemphasizedSelectedContentBackgroundColor: '#464646FF',
//     unemphasizedSelectedTextBackgroundColor: '#464646FF',
//     unemphasizedSelectedTextColor: '#FFFFFFFF',
//     windowBackgroundColor: '#323232FF',
//     windowFrameTextColor: '#FFFFFFD8',

//   }
// }

// function getLightColors() {
//   return {

//     // Gambier-specific colors
//     // errorColor: '#FA6E50',

//     // macOS "Dynamic colors":
//     // https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/color#dynamic-system-colors
//     ...getAccentColors(false),
//     alternateSelectedControlTextColor: '#FFFFFFFF',
//     controlBackgroundColor: '#FFFFFFFF',
//     controlColor: '#FFFFFFFF',
//     controlTextColor: '#000000D8',
//     disabledControlTextColor: '#0000003F',
//     findHighlightColor: '#FFFF00FF',
//     gridColor: '#E6E6E6FF',
//     headerTextColor: '#000000D8',
//     highlightColor: '#FFFFFFFF',
//     labelColor: '#000000D8',
//     linkColor: '#0068DAFF',
//     placeholderTextColor: '#0000003F',
//     quaternaryLabelColor: '#00000019',
//     secondaryLabelColor: '#0000007F',
//     selectedControlTextColor: '#000000D8',
//     selectedMenuItemTextColor: '#FFFFFFFF',
//     selectedTextColor: '#000000FF',
//     separatorColor: '#00000019',
//     shadowColor: '#000000FF',
//     tertiaryLabelColor: '#00000042',
//     textBackgroundColor: '#FFFFFFFF',
//     textColor: '#000000FF',
//     unemphasizedSelectedContentBackgroundColor: '#DCDCDCFF',
//     unemphasizedSelectedTextBackgroundColor: '#DCDCDCFF',
//     unemphasizedSelectedTextColor: '#000000FF',
//     windowBackgroundColor: '#ECECECFF',
//     windowFrameTextColor: '#000000D8',
//   }
// }

// /**
//  * TEMPORARY: Electron returns incorrect values for controlAccentColor. So we have to hard-code the correct values. Filed issue here: https://github.com/electron/electron/issues/27048
//  */
// function getAccentColors(isDarkMode) {

//   const allegedAccentColor = `#${systemPreferences.getAccentColor().toUpperCase()}`

//   // console.log(systemPreferences.getAccentColor())
//   // console.log(systemPreferences.getColor('keyboard-focus-indicator')) // keyboardFocusIndicatorColor
//   // console.log(systemPreferences.getColor('selected-content-background')) // selectedContentBackgroundColor
//   // console.log(systemPreferences.getColor('selected-control')) // selectedControlColor
//   // console.log(systemPreferences.getColor('text-selected-background')) // selectedTextBackgroundColor

//   switch (allegedAccentColor) {

//     // ------------ BLUE ------------ //
//     case '#0A5FFFFF':
//       if (isDarkMode) {
//         return {
//           iconAccentColor: '#007AFFFF',
//           controlAccentColor: '#007AFFFF',
//           darkerControlAccentColor: getDarkerAccentColor('#007AFFFF'),
//           keyboardFocusIndicatorColor: '#1AA9FF4C',
//           selectedContentBackgroundColor: '#0058D0FF',
//           selectedControlColor: '#3F638BFF',
//           selectedTextBackgroundColor: '#3F638BFF',
//         }
//       } else {
//         return {
//           iconAccentColor: '#007AFFFF',
//           controlAccentColor: '#007AFFFF',
//           darkerControlAccentColor: getDarkerAccentColor('#007AFFFF'),
//           keyboardFocusIndicatorColor: '#0067F43F',
//           selectedContentBackgroundColor: '#0063E1FF',
//           selectedControlColor: '#B3D7FFFF',
//           selectedTextBackgroundColor: '#B3D7FFFF',
//         }
//       }

//     // ------------ PURPLE ------------ //
//     case '#923796FF': // Dark
//       return {
//         iconAccentColor: '#A550A7FF',
//         controlAccentColor: '#A550A7FF',
//         darkerControlAccentColor: getDarkerAccentColor('#A550A7FF'),
//         keyboardFocusIndicatorColor: '#DB78DE4C',
//         selectedContentBackgroundColor: '#7F3280FF',
//         selectedControlColor: '#705670FF',
//         selectedTextBackgroundColor: '#705670FF',
//       }
//     case '#812684FF': // Light
//       return {
//         iconAccentColor: '#953D96FF',
//         controlAccentColor: '#953D96FF',
//         darkerControlAccentColor: getDarkerAccentColor('#953D96FF'),
//         keyboardFocusIndicatorColor: '#8326843F',
//         selectedContentBackgroundColor: '#7D2A7EFF',
//         selectedControlColor: '#DFC5DFFF',
//         selectedTextBackgroundColor: '#DFC5DFFF',
//       }

//     // ------------ PINK ------------ //
//     case '#F2318DFF':
//       if (isDarkMode) {
//         return {
//           iconAccentColor: '#F74F9EFF',
//           controlAccentColor: '#F74F9EFF',
//           darkerControlAccentColor: getDarkerAccentColor('#F74F9EFF'),
//           keyboardFocusIndicatorColor: '#FF76D34C',
//           selectedContentBackgroundColor: '#C83179FF',
//           selectedControlColor: '#88566EFF',
//           selectedTextBackgroundColor: '#88566EFF',
//         }
//       } else {
//         return {
//           iconAccentColor: '#F74F9EFF',
//           controlAccentColor: '#F74F9EFF',
//           darkerControlAccentColor: getDarkerAccentColor('#F74F9EFF'),
//           keyboardFocusIndicatorColor: '#EB398D3F',
//           selectedContentBackgroundColor: '#D93B85FF',
//           selectedControlColor: '#FCCAE2FF',
//           selectedTextBackgroundColor: '#FCCAE2FF',
//         }
//       }

//     // ------------ RED ------------ //
//     case '#FC3845FF': // Dark
//       return {
//         iconAccentColor: '#FF5257FF',
//         controlAccentColor: '#FF5257FF',
//         darkerControlAccentColor: getDarkerAccentColor('#FF5257FF'),
//         keyboardFocusIndicatorColor: '#FF7A804C',
//         selectedContentBackgroundColor: '#D03439FF',
//         selectedControlColor: '#8B5758FF',
//         selectedTextBackgroundColor: '#8B5758FF',
//       }
//     case '#D62130FF': // Light
//       return {
//         iconAccentColor: '#E0383EFF',
//         controlAccentColor: '#E0383EFF',
//         darkerControlAccentColor: getDarkerAccentColor('#E0383EFF'),
//         keyboardFocusIndicatorColor: '#D320273F',
//         selectedContentBackgroundColor: '#C3252BFF',
//         selectedControlColor: '#F5C3C5FF',
//         selectedTextBackgroundColor: '#F5C3C5FF',
//       }


//     // ------------ ORANGE ------------ //
//     case '#F36D16FF':
//       if (isDarkMode) {
//         return {
//           iconAccentColor: '#F7821BFF',
//           controlAccentColor: '#F7821BFF',
//           darkerControlAccentColor: getDarkerAccentColor('#F7821BFF'),
//           keyboardFocusIndicatorColor: '#FFB2394C',
//           selectedContentBackgroundColor: '#C86003FF',
//           selectedControlColor: '#886547FF',
//           selectedTextBackgroundColor: '#886547FF',
//         }
//       } else {
//         return {
//           iconAccentColor: '#F7821BFF',
//           controlAccentColor: '#F7821BFF',
//           darkerControlAccentColor: getDarkerAccentColor('#F7821BFF'),
//           keyboardFocusIndicatorColor: '#EB6F023F',
//           selectedContentBackgroundColor: '#D96B0AFF',
//           selectedControlColor: '#FCD9BBFF',
//           selectedTextBackgroundColor: '#FCD9BBFF',
//         }
//       }

//     // ------------ YELLOW ------------ //
//     case '#FEBC09FF': // Dark
//       return {
//         iconAccentColor: '#FFC600FF',
//         controlAccentColor: '#FFC600FF',
//         darkerControlAccentColor: getDarkerAccentColor('#FFC600FF'),
//         keyboardFocusIndicatorColor: '#FFFF1A4C',
//         selectedContentBackgroundColor: '#D09C00FF',
//         selectedControlColor: '#8B7A3FFF',
//         selectedTextBackgroundColor: '#8B7A3FFF',
//       }
//     case '#FEBD1EFF': // Light
//       return {
//         iconAccentColor: '#FFC726FF',
//         controlAccentColor: '#FFC726FF',
//         darkerControlAccentColor: getDarkerAccentColor('#FFC726FF'),
//         keyboardFocusIndicatorColor: '#F4B80D3F',
//         selectedContentBackgroundColor: '#E1AC14FF',
//         selectedControlColor: '#FFEEBEFF',
//         selectedTextBackgroundColor: '#FFEEBEFF',
//       }

//     // ------------ GREEN ------------ //
//     case '#53B036FF':
//       if (isDarkMode) {
//         return {
//           iconAccentColor: '#62BA46FF',
//           controlAccentColor: '#62BA46FF',
//           darkerControlAccentColor: getDarkerAccentColor('#62BA46FF'),
//           keyboardFocusIndicatorColor: '#8DF46C4C',
//           selectedContentBackgroundColor: '#42912AFF',
//           selectedControlColor: '#5C7653FF',
//           selectedTextBackgroundColor: '#5C7653FF',
//         }
//       } else {
//         return {
//           iconAccentColor: '#62BA46FF',
//           controlAccentColor: '#62BA46FF',
//           darkerControlAccentColor: getDarkerAccentColor('#62BA46FF'),
//           keyboardFocusIndicatorColor: '#4DAB2F3F',
//           selectedContentBackgroundColor: '#4DA032FF',
//           selectedControlColor: '#D0EAC7FF',
//           selectedTextBackgroundColor: '#D0EAC7FF',
//         }
//       }

//     // ------------ GRAPHITE ------------ //
//     case '#797979FF': // Dark
//       return {
//         iconAccentColor: '#8C8C8CFF',
//         controlAccentColor: '#8C8C8CFF',
//         darkerControlAccentColor: getDarkerAccentColor('#8C8C8CFF'),
//         keyboardFocusIndicatorColor: '#C3C3C37F',
//         selectedContentBackgroundColor: '#686868FF',
//         selectedControlColor: '#FFFFFF3F',
//         selectedTextBackgroundColor: '#FFFFFF3F',
//       }
//     case '#868686FF': // Light
//       return {
//         iconAccentColor: '#989898FF',
//         controlAccentColor: '#989898FF',
//         darkerControlAccentColor: getDarkerAccentColor('#989898FF'),
//         controlAccentColor: '#989898FF',
//         keyboardFocusIndicatorColor: '#99999EFF',
//         selectedContentBackgroundColor: '#808080FF',
//         selectedControlColor: '#E0E0E0FF',
//         selectedTextBackgroundColor: '#E0E0E0FF',
//       }
//   }
// }

class DbManager {
  constructor() {

    // Create database
    // Pass ":memory:" as the first argument to create an in-memory db.
    this.db = new Database__default["default"](':memory:');
    // this.db = new Database(':memory:', { verbose: console.log })

    // Create table
    this.table = this.db.prepare(`
      CREATE VIRTUAL TABLE docs 
      USING FTS5(id, name, title, path, body)
    `).run();

    // Statement for inserting new docs

    // Using `INSERT OR REPLACE` means we replace the row, if it already exists. Else, we create (insert) it. 

    // The following says: "Does a row with the same id already exist? If yes, get it's rowid. And insert the new values at that same rowid, thereby replacing the original row. Else, insert a new row." `rowid` is a unique integer index value automatically assigned to each row on creation, in FTS tables (or any sqlite table where we don't specify a primary key).

    // This is all a bit convuluted. That's because we're using FTS tables. Normally we could jusy, say, set the `id` column as the primary key, and sqlite would automatically trigger the replace action if we tried to add a row with the same id. But FTS tables don't allow primary key declaration or constraints (the other tool we could use). So instead we have to insert at specific rowid's, ala working with arrays by indexes.
    this.insert_stmt = this.db.prepare(`
      INSERT OR REPLACE INTO docs (rowid, id, name, title, path, body) 
      VALUES ((SELECT rowid FROM docs WHERE id = @id LIMIT 1), @id, @name, @title, @path, @body)
    `);

    this.insert_many_stmt = this.db.transaction((docs) => {
      for (const doc of docs) {
        this.insert_stmt.run(doc);
      }    });

    this.delete_stmt = this.db.prepare(`
      DELETE FROM docs
      WHERE id = ?
      LIMIT 1
    `);

    // Statement for full text search
    this.fts_stmt = this.db.prepare(`
      SELECT id,
             title,
             highlight(docs, 4, '<span class="highlight">', '</span>') body
      FROM docs 
      WHERE docs MATCH ?
      ORDER BY rank
    `);

    // Setup listener to handle queries from renderer. Take the provided paramaters for query string (e.g. 'dogs'), matchExactPhrase (boolean), and path (e.g. '/User/Documents/ClimateResearch'), and create the string we'll pass into 

    // We use column filters to specify which columns to search. We only want params.path to search the `path` column, for example. And we never want to search `id` column. For example: `body: "Rex" *` says "Search body column for tokens that start with 'Rex'`. Per: https://www.sqlite.org/fts5.html#fts5_column_filters

    // If `matchExactPhrase` is false, we add a '*' after our query string, which tells sqlite to treat the string as a "prefix token", and match any tokens that start with the query. Per: https://www.sqlite.org/fts5.html#fts5_prefix_queries

    // For `path`, we're inserting `^` before the string, to tell sqlite to only match if the string starts at the first token in the column. Like ^ works in regex. Per: https://www.sqlite.org/fts5.html#fts5_initial_token_queries

    // We wrap our strings in double-quotation marks to escape characters such as - and /, which would otherwise trigger sql errors. Forward slashes will always appear in paths, and other characters may appear in the query string.

    // We use boolean operators to combine our phrases. Matches MUST be descendants of the specified `params.path` (folder path), AND have query matches in either `body`, `title`, or `name` columns.

    // Docs: https://www.sqlite.org/fts5.html#extending_fts5
    electron.ipcMain.handle('queryDb', (evt, params) => {

      // Create the query string
      const body = `body:"${params.query}"${params.matchExactPhrase ? '' : ' *'}`;
      const title = `title:"${params.query}"${params.matchExactPhrase ? '' : ' *'}`;
      const name = `name:"${params.query}"${params.matchExactPhrase ? '' : ' *'}`;
      const path = `path:^ "${params.path}"${params.matchExactPhrase ? '' : ' *'}`;
      const query = `${path} AND (${body} OR ${title} OR ${name})`;

      // Run the full text search statement with the query string.
      let results = this.fts_stmt.all(query);

      // Return the results. Will be array of objects; one for each row.
      return results
    });
  }

  /**
   * Insert single row into database.
   */
  insert(doc = {
    id: '',
    name: '',
    title: '',
    path: '',
    body: ''
  }) {
    this.insert_stmt.run(doc);
  }

  /**
   * Insert multiple rows into the database.
   * @param {} docs - Array of docs
   */
  insertMany(docs) {
    this.insert_many_stmt(docs);
  }

  /**
   * Delete single row from database.
   */
  delete(id) {
    this.delete_stmt.run(id);
  }

  init() {

    // const insertTest = global.db.prepare('INSERT INTO docs (title, path) VALUES (?, ?)')
    // const info = insertTest.run("My time in Tuscany", "Was mostly unremarkable, to be perfectly honest.")
    // console.log(info.changes)

    // const insert = global.db.prepare('INSERT INTO docs (id, name, title, body) VALUES (?, ?, ?, ?)');

    // const insertMany = global.db.transaction((data) => {
    //   for (const item of data) {
    //     insert.run(item)
    //   }
    // });

    // insertMany([
    //   { title: 'Joey', path: 'docs/joey.md' },
    //   { title: 'Sally', path: 'docs/salley.md' },
    //   { title: 'Junior', path: 'docs/junior.md' },
    // ]);

    // const joey = global.db.prepare('SELECT * FROM docs WHERE title = ?').get('Junior')
    // console.log(joey)

    // const deleteTest = global.db.prepare('DELETE FROM docs WHERE title = ?').run("Sally")

    // const getAll = global.db.prepare('SELECT * FROM docs')
    // console.log(getAll.all())

    // const updateTest = global.db.prepare('UPDATE docs SET title = ? WHERE title = ?').run('Zelda!', 'Joey')

    // console.log(getAll.all())
  }
}

async function deleteFile(path) {
  try {
		await fsExtra.remove(path);
		return { type: 'DELETE_FILE_SUCCESS', path: path }
	} catch(err) {
		return { type: 'DELETE_FILE_FAIL', err: err }
	}
}

async function deleteFiles(paths) {
  try {
    let deletedPaths = await Promise.all(
      paths.map(async (path) => {
        await fsExtra.remove(path);
      })
    );
		return { type: 'DELETE_FILES_SUCCESS', paths: deletedPaths }
	} catch(err) {
		return { type: 'DELETE_FILES_FAIL', err: err }
	}
}

async function selectProjectDirectoryFromDialog () {

  const win = electron.BrowserWindow.getFocusedWindow();

  const selection = await electron.dialog.showOpenDialog(win, {
    title: 'Select Project Folder',
    properties: ['openDirectory', 'createDirectory']
  });

  if (!selection.canceled) {
    return { 
      type: 'SET_PROJECT_DIRECTORY', 
      directory: selection.filePaths[0] 
    }
  }
}

// Find components of cite keys (prefix, id, label, locator)
// Does not support suffic yet.
// Demo: https://regex101.com/r/QfLdwI/1
const citekeyComponentsRE = /(?<prefix>[^\n\[\]\(\)]*?)?@(?<id>[a-zA-Z0-9_][^\s,;\]]+)(?:,\s(?<label>[\D]+)\s?(?<locator>[\w\-,:]+))?(?<suffix>.*)?/;

// Variable for our citeproc engine. We'll only populate this once.
let citeproc;


/**
 * Create instance of the citeproc engine.
 * Load our custom CSL, and the en-US locale.
 * @returns 
 */
async function makeCiteprocEngine() {

  const stylePath = path__default["default"].join(electron.app.getAppPath(), 'app/references/joshcarpenter-custom-csl.csl');
  const localePath = path__default["default"].join(electron.app.getAppPath(), 'app/references/locales-en-US.xml');
  
  const style = await fsExtra.readFile(stylePath, 'utf8');
  const locale = await fsExtra.readFile(localePath, 'utf8');

  const engine = new CSL__default["default"].Engine({

    // We'll populate this with citable items
    items: {},

    // An array of valid locator labels. Each formatted as follows:
    // {
    //   term: "p.",
    //   form: "short",
    //   plural: "single",
    //   parentTerm: "page"
    // }
    locatorLabels: getCitationLocatorLabels(locale),

    // Given a language tag in RFC-4646 form, this method retrieves the
    // locale definition file.  This method must return a valid *serialized*
    // CSL locale. (In other words, an blob of XML as an unparsed string.  The
    // processor will fail on a native XML object or buffer).
    retrieveLocale: () => locale,

    // Given an identifier, this retrieves one citation item.  This method
    // must return a valid CSL-JSON object.
    retrieveItem: (id) => {
      return engine.sys.items[id]
    }
  }, style);

  return engine
}


/**
 * Get valid locators from the provided locale file.
 * Locale files specify the valid terms (locator and otherwise), for the locale.
 * See: https://docs.citationstyles.org/en/stable/specification.html#locators
 * for the list of valid locator terms in the CSL spec.
 * Each locators can also have multiple short, long, singular and pluralized versions.
 * E.g. "page" can be written as "p." (short, singlular), "pages" (long, multiple), etc.
 * Locators are specified in the locale files as follows:
 * ```
 * <term name="page" form="short">
 *    <single>p.</single>
 *    <multiple>pp.</multiple>
 * </term>
 * ```
 * We extract these from the locale file, and return an array of objects, where
 * each object is a unique locator term (e.g. "p."), in the following format:
 * ```
 * {
 *   term: "p.",
 *   form: "short",
 *   plural: "single",
 *   parentTerm: "page"
 * }
 * ```
 * @param {*} locale: Loaded xml file contents. See CSL repo for full list of locales.
 */
function getCitationLocatorLabels(locale) {

  // Convert XML to JS object.
  // `compact: false` to preserve positions of comments (otherwise they get batched)
  // `trim: true` to remove white space.
  const localeJs = convert__default["default"].xml2js(locale, { compact: false, trim: true, spaces: 4 });

  // Get "terms" array. 
  // Yes, this is ugly; log localeJs to console to see the hierarchy.
  const allTerms = localeJs.elements[0].elements.find((e) => e.name == "terms").elements;

  // Find all locator terms from "terms" array.
  // This is a PITA because terms is flat, and the XML comments are the only demarcations,
  // e.g. <!-- LONG LOCATOR FORMS --> and <!-- SHORT LOCATOR FORMS -->, which prececed
  // lists of terms, respectively (long, short, and symbol). The following logic looks 
  // for those, and starts adding the items that follow, up until the next comment block.
  // If that comment block is also a LOCATOR block, it keeps on adding. Else, it stops.
  let locatorTerms = [];
  let isLocator = false;
  allTerms.map((t) => {

    if (isLocator) {
      if (t.type !== "comment")
        locatorTerms.push(t);
    }

    if (t.type == "comment") {
      if (t.comment.includes("LOCATOR")) {
        isLocator = true;
      } else {
        isLocator = false;
      }
    }
  });

  // Build array of objects. This is what we'll return.
  // One object per locator.
  let locators = [];

  locatorTerms.map((l) => {

    // Skip "number-of-pages" locators.
    // `locales-en-US` includes them, but they're not in the official list:
    // https://docs.citationstyles.org/en/stable/specification.html#locators
    // ...and they're identical to `pages`, causing needless parsing confusion.
    if (l.attributes.name == "number-of-pages") return

    // In source locale, term `form` attribute is either missing, or `form="short"`.
    // E.g. https://github.com/citation-style-language/locales/blob/master/locales-en-US.xml#L166
    // Hence the ternary operators for `form` key, below:

    // Get singular version
    let singleVersion = {
      term: l.elements[0].elements[0].text,
      form: l.attributes.form ? l.attributes.form : "long",
      plural: false,
      parentTerm: l.attributes.name
    };

    // Get pluralized version
    let multipleVersion = {
      term: l.elements[1].elements[0].text,
      form: l.attributes.form ? l.attributes.form : "long",
      plural: true,
      parentTerm: l.attributes.name
    };

    locators.push(singleVersion, multipleVersion);
  });

  // Sort locators alphabetically. They're
  locators.sort((a, b) => (a.term > b.term) ? 1 : -1);

  return locators
}


async function getCitation (bibliographyPath, citekey) {

  // Setup citeproc engine the first time through
  if (!citeproc) citeproc = await makeCiteprocEngine();

  // Load bibliography (list of CSL "items")
  // Per https://citeproc-js.readthedocs.io/en/latest/csl-json/markup.html
  const bibliographyString = await fsExtra.readFile(bibliographyPath, 'utf8');
  const arrayOfItems = JSON.parse(bibliographyString);
  arrayOfItems.forEach((item) => citeproc.sys.items[item.id] = item);
  citeproc.updateItems(Object.keys(citeproc.sys.items));

  // Get citekey components (prefix, id, etc)
  // Groups return as "According to", "@dole2012", "pp.", "3-4"
  // First use slice to remove enclosing square brackets
  // [@tim2020] --> tim2020
  let {
    prefix = undefined,
    id = '',
    label = '',
    locator = '',
    suffix = '',
  } = citekey.slice(1, citekey.length - 1).match(citekeyComponentsRE)?.groups;

  if (label) {

    // If label is present, we need to get the full parent term name, 
    // E.g. the parent term name of "pp." is "page"
    // Citeproc only accepts parent term names (which is annoying)

    // There might be multiple qualifying parent labels. E.g. "page" and "pages" will
    // both return for "@marlee98 page 22". This will usually be because the singular is 
    // subset of the plural, so in these cases, match the plural.
    // Else, if there's only one match, use it.
    const matchingLabels = citeproc.sys.locatorLabels.filter(({ term }) => label.includes(term));
    label = matchingLabels.length > 1 ?
      matchingLabels.find((m) => m.plural).parentTerm :
      matchingLabels[0].parentTerm;
  }

  // Remove ugly timestamp locator labels
  // t. 19:31 -> 19.31
  // Demo: https://regex101.com/r/Uh1KAd/2/
  // if (label) label = label.replace(/(t\.|tt\.|times|time)\s?/, '')

  let renderedCitation = citeproc.previewCitationCluster({
    citationItems: [{
      prefix,
      id,
      label,
      locator,
      suffix
    }],
    properties: {
      noteIndex: 0
    }
  }, [], [], 'text');

  // Strip {{html}} and {{/html}} from rendered output
  renderedCitation = renderedCitation.replaceAll(/{{html}}|{{\/html}}/g, "");

  return renderedCitation
}

function init$3() {


  // -------- IPC: Renderer "sends" to Main -------- //

  electron.ipcMain.on('saveImageFromClipboard', async (evt) => {
    const win = electron.BrowserWindow.fromWebContents(evt.sender);
    const project = global.state().projects.byId[win.projectId];
    const img = electron.clipboard.readImage();
    const png = img.toPNG();
    await fsExtra.writeFile(`${project.directory}/test.png`, png);
  });

  electron.ipcMain.on('showWindow', (evt) => {
    const win = electron.BrowserWindow.fromWebContents(evt.sender);
    win.show();
  });

  electron.ipcMain.on('openUrlInDefaultBrowser', (evt, url) => {
    // Check if URL is valid.
    // Per https://stackoverflow.com/a/43467144
    // If no, try appending protocol and check again.
    // This handles cases like `apple.com`, where user
    // leaves off protocol for sake of brevity.
    // 
    let isValid = isValidHttpUrl(url);
    if (!isValid) {
      url = `http://${url}`;
      isValid = isValidHttpUrl(url);
    }
    try {
      electron.shell.openExternal(url);
    } catch (err) {
      console.log('Bar URL');
    }
  });

  electron.ipcMain.on('replaceAll', (evt, query, replaceWith, filePaths, isMatchCase, isMatchExactPhrase, isMetaKeyPressed) => {

    // Define our regex for finding matches in the specified files.
    // Demo: https://jsfiddle.net/m17zhoyj/1/
    let queryRegex = undefined;
    if (isMatchExactPhrase) {
      // If `matchExactPhrase`, make sure there are no word characters immediately before or after the query phrase, using negative look behind and look ahead.
      // Demo: https://regex101.com/r/Toj4WF/1
      queryRegex = new RegExp(String.raw`(?<!\w)${query}(?!\w)`, isMatchCase ? 'g' : 'gi');
    } else {
      queryRegex = new RegExp(`${query}`, isMatchCase ? 'g' : 'gi');
    }

    // Ask user to confirm replacment, unless meta key was held down (provides a fast path).
    if (!isMetaKeyPressed) {
      const confirmReplacement = electron.dialog.showMessageBoxSync({
        type: 'warning',
        message: `Are you sure you want to replace "${query}" with "${replaceWith}" in ${filePaths.length} document${filePaths.length > 1 ? 's' : ''}?`,
        buttons: ['Cancel', 'Replace'],
        cancelId: 0
      });

      // If user does not press `Replace` (1), then `return` prematurely.
      if (confirmReplacement !== 1) return
    }

    // Open each file in `filePaths`, find all instances of `query`, replace, and write file.
    filePaths.forEach(async (filePath) => {
      let file = await fsExtra.readFile(filePath, 'utf8');
      file = file.replaceAll(queryRegex, replaceWith);
      await fsExtra.writeFile(filePath, file, 'utf8');
    });
  });


  electron.ipcMain.on('dispatch', async (evt, action) => {

    const win = electron.BrowserWindow.fromWebContents(evt.sender);

    switch (action.type) {

      case ('SELECT_PROJECT_DIRECTORY_FROM_DIALOG'):
        store.dispatch(await selectProjectDirectoryFromDialog(), win);
        break

      // The following actions all 
      case ('SAVE_PANEL_CHANGES_SO_WE_CAN_CLOSE_WINDOW'):
      case ('CLOSE_PANEL'):
      case ('OPEN_NEW_DOC_IN_PANEL'):
      case ('OPEN_DOC_IN_PANEL'): {

        const project = global.state().projects.byId[win.projectId];
        const panel = project.panels[action.panelIndex];

        if (panel.unsavedChanges) {
          promptToSaveChangesThenForwardAction(action, win);
        } else {
          // No unsaved changes. Forward the action.
          store.dispatch({ ...action, saveOutcome: 'noUnsavedChanges' }, win);
        }

        break
      }

      case ('SAVE_DOC'):
        saveDoc(action, win);
        break

      case ('SAVE_DOC_AS'):
        saveDocAs(action, win);
        break

      case ('DELETE_FILE'):
        store.dispatch(await deleteFile(action.path), win);
        break

      case ('DELETE_FILES'):
        store.dispatch(await deleteFiles(action.paths), win);
        break

      default:
        store.dispatch(action, win);
        break
    }
  });

  // -------- IPC: Invoke -------- //

  electron.ipcMain.handle('getBibliography', async (evt, bibliographyPath) => {
    const bibliography = await fsExtra.readFile(bibliographyPath, 'utf8');
    return bibliography
  });

  electron.ipcMain.handle('getCitation', async (evt, bibliographyPath, citekey) => {
    return await getCitation(bibliographyPath, citekey)
  });

  // Return x/y coordinates of cursor inside sender window
  // Return null if cursor is outside the window bounds.
  electron.ipcMain.handle('getCursorWindowPosition', (evt) => {
    const win = electron.BrowserWindow.fromWebContents(evt.sender);
    const point = electron.screen.getCursorScreenPoint();
    const bounds = win.getBounds();
    const pos = {
      x: point.x - bounds.x,
      y: point.y - bounds.y
    };

    const cursorIsOutsideBounds = 
      pos.x < 0 || // left of window
      pos.y < 0 || // above window
      pos.x > bounds.width || // right of window
      pos.y > bounds.height; // below window
    
    return cursorIsOutsideBounds ? null : pos
  });
  
  electron.ipcMain.handle('getState', (evt) => {
    return global.state()
  });

  electron.ipcMain.handle('getFiles', (evt) => {
    const win = electron.BrowserWindow.fromWebContents(evt.sender);
    const watcher = global.watchers.find((watcher) => watcher.id == win.projectId);
    return watcher ? watcher.files : undefined
  });

  // Load file and return text
  electron.ipcMain.handle('getFileByPath', async (evt, filePath, encoding = 'utf8') => {
    let file = await fsExtra.readFile(filePath, encoding);
    return file
  });

  electron.ipcMain.handle('getHTMLFromClipboard', (evt) => {
    return electron.clipboard.readHTML()
  });

  electron.ipcMain.handle('getFormatOfClipboard', (evt) => {
    return electron.clipboard.availableFormats()
  });

  electron.ipcMain.handle('moveOrCopyFileIntoProject', async (evt, filePath, folderPath, isCopy) => {

    let wasSuccess = false;

    // Get destination
    const fileName = path__default["default"].basename(filePath);
    let destinationPath = path__default["default"].format({
      dir: folderPath,
      base: fileName
    });

    // Does file already exist at destination?
    const fileAlreadyExists = fsExtra.existsSync(destinationPath);

    // If yes, prompt user to confirm overwrite. 
    // Else, just move/copy
    if (fileAlreadyExists) {
      const selectedButtonId = electron.dialog.showMessageBoxSync({
        type: 'question',
        message: `An item named ${fileName} already exists in this location. Do you want to replace it with the one you’re moving?`,
        buttons: ['Keep Both', 'Stop', 'Replace'],
        cancelId: 1
      });
      switch (selectedButtonId) {

        // Keep both
        case 0:
          destinationPath = getIncrementedFileName(destinationPath);
          fsExtra.copyFileSync(filePath, destinationPath);
          wasSuccess = true;

        // Stop (Do nothing)
        case 1:
          wasSuccess = false;

        // Replace
        case 2:
          if (isCopy) {
            fsExtra.copyFileSync(filePath, destinationPath);
          } else {
            fsExtra.renameSync(filePath, destinationPath);
          }
          wasSuccess = true;
      }
    } else {
      if (isCopy) {
        fsExtra.copyFileSync(filePath, destinationPath);
      } else {
        fsExtra.renameSync(filePath, destinationPath);
      }
      wasSuccess = true;
    }

    return {
      wasSuccess,
      destinationPath
    }
  });




}





// -------- IPC: Invoke -------- //

// // ipcMain.handle('getValidatedPathOrURL', async (event, docPath, pathToCheck) => {
// //   // return path.resolve(basePath, filepath)

// //   /*
// //   Element: Image, link, backlink, link reference definition
// //   File type: directory, html, png|jpg|gif, md|mmd|markdown
// //   */

// //   // console.log('- - - - - -')
// //   // console.log(pathToCheck.match(/.{0,2}\//))
// //   const directory = path.parse(docPath).dir
// //   const resolvedPath = path.resolve(directory, pathToCheck)

// //   const docPathExists = await pathExists(docPath)
// //   const pathToCheckExists = await pathExists(pathToCheck)
// //   const resolvedPathExists = await pathExists(resolvedPath)

// //   // console.log('docPath: ', docPath)
// //   // console.log('pathToCheck: ', pathToCheck)
// //   // console.log('resolvedPath: ', resolvedPath)
// //   // console.log(docPathExists, pathToCheckExists, resolvedPathExists)

// //   // if (pathToCheck.match(/.{0,2}\//)) {
// //   //   console.log()
// //   // }
// // })

// // ipcMain.handle('getResolvedPath', async (event, basePath, filepath) => {
// //   return path.resolve(basePath, filepath)
// // })

// // ipcMain.handle('getParsedPath', async (event, filepath) => {
// //   return path.parse(filepath)
// // })

// // ipcMain.handle('ifPathExists', async (event, filepath) => {
// //   const exists = await pathExists(filepath)
// //   return { path: filepath, exists: exists }
// // })


// // ipcMain.handle('getFileById', async (event, id, encoding) => {

// //   // Get path of file with matching id
// //   const filePath = store.store.contents.find((f) => f.id == id).path

// //   // Load file and return
// //   let file = await readFile(filePath, encoding)
// //   return file
// // })

// // ipcMain.handle('pathJoin', async (event, path1, path2) => {
// //   return path.join(path1, path2)
// // })


/**
 * Save the selected doc
 */
async function saveDoc(action, win) {
  try {

    // Try to write file
    await fsExtra.writeFile(action.doc.path, action.data, 'utf8');

    // If save is successful, forward the original action
    // along with save outcome.
    store.dispatch({ ...action, saveOutcome: "saved" }, win);

  } catch (err) {

    // If save is unsuccessful, forward the original action
    // along with save outcome.
    // This shouldn't happen, but we catch it just in case.
    store.dispatch({ ...action, saveOutcome: "failed" }, win);
  }
}


function getTitleFromDoc(data) {
  const { data: frontMatter, content, isEmpty } = matter__default["default"](data);

  // Get first header in content
  // https://regex101.com/r/oR5sec/1

  // Try to get title from front matter
  if (!isEmpty && frontMatter.title) return frontMatter.title

  // Try to get title from first header in content
  const firstHeaderInContent = content.match(/^#{1,6}[ |\t]*(.*)$/m);
  if (firstHeaderInContent) return firstHeaderInContent[1]

  // Try to get title from first 1-3 words of the doc
  // Demo: https://regex101.com/r/QmWS6c/1
  let firstWords = content.match(/^(\w+\s?){1,3}/)[0];
  if (firstWords) {
    // If last character is whitespace, trim it
    firstWords = firstWords.replace(/\s$/, '');
    return firstWords
  }

  // Else, return 'Untitled'
  return 'Untitled'

}


/**
 * Show 'Save As' dialog
 */
async function saveDocAs(action, win) {

  const project = global.state().projects.byId[win.projectId];

  // Suggested path varies depending on whether doc is new.
  const defaultPath = action.isNewDoc ?
    `${project.directory}/${getTitleFromDoc(action.data)}.md` :
    action.doc.path;

  const { filePath, canceled } = await electron.dialog.showSaveDialog(win, {
    defaultPath
  });

  if (canceled) {

    // Forward original action, 
    // with 'cancelled' saveOutcome
    store.dispatch({ ...action, saveOutcome: "cancelled" }, win);

  } else {

    try {

      // Try to write file
      await fsExtra.writeFile(filePath, action.data, 'utf8');

      // If save is successful, forward the original action
      // along with save outcome, and chosen save path.
      store.dispatch({
        ...action,
        saveOutcome: "saved",
        saveToPath: filePath
      }, win);

    } catch (err) {

      // If save is unsuccessful, forward the original action
      // along with save outcome.
      // This shouldn't happen, but we catch it just in case.
      store.dispatch({ ...action, saveOutcome: "failed" }, win);

    }
  }
}


/**
 * 
 * @param {*} action - With type, and assorted optional properties. 
 */
async function promptToSaveChangesThenForwardAction(action, win) {

  const project = global.state().projects.byId[win.projectId];

  // Prompt's wording depends on whether doc is new...
  const message = action.isNewDoc ?
    'Do you want to save the changes you made to the new document?' :
    `Do you want to save the changes you made to ${action.outgoingDoc.path.slice(action.outgoingDoc.path.lastIndexOf('/') + 1)}?`;

  // Show prompt
  const { response } = await electron.dialog.showMessageBox(win, {
    message,
    detail: "Your changes will be lost if you don't save them.",
    type: "warning",
    buttons: ["Save", "Don't Save", "Cancel"],
    defaultId: 0,
  });

  // What button did the user select?
  const userSelectedSave = response == 0;
  const userSelectedDontSave = response == 1;
  const userSelectedCancel = response == 2;

  if (userSelectedSave) {

    // User selected "Save"...

    // If doc is new, show "Save As" flow
    // Else just save.
    if (action.isNewDoc) {

      // "Save As" prompt

      const { filePath, canceled } = await electron.dialog.showSaveDialog(window, {
        defaultPath: `${project.directory}/Untitled.md`
      });

      if (canceled) {

        // Forward original action, 
        // with 'cancelled' saveOutcome
        store.dispatch({ ...action, saveOutcome: "cancelled" }, win);

      } else {

        // Save file
        await fsExtra.writeFile(filePath, action.outgoingDocData, 'utf8');

        // Then forward the original action, 
        // along with save outcome
        store.dispatch({ ...action, saveOutcome: "saved" }, win);
      }

    } else {

      try {

        // Try to save the doc. 
        await fsExtra.writeFile(action.outgoingDoc.path, action.outgoingDocData, 'utf8');

        // If save is successful, forward the original action
        // along with save outcome.
        store.dispatch({ ...action, saveOutcome: "saved" }, win);

      } catch (err) {

        // If save is unsuccessful, forward the original action
        // along with save outcome.
        // This shouldn't happen, but we catch it just in case.
        store.dispatch({ ...action, saveOutcome: "failed" }, win);

      }
    }

  } else if (userSelectedDontSave) {

    // User selected "Don't Save"...
    // Forward the original action,
    // along with save outcome.

    store.dispatch({ ...action, saveOutcome: "dontSave" }, win);

  } else if (userSelectedCancel) {

    // User selected "Cancel"...
    // Forward the original action,
    // along with save outcome.

    store.dispatch({ ...action, saveOutcome: "cancelled" }, win);

  }
}



/**
 * Return filename with incremented integer suffix. Used when moving files to avoid overwriting files of same name in destination directory, ala macOS. Looks to see if other files in same directory already have same name +_ integer suffix, and if so, increments.
 * Original:      /Users/Susan/Notes/ship.jpg
 * First copy:    /Users/Susan/Notes/ship 2.jpg
 * Second copy:   /Users/Susan/Notes/ship 3.jpg
 * @param {*} origName 
 */
function getIncrementedFileName(origPath) {

  const directory = path__default["default"].dirname(origPath); // /Users/Susan/Notes
  const extension = path__default["default"].extname(origPath); // .jpg
  const name = path__default["default"].basename(origPath, extension); // ship

  const allFilesInDirectory = fsExtra.readdirSync(directory);

  let increment = 2;

  // Basename in `path` is filename + extension. E.g. `ship.jpg`
  // https://nodejs.org/api/path.html#path_path_basename_path_ext
  let newBase = '';

  // Keep looping until we find incremented name that's not already used
  // Most of time this will be `ship 2.jpg`.
  while (true) {
    newBase = `${name} ${increment}${extension}`; // ship 2.jpg
    const alreadyExists = allFilesInDirectory.includes(newBase);
    if (alreadyExists) {
      increment++;
    } else {
      break
    }
  }

  // /Users/Susan/Notes/ship 2.jpg
  return path__default["default"].format({
    dir: directory,
    base: newBase
  })
}

const ______________________________ = new electron.MenuItem({ type: 'separator' });

function create$6() {
 
  return new electron.MenuItem({
    label: electron.app.name,
    submenu: [
      { role: 'about' },
      ______________________________,
      new electron.MenuItem({
        id: 'app-preferences',
        label: 'Preferences...',
        accelerator: 'CmdOrCtrl+,',
        click() {
          const state = global.state();
          const prefsIsAlreadyOpen = state.prefs.isOpen;
          const prefsIsNotFocused = state.focusedWindowId !== 'preferences';
          if (prefsIsAlreadyOpen) {
            if (prefsIsNotFocused) {
              global.store.dispatch({ type: 'FOCUS_PREFERENCES_WINDOW' });
            }
          } else {
            global.store.dispatch({ type: 'OPEN_PREFERENCES' });
          }
        }
      }),
      ______________________________,
      { role: 'services', submenu: [] },
      ______________________________,
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      ______________________________,
      { role: 'quit' }
    ]
  })
}

/**
 * Disable all child menu items of the specified menu
 * @param appMenu - Instance of the top-level app menu
 * @param id - Menu ID. E.g. "view-sourceMode"
 * @param enabled - Boolean
 */
function setMenuEnabled(id, enabled) {
  const appMenu = electron.Menu.getApplicationMenu();
  const menu = appMenu.getMenuItemById(id);
  if (menu.type !== "submenu") return
  const childItems = Object.values(menu.submenu.commandsMap);
  childItems.forEach((child) => {
    child.enabled = enabled;
    // Handle grand-children also
    // TODO: Tried running this recursively but hit infinite loop. 
    // Fix. As-is, this only goes one level deep.
    if (child.type == "submenu") {
      Object.values(child.submenu.commandsMap).forEach((grandchild) => grandchild.enabled = enabled);
    }
  });
}

function isMoveToTrashEnabled() {
  const state = global.state();
  const project = state.projects.byId[state.focusedWindowId];
  const sideBarIsOpen = project?.sidebar.isOpen;
  const selectedTab = project?.sidebar.tabsById[project?.sidebar.activeTabId];
  const fileIsSelectedInSidebar = selectedTab?.selected.length;
  return sideBarIsOpen && fileIsSelectedInSidebar
}

function create$5() {

  return new electron.MenuItem({
    label: 'File',
  id: "file",
    submenu: [
  
      new electron.MenuItem({
        label: 'New Document',
        id: 'file-newDocument',
        accelerator: 'CmdOrCtrl+N',
        async click(item, focusedWindow) {
          focusedWindow.webContents.send('mainRequestsCreateNewDocInFocusedPanel');
        }
      }),
  
      new electron.MenuItem({
        label: 'New Editor',
        id: 'file-newEditor',
        accelerator: 'CmdOrCtrl+T',
        async click(item, focusedWindow) {
          
          const state = global.state();
          const project = state.projects.byId[state.focusedWindowId];
        
          // Create new panel to right of the current focused panel
          global.store.dispatch({
            type: 'OPEN_NEW_PANEL',
            docId: 'newDoc',
            panelIndex: project.focusedPanelIndex + 1
          }, focusedWindow);
        }
      }),
  
      new electron.MenuItem({
        label: 'New Window',
        id: 'file-newWindow',
        enabled: true,
        accelerator: 'CmdOrCtrl+Shift+N',
        async click(item, focusedWindow) {
          global.store.dispatch({ type: 'CREATE_NEW_PROJECT' });
        }
      }),
  
      ______________________________,
  
      new electron.MenuItem({
        label: 'Open Project...',
        id: 'file-openProject',
        accelerator: 'CmdOrCtrl+Shift+O',
        async click(item, focusedWindow) {
          global.store.dispatch(await selectProjectDirectoryFromDialog(), focusedWindow);
        }
      }),
  
      ______________________________,
  
      new electron.MenuItem({
        label: 'Save',
        id: 'file-save',
        accelerator: 'CmdOrCtrl+S',
        click(item, focusedWindow) {
          const state = global.state();
          const project = state.projects.byId[state.focusedWindowId];
          const panel = project?.panels[project?.focusedPanelIndex];
          if (panel?.unsavedChanges) {
            focusedWindow.webContents.send('mainRequestsSaveFocusedPanel');
          }
        }
      }),
  
      new electron.MenuItem({
        label: 'Save As',
        id: 'file-saveAs',
        accelerator: 'CmdOrCtrl+Shift+S',
        click(item, focusedWindow) {
          focusedWindow.webContents.send('mainRequestsSaveAsFocusedPanel');
        }
      }),
  
      new electron.MenuItem({
        label: 'Save All',
        id: 'file-saveAll',
        accelerator: 'CmdOrCtrl+Alt+S',
        click(item, focusedWindow) {
          focusedWindow.webContents.send('mainRequestsSaveAll');
        }
      }),
  
      new electron.MenuItem({
        label: 'Move to Trash',
        id: 'file-moveToTrash',
        accelerator: 'CmdOrCtrl+Backspace',
        async click(item, focusedWindow) {
      
          // Get selected file paths
          const state = global.state();
          const project = state.projects.byId[state.focusedWindowId];
          const watcher = global.watchers.find((w) => w.id == focusedWindow.projectId);
  
          const activeSidebarTab = project.sidebar.tabsById[project.sidebar.activeTabId];
          let filePathsToDelete = [];
          activeSidebarTab.selected.forEach((id) => {
            const filepath = watcher.files.byId[id]?.path;
            filePathsToDelete.push(filepath);
          });
      
          // Delete
          await Promise.all(
            filePathsToDelete.map(async (filepath) => {
              await remove(filepath);
            })
          );
        }
      }),
  
      ______________________________,
  
      new electron.MenuItem({
        label: 'Close Editor',
        id: 'file-closeEditor',
        accelerator: 'CmdOrCtrl+W',
        click(item, focusedWindow) {
      
          const state = global.state();
          const project = state.projects.byId[state.focusedWindowId];
          const prefsIsFocused = state.focusedWindowId == 'preferences';  
  
          // In dev mode, we can get into state where there's no focused window, and/or no project. I think it may happen when dev tools is open in a panel. Check before proceeding, or we'll get errors.
          if (!focusedWindow || !project) return
      
          // If prefs is open, Cmd-W should close it.
          // Else, if there are multiple panels open, close focused one. 
          if (prefsIsFocused) {
            focusedWindow.close();
          } else if (project.panels.length >= 1) {
            focusedWindow.webContents.send('mainRequestsCloseFocusedPanel');
          }
        }
      }),
  
      new electron.MenuItem({
        label: 'Close Window',
        id: 'file-closeWindow',
        accelerator: 'CmdOrCtrl+Shift+W',
        click(item, focusedWindow) {
          focusedWindow.close();
        }
      })
    ]
  })
}




function onStateChanged$4(state, oldState, project, oldProject,panel, prefsIsFocused, appMenu) {
  
  /* --------------------------------- Update --------------------------------- */

  const isProjectDirectoryDefined = project?.directory;

  // Disable all and return if project directory is not yet defined. 
  if (!isProjectDirectoryDefined) {
    setMenuEnabled("file", false);
    return
  }

  appMenu.getMenuItemById('file-newDocument').enabled = project !== undefined;
  appMenu.getMenuItemById('file-newEditor').enabled = project !== undefined;
  // appMenu.getMenuItemById('file-newWindow').enabled = true
  
  appMenu.getMenuItemById('file-openProject').enabled = project !== undefined;
  
  appMenu.getMenuItemById('file-save').enabled = project !== undefined;
  appMenu.getMenuItemById('file-saveAs').enabled = project !== undefined;
  appMenu.getMenuItemById('file-saveAll').enabled = project !== undefined;
  appMenu.getMenuItemById('file-moveToTrash').enabled = isMoveToTrashEnabled();
  
  appMenu.getMenuItemById('file-closeEditor').enabled = panel !== undefined;
  // appMenu.getMenuItemById('file-closeWindow').label = prefsIsFocused ? 'Winder' : 'Close Window'
  // appMenu.getMenuItemById('file-closeWindow').accelerator = prefsIsFocused ? 'CmdOrCtrl+W' : 'CmdOrCtrl+Shift+W',
  appMenu.getMenuItemById('file-closeWindow').enabled = prefsIsFocused || project !== undefined;

}

function create$4() {

  return new electron.MenuItem({
    label: 'Edit',
    id: 'edit',
    submenu: [
  
      new electron.MenuItem({
        label: 'Undo',
        id: 'edit-undo',
        accelerator: 'CmdOrCtrl+Z',
        selector: 'undo:'
      }),
  
      new electron.MenuItem({
        label: 'Redo',
        id: 'edit-redo',
        accelerator: 'CmdOrCtrl+Shift+Z',
        selector: 'redo:'
      }),
  
      ______________________________,
  
      new electron.MenuItem({
        label: 'Cut',
        id: 'edit-cut',
        accelerator: 'CmdOrCtrl+X',
        selector: 'cut:'
      }),
  
      new electron.MenuItem({
        label: 'Copy',
        id: 'edit-copy',
        accelerator: 'CmdOrCtrl+C',
        selector: 'copy:'
      }),
  
      new electron.MenuItem({
        label: 'Paste',
        id: 'edit-paste',
        accelerator: 'CmdOrCtrl+V',
        selector: 'paste:'
      }),
  
      new electron.MenuItem({
        label: 'Paste as Plain Text',
        id: 'edit-pasteAsPlainText',
        accelerator: 'CmdOrCtrl+Shift+Alt+V',
        selector: 'paste:',
      }),
  
      new electron.MenuItem({
        label: 'Select All',
        id: 'edit-selectAll',
        accelerator: 'CmdOrCtrl+A',
        selector: 'selectAll:'
      }),
  
      ______________________________,
  
      new electron.MenuItem({
        label: 'Find in Files',
        id: 'edit-findInFiles',
        accelerator: 'CmdOrCtrl+Shift+F',
        click(item, focusedWindow) {
          // Tell Search tab to open. And if there's text selected in 
          // the active editor instance, make it the query value.
          focusedWindow.webContents.send('findInFiles');
        }
      }),
  
      new electron.MenuItem({
        label: 'Replace in Files',
        id: 'edit-replaceInFiles',
        accelerator: 'CmdOrCtrl+Shift+R',
        click(item, focusedWindow) {
          focusedWindow.webContents.send('replaceInFiles');
        }
      }),
  
      ______________________________,
  
      {
        label: 'Speech',
        submenu: [
          { role: 'startspeaking' },
          { role: 'stopspeaking' }
        ]
      }
  
    ]
  })
}




function onStateChanged$3(state, oldState, project, oldProject, panel, prefsIsFocused, appMenu) {
  
  /* --------------------------------- Update --------------------------------- */

  const isProjectDirectoryDefined = project?.directory;

  // Disable all and return if project directory is not yet defined. 
  if (!isProjectDirectoryDefined) {
    setMenuEnabled("edit", false);
    return
  }

  const focusedSectionId = project?.focusedSectionId;
  const isAProjectWindowFocused = project !== undefined;
  const isAPanelFocused = panel && focusedSectionId == 'editor';

  appMenu.getMenuItemById('edit-undo').enabled = isAPanelFocused;
  appMenu.getMenuItemById('edit-redo').enabled = isAPanelFocused;

  appMenu.getMenuItemById('edit-cut').enabled = isAPanelFocused;
  appMenu.getMenuItemById('edit-copy').enabled = isAPanelFocused;
  appMenu.getMenuItemById('edit-paste').enabled = isAPanelFocused;
  appMenu.getMenuItemById('edit-pasteAsPlainText').enabled = isAPanelFocused;
  appMenu.getMenuItemById('edit-selectAll').enabled = isAPanelFocused;

  appMenu.getMenuItemById('edit-findInFiles').enabled = isAProjectWindowFocused;
  appMenu.getMenuItemById('edit-replaceInFiles').enabled = isAProjectWindowFocused;

}

// function isMoveToTrashEnabled() {
//   const state = global.state()
//   const project = state.projects.byId[state.focusedWindowId]
//   const sideBarIsOpen = project?.sidebar.isOpen
//   const selectedTab = project?.sidebar.tabsById[project?.sidebar.activeTabId]
//   const fileIsSelectedInSidebar = selectedTab?.selected.length
//   return sideBarIsOpen && fileIsSelectedInSidebar
// }

function create$3() {
  return new electron.MenuItem({
    label: 'Select',
    id: 'select',
    submenu: [      
      new electron.MenuItem({
        label: 'Select Next Entity',
        id: 'select-selectNextEntity',
        accelerator: 'Alt+Tab',
        async click(item, focusedWindow) {
          focusedWindow.webContents.send('editorCommand', 'selectNextEntity');
        }
      }),
      new electron.MenuItem({
        label: 'Select Previous Entity',
        id: 'select-selectPrevEntity',
        accelerator: 'Shift+Alt+Tab',
        async click(item, focusedWindow) {
          focusedWindow.webContents.send('editorCommand', 'selectPrevEntity');
        }
      }),
      ______________________________,
      new electron.MenuItem({
        label: 'Add Next Occurence',
        id: 'select-selectNextOccurence',
        accelerator: 'Cmd+D',
        async click(item, focusedWindow) {
          focusedWindow.webContents.send('editorCommand', 'selectNextOccurence');
        }
      }),
      ______________________________,
      new electron.MenuItem({
        label: 'Select Line',
        id: 'select-selectLine',
        accelerator: 'Cmd+L',
        async click(item, focusedWindow) {
          focusedWindow.webContents.send('editorCommand', 'selectLine');
        }
      }),

      new electron.MenuItem({
        label: 'Cut Line',
        id: 'select-cutLine',
        accelerator: 'Cmd+X',
        async click(item, focusedWindow) {
          focusedWindow.webContents.send('editorCommand', 'cutLine');
        }
      }),
      new electron.MenuItem({
        label: 'Delete Line',
        id: 'select-deleteLine',
        accelerator: 'Cmd+Shift+K',
        async click(item, focusedWindow) {
          focusedWindow.webContents.send('editorCommand', 'deleteLine');
        }
      }),
      new electron.MenuItem({
        label: 'Duplicate Line',
        id: 'select-duplicateLine',
        accelerator: 'Shift+Alt+Down',
        async click(item, focusedWindow) {
          focusedWindow.webContents.send('editorCommand', 'duplicateLine');
        }
      }),
      new electron.MenuItem({
        label: 'Move Line Up',
        id: 'select-moveLineUp',
        accelerator: 'Alt+Up',
        async click(item, focusedWindow) {
          focusedWindow.webContents.send('editorCommand', 'moveLineUp');
        }
      }),
      new electron.MenuItem({
        label: 'Move Line Down',
        id: 'select-moveLineDown',
        accelerator: 'Alt+Down',
        async click(item, focusedWindow) {
          focusedWindow.webContents.send('editorCommand', 'moveLineDown');
        }
      }),
      ______________________________,
      new electron.MenuItem({
        label: 'Add Cursor to Previous Line',
        id: 'select-addCursorToPrevLine',
        accelerator: 'Cmd+Alt+Up',
        async click(item, focusedWindow) {
          focusedWindow.webContents.send('editorCommand', 'addCursorToPrevLine');
        }
      }),
      new electron.MenuItem({
        label: 'Add Cursor to Next Line',
        id: 'select-addCursorToNextLine',
        accelerator: 'Cmd+Alt+Down',
        async click(item, focusedWindow) {
          focusedWindow.webContents.send('editorCommand', 'addCursorToNextLine');
        }
      }),
    ]
  })
}



/**
 * Update menu when state changes
 */
function onStateChanged$2(state, oldState, project, oldProject, panel, prefsIsFocused, appMenu) {
  
  /* --------------------------------- Update --------------------------------- */
  
  const isProjectDirectoryDefined = project?.directory;
  const focusedSectionId = project?.focusedSectionId;
  const editorIsFocused = focusedSectionId == "editor";
    
  // Disable all and return if project directory is not yet defined. 
  // Disable all when editor is not focused.
  if (!isProjectDirectoryDefined || !editorIsFocused) {
    setMenuEnabled("select", false);
  } else {
    setMenuEnabled("select", true);
  }
}

function create$2() {

  return new electron.MenuItem({
    label: 'Format',
    id: "format",
    submenu: [

      new electron.MenuItem({
        label: 'Plain Text',
        id: 'format-plaintext',
        accelerator: 'Cmd+Shift+P',
        click(item, focusedWindow) {
          focusedWindow.webContents.send('setFormat', 'plainText');
        }
      }),

      ______________________________,

      new electron.MenuItem({
        label: 'Heading',
        id: 'format-heading',
        accelerator: 'Cmd+Shift+H',
        // registerAccelerator: false,
        click(item, focusedWindow) {
          focusedWindow.webContents.send('setFormat', 'heading');
        }
      }),

      ______________________________,

      new electron.MenuItem({
        label: 'Strong',
        id: 'format-strong',
        accelerator: 'Cmd+B',
        click(item, focusedWindow) {
          focusedWindow.webContents.send('setFormat', 'strong');
        }
      }),

      new electron.MenuItem({
        label: 'Emphasis',
        id: 'format-emphasis',
        accelerator: 'Cmd+I',
        click(item, focusedWindow) {
          focusedWindow.webContents.send('setFormat', 'emphasis');
        }
      }),

      new electron.MenuItem({
        label: 'Code',
        id: 'format-code',
        accelerator: 'Cmd+Shift+D',
        click(item, focusedWindow) {
          focusedWindow.webContents.send('setFormat', 'code');
        }
      }),

      new electron.MenuItem({
        label: 'Strikethrough',
        id: 'format-strikethrough',
        accelerator: 'Cmd+Shift+X',
        click(item, focusedWindow) {
          focusedWindow.webContents.send('setFormat', 'strikethrough');
        }
      }),

      ______________________________,

      new electron.MenuItem({
        label: 'Link',
        id: 'format-link',
        accelerator: 'Cmd+K',
        click(item, focusedWindow) {
          focusedWindow.webContents.send('setFormat', 'link');
        }
      }),

      new electron.MenuItem({
        label: 'Image',
        id: 'format-image',
        accelerator: 'Cmd+G',
        click(item, focusedWindow) {
          focusedWindow.webContents.send('setFormat', 'image');
        }
      }),

      new electron.MenuItem({
        label: 'Footnote',
        id: 'format-footnote',
        accelerator: 'Cmd+Alt+T', // TODO: Figure something better
        click(item, focusedWindow) {
          focusedWindow.webContents.send('setFormat', 'footnote');
        }
      }),

      new electron.MenuItem({
        label: 'Citation',
        id: 'format-citation',
        accelerator: 'Cmd+Shift+C',
        click(item, focusedWindow) {
          focusedWindow.webContents.send('setFormat', 'citation');
        }
      }),

      ______________________________,

      new electron.MenuItem({
        label: 'Unordered List',
        id: 'format-ul',
        accelerator: 'Cmd+Shift+L',
        click(item, focusedWindow) {
          focusedWindow.webContents.send('setFormat', 'ul');
        }
      }),

      new electron.MenuItem({
        label: 'Ordered List',
        id: 'format-ol',
        accelerator: 'Cmd+Alt+L',
        click(item, focusedWindow) {
          focusedWindow.webContents.send('setFormat', 'ol');
        }
      }),

      ______________________________,

      new electron.MenuItem({
        label: 'Task List',
        id: 'format-taskList',
        accelerator: 'Cmd+Shift+T',
        click(item, focusedWindow) {
          focusedWindow.webContents.send('setFormat', 'taskList');
        }
      }),

      new electron.MenuItem({
        label: 'Toggle Checked',
        id: 'format-taskChecked',
        accelerator: 'Alt+Enter',
        click(item, focusedWindow) {
          focusedWindow.webContents.send('setFormat', 'taskChecked');
        }
      }),

      ______________________________,

    ]
  })
}



/**
 * Update menu when state changes
 */
function onStateChanged$1(state, oldState, project, oldProject, panel, prefsIsFocused, appMenu) {


  /* --------------------------------- Update --------------------------------- */

  const isProjectDirectoryDefined = project?.directory;

  // Disable all and return if project directory is not yet defined. 
  if (!isProjectDirectoryDefined) {
    setMenuEnabled("format", false);
    return
  }

  // Else, disable all if 1) editor is not focused, or 2) doc is not markdown.
  const watcher = global.watchers.find((watcher) => watcher.id == state.focusedWindowId);
  const activeDoc = watcher?.files?.byId?.[panel?.docId];

  const isActiveDocMarkdownAndEditorFocused =
    activeDoc?.contentType == 'text/markdown' &&
    project?.focusedSectionId == 'editor';

  // Set enabled on all
  setMenuEnabled("format", isActiveDocMarkdownAndEditorFocused);

  // Strikethrough menu item visibility is driven by a preference.
  appMenu.getMenuItemById('format-strikethrough').visible = state.markdown.strikethrough;

}

const isMac = process.platform === 'darwin';

function create$1() {

  return new electron.MenuItem({
    label: 'View',
    id: 'view',
    submenu: [

      new electron.MenuItem({
        label: 'Source mode',
        id: 'view-sourceMode',
        type: 'checkbox',
        accelerator: 'CmdOrCtrl+/',
        click(item, focusedWindow) {
          if (focusedWindow) {
            global.store.dispatch({
              type: 'SET_SOURCE_MODE',
              enabled: !global.state().sourceMode,
            }, focusedWindow);
          }
        }
      }),

      // new MenuItem({
      //   label: 'Toggle Frontmatter',
      //   id: 'view-frontmatter',
      //   type: 'checkbox',
      //   accelerator: 'CmdOrCtrl+Shift+M',
      //   click(item, focusedWindow) {

      //     const state = global.state()
      //     const project = state.projects.byId[state.focusedWindowId]
      //     const panel = project?.panels[project?.focusedPanelIndex]
      //     const watcher = global.watchers.find((watcher) => watcher.id == state.focusedWindowId)
      //     const activeDoc = watcher.files.byId[panel.docId]

      //     if (focusedWindow) {
      //       console.log(global.state().frontMatterCollapsed)
      //       global.store.dispatch({
      //         type: 'SET_FRONT_MATTER_COLLAPSED',
      //         value: !global.state().frontMatterCollapsed,
      //       }, focusedWindow)
      //     }
      //   }
      // }),

      ______________________________,

      new electron.MenuItem({
        label: 'Sidebar',
        id: 'view-sidebar',
        type: 'checkbox',
        accelerator: 'CmdOrCtrl+Alt+B',
        click(item, focusedWindow) {
          const state = global.state();
          const project = state.projects.byId[state.focusedWindowId];
          global.store.dispatch({
            type: 'SIDEBAR_SET_OPEN_CLOSED',
            value: !project.sidebar.isOpen
          }, focusedWindow);
        }
      }),

      ______________________________,

      new electron.MenuItem({
        label: 'Project',
        id: 'view-project',
        type: 'checkbox',
        accelerator: 'Cmd+1',
        click(item, focusedWindow) {
          global.store.dispatch({
            type: 'SELECT_SIDEBAR_TAB_BY_ID',
            id: 'project'
          }, focusedWindow);
        }
      }),

      new electron.MenuItem({
        label: 'Documents',
        id: 'view-allDocs',
        type: 'checkbox',
        accelerator: 'Cmd+2',
        click(item, focusedWindow) {
          global.store.dispatch({
            type: 'SELECT_SIDEBAR_TAB_BY_ID',
            id: 'allDocs'
          }, focusedWindow);
        }
      }),

      new electron.MenuItem({
        label: 'Most Recent',
        id: 'view-mostRecent',
        type: 'checkbox',
        accelerator: 'Cmd+3',
        click(item, focusedWindow) {
          global.store.dispatch({
            type: 'SELECT_SIDEBAR_TAB_BY_ID',
            id: 'mostRecent'
          }, focusedWindow);
        }
      }),

      new electron.MenuItem({
        label: 'Tags',
        id: 'view-tags',
        type: 'checkbox',
        accelerator: 'Cmd+4',
        click(item, focusedWindow) {
          global.store.dispatch({
            type: 'SELECT_SIDEBAR_TAB_BY_ID',
            id: 'tags'
          }, focusedWindow);
        }
      }),

      new electron.MenuItem({
        label: 'Media',
        id: 'view-media',
        type: 'checkbox',
        accelerator: 'Cmd+5',
        click(item, focusedWindow) {
          global.store.dispatch({
            type: 'SELECT_SIDEBAR_TAB_BY_ID',
            id: 'media'
          }, focusedWindow);
        }
      }),

      // new MenuItem({
      //   label: 'Citations',
      //   id: 'view-citations',
      //   type: 'checkbox',
      //   accelerator: 'Cmd+6',
      //   click(item, focusedWindow) {
      //     global.store.dispatch({
      //       type: 'SELECT_SIDEBAR_TAB_BY_ID',
      //       id: 'citations'
      //     }, focusedWindow)
      //   }
      // }),

      new electron.MenuItem({
        label: 'Search',
        id: 'view-search',
        type: 'checkbox',
        accelerator: 'Cmd+6',
        click(item, focusedWindow) {
          global.store.dispatch({
            type: 'SELECT_SIDEBAR_TAB_BY_ID',
            id: 'search'
          }, focusedWindow);
        }
      }),

      ______________________________,

      new electron.MenuItem({
        label: 'Font Size',
        submenu: [
          new electron.MenuItem({
            label: 'Default',
            id: 'view-fontsize-default',
            accelerator: 'CmdOrCtrl+0',
            click() {
              global.store.dispatch({
                type: 'SET_EDITOR_FONT_SIZE',
                value: global.state().editorFont.default
              });
            }
          }),
          ______________________________,
          new electron.MenuItem({
            label: 'Increase',
            id: 'view-fontsize-increase',
            accelerator: 'CmdOrCtrl+=',
            click() {
              global.store.dispatch({ type: 'INCREASE_EDITOR_FONT_SIZE' });
            }
          }),
          new electron.MenuItem({
            label: 'Decrease',
            id: 'view-fontsize-decrease',
            accelerator: 'CmdOrCtrl+-',
            click() {
              global.store.dispatch({ type: 'DECREASE_EDITOR_FONT_SIZE' });
            }
          })
        ]
      }),

      new electron.MenuItem({
        label: 'Line Height',
        submenu: [
          new electron.MenuItem({
            label: 'Default',
            id: 'view-lineheight-default',
            accelerator: 'CmdOrCtrl+Alt+0',
            click() {
              global.store.dispatch({ type: 'SET_DEFAULT_EDITOR_LINE_HEIGHT' });
            }
          }),
          ______________________________,
          new electron.MenuItem({
            label: 'Increase',
            id: 'view-lineheight-increase',
            accelerator: 'CmdOrCtrl+Alt+=',
            click() {
              global.store.dispatch({ type: 'INCREASE_EDITOR_LINE_HEIGHT' });
            }
          }),
          new electron.MenuItem({
            label: 'Decrease',
            id: 'view-lineheight-decrease',
            accelerator: 'CmdOrCtrl+Alt+-',
            click() {
              global.store.dispatch({ type: 'DECREASE_EDITOR_LINE_HEIGHT' });
            }
          })
        ]
      }),

      ______________________________,

      // TODO: Am hiding these commands for now, because of Electron bug.
      // Labels are incorrect if accelerator uses Shift and `-` or `=` 
      // keys. For example, `Cmd+Shift+0` accelerator should display 
      // as `⇪⌘0`. Instead it’s `⌘)`. Will expose in Prefs instead.

      // new MenuItem({
      //   label: 'Line Height',
      //   submenu: [
      //     new MenuItem({
      //       label: 'Default',
      //       id: 'view-lineheight-default',
      //       accelerator: 'CmdOrCtrl+Shift+0',
      //       click() {
      //         global.store.dispatch({ type: 'SET_DEFAULT_EDITOR_LINE_HEIGHT' })
      //       }
      //     }),
      //     ______________________________,
      //     new MenuItem({
      //       label: 'Increase',
      //       id: 'view-lineheight-increase',
      //       accelerator: 'CmdOrCtrl+Shift+=',
      //       click() {
      //         global.store.dispatch({ type: 'INCREASE_EDITOR_LINE_HEIGHT' })
      //       }
      //     }),
      //     new MenuItem({
      //       label: 'Decrease',
      //       id: 'view-lineheight-decrease',
      //       accelerator: 'CmdOrCtrl+Shift+-',
      //       click() {
      //         global.store.dispatch({ type: 'DECREASE_EDITOR_LINE_HEIGHT' })
      //       }
      //     })
      //   ]
      // }),

      ______________________________,

      new electron.MenuItem({
        label: 'Dark Mode',
        submenu: [
          new electron.MenuItem({
            label: 'Match System',
            type: 'checkbox',
            checked: global.state().darkMode == 'match-system',
            click() {
              global.store.dispatch({ type: 'SET_DARK_MODE', value: 'match-system', });
            }
          }),
          ______________________________,
          new electron.MenuItem({
            label: 'Dark',
            type: 'checkbox',
            checked: global.state().darkMode == 'dark',
            click() {
              global.store.dispatch({ type: 'SET_DARK_MODE', value: 'dark' });
            }
          }),
          new electron.MenuItem({
            label: 'Light',
            type: 'checkbox',
            checked: global.state().darkMode == 'light',
            click() {
              global.store.dispatch({ type: 'SET_DARK_MODE', value: 'light' });
            }
          })
        ]
      }),

      new electron.MenuItem({
        label: 'Theme',
        id: 'view-theme',
        submenu: Object.entries(global.state().theme.installed).map(([id, theme]) => {
          return new electron.MenuItem({
            label: theme.name,
            id: `view-theme-${id}`,
            type: 'checkbox',
            checked: global.state().theme.id == id,
            click(item) {
              global.store.dispatch({ type: 'SET_THEME', id });
            }
          })
        })
      }),

      ...electron.app.isPackaged ? [] : [
        ______________________________,
        new electron.MenuItem({
          label: 'Developer',
          submenu: [
            new electron.MenuItem({
              label: 'Toggle Developer Tools',
              accelerator: isMac ? 'Alt+Command+I' : 'Ctrl+Shift+I',
              role: 'toggleDevTools',
            }),
            new electron.MenuItem({
              label: 'Reload',
              accelerator: 'CmdOrCtrl+R',
              role: 'reload'
            }),
            new electron.MenuItem({
              label: 'Toggle Grid',
              accelerator: 'CmdOrCtrl+Alt+G',
              click() {
                global.store.dispatch({
                  type: 'SET_DEVELOPER_OPTIONS',
                  options: {
                    ...global.state().developer,
                    showGrid: !global.state().developer.showGrid
                  }
                });
              }
            })
          ]
        })
      ],

    ]
  })
}



/**
 * Determine whether we need to update the menu,
 * based on what has changed.
 */
function onStateChanged(state, oldState, project, oldProject, panel, prefsIsFocused, appMenu) {

  // if (state.appStatus == 'coldStarting') {
  //   update()
  //   return
  // }

  const somethingChangedWeCareAbout =
    state.appStatus !== oldState.appStatus || 
    state.focusedWindowId !== oldState.focusedWindowId ||
    state.sourceMode !== oldState.sourceMode ||
    state.editorFont.size !== oldState.editorFont.size ||
    state.editorLineHeight.size !== oldState.editorLineHeight.size ||
    project?.sidebar.isOpen !== oldProject?.sidebar.isOpen ||
    project?.sidebar.activeTabId !== oldProject?.sidebar.activeTabId ||
    state.theme.id !== oldState.theme.id;

  if (!somethingChangedWeCareAbout) return

  /* --------------------------------- Update --------------------------------- */

  const isProjectDirectoryDefined = project?.directory;

  // Disable all and return if project directory is not yet defined. 
  if (!isProjectDirectoryDefined) {
    setMenuEnabled("view", false);
    return
  }

  // Disable most (but not all) items when preferences are focused
  if (prefsIsFocused) {
    appMenu.getMenuItemById('view-sourceMode').enabled = false;
    appMenu.getMenuItemById('view-sidebar').enabled = false;
    appMenu.getMenuItemById('view-project').enabled = false;
    appMenu.getMenuItemById('view-allDocs').enabled = false;
    appMenu.getMenuItemById('view-mostRecent').enabled = false;
    appMenu.getMenuItemById('view-tags').enabled = false;
    appMenu.getMenuItemById('view-media').enabled = false;
    appMenu.getMenuItemById('view-search').enabled = false;
    appMenu.getMenuItemById('view-fontsize-default').enabled = false;
    appMenu.getMenuItemById('view-fontsize-increase').enabled = false;
    appMenu.getMenuItemById('view-fontsize-decrease').enabled = false;
    appMenu.getMenuItemById('view-lineheight-default').enabled = false;
    appMenu.getMenuItemById('view-lineheight-increase').enabled = false;
    appMenu.getMenuItemById('view-lineheight-decrease').enabled = false;
  }

  // Enable SourceMode and SideBar toggles
  appMenu.getMenuItemById('view-sourceMode').enabled = true;
  appMenu.getMenuItemById('view-sidebar').enabled = true;

  // Always enable font-size and line-height default options. 
  appMenu.getMenuItemById('view-fontsize-default').enabled = true;
  appMenu.getMenuItemById('view-lineheight-default').enabled = true;

  // Disable increase/decrease menu items (e.g. increase font size)
  // when they're already at their thresholds (e.g. can't go higher).
  appMenu.getMenuItemById('view-fontsize-increase').enabled = state.editorFont.size < state.editorFont.max;
  appMenu.getMenuItemById('view-fontsize-decrease').enabled = state.editorFont.size > state.editorFont.min;
  appMenu.getMenuItemById('view-lineheight-increase').enabled = state.editorLineHeight.size < state.editorLineHeight.max;
  appMenu.getMenuItemById('view-lineheight-decrease').enabled = state.editorLineHeight.size > state.editorLineHeight.min;
  
  // Set check menu items. E.g. Which theme is selected.
  appMenu.getMenuItemById('view-sourceMode').checked = state.sourceMode;
  appMenu.getMenuItemById('view-sidebar').checked = project?.sidebar.isOpen;
  appMenu.getMenuItemById('view-theme').submenu.items.forEach((item) => {
    const id = item.id.replace('view-theme-', '');
    item.checked = id == state.theme.id;
  });

  // Set Sidebar menu items enabled and checked
  const sidebarTabs = ['project', 'allDocs', 'mostRecent', 'tags', 'media', 'search'];
  sidebarTabs.forEach((id) => {
    const item = appMenu.getMenuItemById(`view-${id}`);
    item.enabled = project !== undefined;
    item.checked = project?.sidebar.activeTabId == id;
  });

}

function create() {

  return new electron.MenuItem({
    label: 'Window',
    id: 'window',
    submenu: []
  })
}

/**
 * On startup, create initial menu bar, and create change listeners.
 * When state changes, we check if value we care about has changed.
 * If yes, we update the application menu.
 */
function init$2() {

  // Create menu
  const menu = new electron.Menu();
  menu.append(create$6());
  menu.append(create$5());
  menu.append(create$4());
  menu.append(create$3());
  menu.append(create$2());
  menu.append(create$1());
  menu.append(create());
  electron.Menu.setApplicationMenu(menu);
 
  // Set initial values by triggering update()
  // appMenu.update(menu)
  // fileMenu.update(menu)
  // editMenu.update(menu)
  // selectMenu.update(menu)
  // formatMenu.update(menu)
  // viewMenu.update(menu)
  // windowMenu.update(menu)

  // On state change, trigger update() 
  global.store.onDidAnyChange((state, oldState) => {

    const project = state.projects.byId[state.focusedWindowId];
    const oldProject = oldState.projects.byId[oldState.focusedWindowId];
    const panel = project?.panels[project?.focusedPanelIndex];
    const prefsIsFocused = state.focusedWindowId == 'preferences';  
    onStateChanged$4(state, oldState, project, oldProject, panel, prefsIsFocused, menu);
    onStateChanged$3(state, oldState, project, oldProject, panel, prefsIsFocused, menu);
    onStateChanged$2(state, oldState, project);
    onStateChanged$1(state, oldState, project, oldProject, panel, prefsIsFocused, menu);
    onStateChanged(state, oldState, project, oldProject, panel, prefsIsFocused, menu); //
  });  
}

/**
 * For specified path, return document details
 */
async function mapDocument(filepath, parentId, nestDepth, stats = undefined) {

	if (stats == undefined) stats = await fsExtra.stat(filepath);

	const file = {
		isDoc: true,
		isMedia: false,
		contentType: mime__default["default"].lookup(filepath), // 'text/markdown', etc
		name: '',
		path: filepath,
		id: `doc-${stats.ino}`,
		parentId: parentId,
		created: stats.birthtime.toISOString(),
		modified: stats.mtime.toISOString(),
		nestDepth: nestDepth,
		// --- Markdown-specific --- //
		// title: '',
		// excerpt: '',
		// tags: [],
		// bibliography: {
		// 	path: "",
		// 	exists: false,
		// 	isCslJson: false
		// }
	};

	// If file is markdown, get markdown-specific details
	const isMarkdown = file.contentType == "text/markdown";
	if (isMarkdown) {

		// Get front matter
		const gm = matter__default["default"].read(filepath);
	
		// Set excerpt
		// `md.contents` is the original input string passed to gray-matter, stripped of front matter.
		file.excerpt = removeMarkdown(gm.content, 350);
	
		// Set fields from front matter (if it exists)
		// gray-matter `isEmpty` property returns "true if front-matter is empty".
		const hasFrontMatter = !gm.isEmpty;
		if (hasFrontMatter) {
	
			// If `tags` exists in front matter, use it. Else, set as empty `[]`.
			file.tags = gm.data.hasOwnProperty('tags') ? gm.data.tags : [];
	
			// If tags is a single string, convert to array
			// We want to support single tag format, ala `tags: Kitten`
			// because it's supported by eleventy: 
			// https://www.11ty.dev/docs/collections/#a-single-tag-cat
			if (typeof file.tags === 'string') {
				file.tags = [file.tags];
			}
	
			// Get bibliography
			file.bibliography = await getBibliography(file, gm.data);
	
		}
	
		// Set title, if present. E.g. "Sea Level Rise"
		file.title = getTitle(gm, path__default["default"].basename(filepath));
	}

	// Set name from filename (minus file extension)
	file.name = path__default["default"].basename(filepath);
	// file.name = file.name.slice(0, file.name.lastIndexOf('.'))

	return file
}

/**
 * Set title, in following order of preference:
 * 1. From first h1 in content
 * 2. From `title` field of front matter
 * 3. Leave blank (means no title was found)
 */
function getTitle(graymatter, filename) {

	let titleFromH1 = graymatter.content.match(/^# (.*)$/m);
	if (titleFromH1) {
		return titleFromH1[1]
	} else if (graymatter.data.hasOwnProperty('title')) {
		return graymatter.data.title
	} else {
		return ''
		// return filename.slice(0, filename.lastIndexOf('.'))
	}
}


const blockQuotes = /^> /gm;
const bracketedSpans = /:::.*?:::/gm;

// New lines at start of doc
const newLines = /^\n/gm;

// Replace with space:
// - New lines in-line
// - Artifact left from list replacement
// - Extra spaces
const unwantedWhiteSpace = /\n|\t|\s{2,}/gm;

/**
 * Return content stripped of markdown characters.
 * And (optionally) trimmed down to specific character length.
 * Per: https://github.com/jonschlinkert/gray-matter#optionsexcerpt
 * @param {*} content 
 * @param {*} trimToLength 
 */
function removeMarkdown(content, trimToLength = undefined) {

	// Remove h1, if it exists. Currently atx-style only.
	let text = content.replace(/^# (.*)\n/gm, '');

	// If `trimToLength` is defined, do initial trim.
	// We will then remove markdown characters, and trim to final size.
	// We do initial trim for performance purposes: to reduce amount of
	// text that regex replacements below have to process. We add buffer
	// of 100 characters, or else trimming markdown characters could put
	// use under the specified `trimToLength` length.
	if (trimToLength) {
		text = text.substring(0, trimToLength + 100);
	}

	// Remove markdown formatting. Start with remove-markdown rules.
	// Per: https://github.com/stiang/remove-markdown/blob/master/index.js
	// Then add whatever additional changes I want (e.g. new lines).
	text = removeMd__default["default"](text)
		.replace(blockQuotes, '')
		.replace(newLines, '')         // New lines at start of line (usually doc)
		.replace(unwantedWhiteSpace, ' ')
		.replace(bracketedSpans, ' ');
	// .replace(citations, '')

	// If `trimToLength` is defined, trim to final length.
	if (trimToLength) {
		text = text.substring(0, trimToLength);
	}

	return text
}

/**
 * Return the full path to the bibliography file specified, 
 * along with details about it (e.g. does the path work).
 * @param {object} file
 * @param {object} frontmatter - Frontmatter loaded from document
 * @returns Object with absolute path to bibliography, and 
 * booleans for whether 1) it exists, and 2) if it's CSL-JSON
 */
async function getBibliography(file, frontmatter) {

	// If bibliography is not specified, check for bibliography defined in
	// a top-level `data/` directory. 
	if (!frontmatter.bibliography) {
		return { path: "", exists: false, isCslJson: false }
	}

	const absolutePath = path__default["default"].resolve(path__default["default"].dirname(file.path), frontmatter.bibliography);
	const exists = await fsExtra.existsSync(absolutePath);
	const isCslJson = path__default["default"].extname(absolutePath).slice(1).toUpperCase() == "JSON";
	
	// If specified bibliography does not exist, warn
	if (!exists) {
		console.warn(`Bibliography ${frontmatter.bibliography} not found. File name: ${file.name}.`, "— mapDocument.js");
	}

	// If format is not JSON, warn
	// TODO: Validate that the JSON is also CSL-JSON s
	
	// Specified bibliography exists. Return.
	return { path: absolutePath, exists, isCslJson }
}

/**
 * For specified path, return media file details
 */
async function mapMedia (filepath, parentId, nestDepth, projectId, stats = undefined) {

	if (stats == undefined) stats = await fsExtra.stat(filepath);
	const extension = path__default["default"].extname(filepath);
	const type = getMediaType(extension);

	const file = {
		isDoc: false,
		isMedia: true,
		contentType: mime__default["default"].lookup(filepath), // 'image/png', 'video/mp4', etc.
		name: path__default["default"].basename(filepath),
		path: filepath,
		id: `${type}-${stats.ino}`,
		parentId,
		projectId,
		created: stats.birthtime.toISOString(),
		modified: stats.mtime.toISOString(),
		nestDepth,
		// --- Media-specific --- //
		sizeInBytes: stats.size,
	};

	if (file.contentType.includes('image'))	{
		const { width, height, type: format } = sizeOf__default["default"](filepath);
		file.dimensions = { width, height };
		file.format = format;
	}

	return file
}

/**
 * For specified folder path, map the folder and it's child  
 * documents, media, and citations, and return `contents` object
 * with four arrays (one for each type).
 * @param {*} files - Reference to shared object we write changes to, and then return
 * @param {*} parentTreeItem - Tree item to add self to
 * @param {*} folderPath - Path to map
 * @param {*} stats - Optional. Can pass in stats, or if undefined, will get them in function.
 * @param {*} parentId - Optional. If undefined, we regard the folder as `root`
 * @param {*} nestDepth - Optional.
 */
async function mapFolder(files, parentTreeItem, folderPath, stats = undefined, parentId = '', nestDepth = 0) {

  // -------- New Folder -------- //

  if (!stats) stats = await fsExtra.stat(folderPath);

  // Create and populate new folder
  const folder = {
    isFolder: true,
    name: folderPath.substring(folderPath.lastIndexOf('/') + 1),
    path: folderPath,
    id: `folder-${stats.ino}`,
    parentId: parentId,
    created: stats.birthtime.toISOString(),
    modified: stats.mtime.toISOString(),
    nestDepth: nestDepth,
    // --- Folder-specific --- //
    numChildren: 0,
    numDescendants: 0,
  };

  // Add to `files`
  files.byId[folder.id] = folder;
  files.allIds.push(folder.id);

  // Populate tree details
  const treeItem = {
    id: folder.id,
    parentId: parentId,
    children: []
  };
  parentTreeItem.push(treeItem);


  // -------- Contents -------- //

  // Get everything in directory with `readdir`.
  // Returns array of `fs.Dirent` objects.
  // https://nodejs.org/api/fs.html#fs_class_fs_dirent
  let directoryContents = await fsExtra.readdir(folderPath, { withFileTypes: true });
  directoryContents = directoryContents.filter(({ name }) => !name.includes(".DS_Store"));

  await Promise.all(
    directoryContents.map(async (f) => {

      // Get path by combining folderPath with file name.
      const filepath = path__default["default"].join(folderPath, f.name);

      // Get extension
      path__default["default"].extname(f.name);

      // Determine type
      const contentType = mime__default["default"].lookup(filepath);
      const isDirectory = f.isDirectory();
      contentType && contentType.includes('markdown');
      const isMedia = contentType && contentType.includesAny('video', 'audio', 'image');

      if (isDirectory) {

        const { numDescendants } = await mapFolder(files, treeItem.children, filepath, undefined, folder.id, nestDepth + 1);

        // Increment child counters
        folder.numChildren++;
        folder.numDescendants += numDescendants;

      } else {
      // } else if (isDoc || isMedia) {

        const file = isMedia ? 
          await mapMedia(filepath, folder.id, nestDepth + 1) :
          await mapDocument(filepath, folder.id, nestDepth + 1);

        files.byId[file.id] = file;
        files.allIds.push(file.id);
        treeItem.children.push({
          id: file.id,
          parentId: folder.id,
        });

        // Increment child counters
        folder.numChildren++;
      }
    })
  );

  folder.numDescendants += folder.numChildren;

  return {
    numDescendants: folder.numDescendants
  }
}

/**
 * Map project path recursively and dispatch results to store
 * @param {*} projectPath 
 */
async function mapProject (projectPath) {

  try {

    const files = {
      allIds: [],
      byId: {},
      tree: []
    };

    // Map project path, recursively
    await mapFolder(files, files.tree, projectPath);
    
    return files
    
  } catch (err) {
    console.log(err);
  }
}

produce.enablePatches();

/**
 * Chokidar docs: https://www.npmjs.com/package/chokidar
 */
const chokidarConfig = {
  ignored: /(^|[\/\\])\../, // Ignore dotfiles
  ignoreInitial: true,
  persistent: true,
  awaitWriteFinish: {
    stabilityThreshold: 200, // 3/9: Was 400
    pollInterval: 50 // 3/9: Was 200
  }
};

class Watcher {
  constructor(id, project, window) {

    this.id = id;
    this.directory = project.directory;
    this.window = window;

    // If directory is populated, create the watcher
    if (this.directory) {
      this.start();
    }
  }

  // ------ VARIABLES ------ //

  id = ''
  directory = ''
  window = undefined

  files = {}
  chokidarInstance = undefined
  pendingChanges = []
  changeTimer = undefined


  // ------ METHODS ------ //

  /**
   * Start the chokidar instance. Called once `this.directory` is first defined.
   */
  async start() {

    // Start watcher
    this.chokidarInstance = chokidar__default["default"].watch(this.directory, chokidarConfig);

    // On any event, track changes. Some events include `stats`.
    this.chokidarInstance
      .on('change', (filePath) => this.batchChanges('change', filePath))
      .on('add', (filePath) => this.batchChanges('add', filePath))
      .on('unlink', (filePath) => this.batchChanges('unlink', filePath))
      .on('addDir', (filePath) => this.batchChanges('addDir', filePath))
      .on('unlinkDir', (filePath) => this.batchChanges('unlinkDir', filePath));

    // Map project
    this.files = await mapProject(this.directory);

    // Send initial files to browser window
    this.window.webContents.send('initialFilesFromMain', this.files);

    // Insert blank "newDoc", for new documents.
    // See mapDocument.js for structure of file
    this.files.allIds.push('newDoc');
    this.files.byId['newDoc'] = {
      isDoc: true,
      isMedia: false,
      contentType: 'text/markdown',
      name: 'untitled',
      title: 'Untitled',
      path: null,
      id: 'newDoc',
      parentId: null,
      created: null,
      modified: null,
      nestDepth: null
    };

    // Tell reducers when first project map is complete, 
    // and pass along first file. If a file as not been 
    // selected yet, reducer selects this.
    const firstDocId = this.files.allIds.find((id) => this.files.byId[id].isDoc);

    global.store.dispatch({
      type: 'PROJECT_FILES_MAPPED',
      firstDocId
    }, this.window);

    // Index files into DB
    insertAllDocsIntoDb(this.files);
  }

  changeDirectories(newDirectory) {
    this.chokidarInstance.unwatch(this.directory);
    this.directory = newDirectory;
    this.start();
  }


  /**
   * Stop the chokidar instance. Called when project is closed.
   */
  stop() {
    // TODO: Stop watcher when project is closed
    this.chokidarInstance.close();
  }


  /**
   * Create a tally of changes as they occur, and once things settle down, evaluate them. We do this because on directory changes in particular, chokidar lists each file modified, _and_ the directory modified. We don't want to trigger a bunch of file change handlers in this scenario, so we need to batch changes, so we can figure out they include directories.
   */
  debounceFunc = debounce.debounce(() => {
    this.applyChanges(this.pendingChanges);
    this.pendingChanges = []; // Reset
  }, 200) // 3/9: Was 400

  batchChanges(event, filePath, stats) {
    const change = { event: event, path: filePath };

    if (stats) change.stats = stats;

    // Push into list of pending changes
    this.pendingChanges.push(change);

    // Wait a bit, then apply the pending changes. Make the debounce timer longer if `addDir` event comes through. If it's too quick, subsequent `add` events are not caught by the timer.
    // const debounceTimer = event == 'addDir' ? 500 : 100

    this.debounceFunc();
  }


  /**
   * Take batched changes and update `files`, then send patches to associated BrowserWindow. If a directory was added or removede, remap everything.
   * @param {*} changes 
   */
  async applyChanges(changes) {

    // console.log(changes)

    const directoryWasAddedOrRemoved = changes.some((c) => c.event == 'addDir' || c.event == 'unlinkDir');

    if (directoryWasAddedOrRemoved) {

      /* 
      NOTE: This code is identical to what we do in start()
      If making changes, make sure to make them in both places.
      Could abstract into one function, but I don't know what
      to call it. `mapProject` is most logical, but already used.
      */

      // Map project
      this.files = await mapProject(this.directory);

      // Send initial files to browser window
      this.window.webContents.send('initialFilesFromMain', this.files);

      // Tell reducers when first project map is complete, 
      // and pass along first file. Reducer then sets this as
      // file that the focused panel should display.
      const firstDocId = this.files.allIds.find((id) => {
        const file = this.files.byId[id];
        return file.isDoc
      });

      global.store.dispatch({
        type: 'PROJECT_FILES_MAPPED',
        firstDocId
      }, this.window);

      // Index files into DB
      insertAllDocsIntoDb(this.files);

    } else {

      // Do not proceed if app is quitting. At this point, `this.files` is destroyed, and Immer will throw error if we try to proceed.
      if (global.state().appStatus == 'wantsToQuit') return

      // Update `files` using Immer: 

      this.files = await produce__default["default"](this.files, async (draft) => {
        for (const c of changes) {
          const ext = path__default["default"].extname(c.path);
          const parentPath = path__default["default"].dirname(c.path);
          const parentId = draft.allIds.find((id) => draft.byId[id].path == parentPath);
          const parentFolder = draft.byId[parentId];
          const parentTreeItem = findInTree(draft.tree, parentFolder.id, 'id');

          if (isDoc(ext) || isMedia(ext)) {

            switch (c.event) {

              case 'add': {
                const file = isDoc(ext) ?
                  await mapDocument(c.path, parentFolder.id, parentFolder.nestDepth + 1, c.stats) :
                  await mapMedia(c.path, parentFolder.id, parentFolder.nestDepth + 1, c.stats);
                // Add to `byId`
                draft.byId[file.id] = file;
                // Add to `allIds`
                draft.allIds.push(file.id);
                // Add to `tree`
                parentTreeItem.children.push({
                  id: file.id,
                  parentId: file.parentId,
                  // type: file.type
                });
                // Increment `numChildren` of parent folder
                parentFolder.numChildren++;
                // Recursively increment parent folder(s) `numDescendants`
                incrementNumDescendants(parentFolder);
                function incrementNumDescendants(folder) {
                  folder.numDescendants++;
                  if (folder.parentId !== '') {
                    incrementNumDescendants(draft.byId[folder.parentId]);
                  }
                }
                // Add to database (if it's a doc)
                if (isDoc(ext)) insertDocIntoDb(file);
                break
              }

              case 'change': {
                const file = isDoc(ext) ?
                  await mapDocument(c.path, parentFolder.id, parentFolder.nestDepth + 1, c.stats) :
                  await mapMedia(c.path, parentFolder.id, parentFolder.nestDepth + 1, c.stats);
                draft.byId[file.id] = file;
                // If doc, update row in db
                if (isDoc) insertDocIntoDb(file);
                break
              }

              case 'unlink': {
                const id = draft.allIds.find((id) => draft.byId[id].path == c.path);
                // Remove from `byId`
                delete draft.byId[id];
                // Remove from `allIds`
                draft.allIds.splice(draft.allIds.indexOf(id), 1);
                // Remove from `tree`
                parentTreeItem.children.splice(parentTreeItem.children.findIndex((child) => child.id == id), 1);
                // Decrement `numChidren` of parent folder
                parentFolder.numChildren--;
                // Recursively decrement parent folder(s) `numDescendants`
                decrementNumDescendants(parentFolder);
                function decrementNumDescendants(folder) {
                  folder.numDescendants--;
                  if (folder.parentId !== '') {
                    decrementNumDescendants(draft.byId[folder.parentId]);
                  }
                }
                // Delete from database (if it's a doc)
                if (isDoc(ext)) global.db.delete(id);
                break
              }
            }
          }

        }
      }, (patches, inversePatches) => {
        this.window.webContents.send('filesPatchesFromMain', patches);
      });

      // console.log(this.files, "— Watcher.js")

      global.store.dispatch({ type: 'PROJECT_FILES_UPDATED' }, this.window);
    }
  }
}




// ------ UTILITY FUNCTIONS ------ //

/**
 * For each doc found in files, add it to the sqlite database. Most important is the document body, which we need for full text search. We get it as plain text by 1) loading the doc using gray-matter, which returns `content` for us, without front matter, and 2) removing markdown formatting.
 */
function insertAllDocsIntoDb(files) {
  const filesForDb = [];
  for (const id of files.allIds) {
    // Skip the "newDoc" file
    if (id == 'newDoc') continue
    const file = files.byId[id];
    if (file.isDoc) {
      filesForDb.push(getDbReadyFile(file));
    }
  }
  // Insert the files into the db
  global.db.insertMany(filesForDb);
}

/** 
 * Insert specified file in the sqlite database. If a row with the same `file.id` already exists, it will be replaced.
 */
function insertDocIntoDb(file) {
  global.db.insert(getDbReadyFile(file));
}

/**
 * Utility function that returns an object with 1) the file's metadata, and 2) it's full text content, stripped of markdown characters, excess whitespace, etc. We'll insert this object as a row in the sql database, for later full text searching.
 * @param {*} file - Taken from `files.byId`. Has title, path, etc.
 */
function getDbReadyFile(file) {

  // Get doc text, minus any front matter
  let { content } = matter__default["default"].read(file.path);

  // Remove markdown formatting from text
  content = removeMarkdown(content);

  // Return object, ready for the db.
  return {
    id: file.id,
    name: file.name,
    title: file.title,
    path: file.path,
    body: content
  }
}

const browserWindowConfig = {
  show: false,
  width: 700,
  height: 500,
  // vibrancy: 'sidebar', // Turning off due to poor performance.
  // transparent: true,
  titleBarStyle: 'hiddenInset',
  webPreferences: {
    scrollBounce: false,
    // Security:
    allowRunningInsecureContent: false,
    contextIsolation: true,
    enableRemoteModule: false,
    nativeWindowOpen: false,
    nodeIntegration: false,
    nodeIntegrationInWorker: false,
    nodeIntegrationInSubFrames: false,
    safeDialogs: true,
    sandbox: true,
    webSecurity: true,
    webviewTag: false,
    // Preload
    preload: path__default["default"].join(__dirname, 'preload.js')
  }
};


async function createWindow(id, project) {

  const win = new electron.BrowserWindow(browserWindowConfig);
  win.projectId = id;

  // Set window background color.
  // TODO: Setting backgroundColor is currently broken. 
  // Background always renders as black, regardless of the value. 
  // Bug: https://github.com/electron/electron/issues/26842
  const backgroundColor = global.state().systemColors.windowBackgroundColor;
  if (backgroundColor) win.setBackgroundColor(backgroundColor);

  const isNewProject = project.directory == '';

  // Set size. If project directory is empty, it's a new project, and we manually set starting values. Else we restore the previous window size and position (stored in `bounds` property)/
  // Else, create a new window centered on screen.
  if (isNewProject) {
    const padding = 200;
    const displayWidth = electron.screen.getPrimaryDisplay().workAreaSize.width;
    const displayHeight = electron.screen.getPrimaryDisplay().workAreaSize.height;
    let winWidth = displayWidth - (padding * 2);
    let winHeight = displayHeight - (padding * 2);
    winWidth = winWidth > 1600 ? 1600 : winWidth;
    winHeight = winHeight > 1200 ? 1200 : winHeight;
    const offset = win.id * 20;
    const centeredX = Math.round((displayWidth - winWidth) / 2 + offset);
    const centeredY = Math.round((displayHeight - winHeight) / 2 + offset);
    win.setBounds({
      x: centeredX,
      y: centeredY,
      width: winWidth,
      height: winHeight
    }, false);
  } else {
    win.setBounds(project.window.bounds, false);

  }

  // Have to manually set this to 1.0. That should be the default, but I've had problem where something was setting it to 0.91, resulting in the UI being slightly too-small.
  // win.webContents.zoomFactor = 1.0

  // Listen for 'close' action. Can be triggered by either 1) manually closing individual window, (e.g. click close button on window, or type Cmd-W), or 2) quitting the app. 

  // If closed manually, this event is triggered twice. The first time, we prevent the default and tell webContents to save open documents. That process results in window.status being set to `safeToClose`. ProjectManager catches that state change, and tells this window to close again.
  win.on('close', async (evt) => {

    const userManuallyClosedWindow = global.state().appStatus !== 'canSafelyQuit';
    const winStatus = global.state().projects.byId[id].window.status;
    const winWantsToClose = winStatus == 'wantsToClose';
    const winIsSafeToClose = winStatus == 'safeToClose';

    // If window is closing because user manually closed it (e.g. typed Cmd-W), then check if it's safe to close yet. If not, begin that process. ProjectManager will call close again once the window is safe to close, and this time, we won't preventDefault, and the window will close.
    if (userManuallyClosedWindow && !winIsSafeToClose) {
      // Tell window to close
      evt.preventDefault();
      if (!winWantsToClose) {
        global.store.dispatch({ type: 'START_TO_CLOSE_PROJECT_WINDOW' }, win);
      }
    }
  });

  // If app is NOT quiting, we remove the project from store after closing the window. Because if the user manually closes a window, they mean to close the project. But if they quit the app, they want to their open projects to reopen, next session.
  win.on('closed', async (evt) => {
    
    const appIsNotQuiting = global.state().appStatus == 'open';
    if (appIsNotQuiting) {
      await global.store.dispatch({ type: 'REMOVE_PROJECT' }, win);
    }
    
    // If there are no other windows open, clear `focusedWindowId`
    // Unless app is quitting, in which case it's too late to modify state.
    // (Immer will throw a bug re: the object having been destroyed).
    const otherWindowsAreOpen = electron.BrowserWindow.getAllWindows().length;
    if (!otherWindowsAreOpen && appIsNotQuiting) {
      global.store.dispatch({ type: 'NO_WINDOW_FOCUSED' });
    }
  });

  // On resize or move, save bounds to state (wait 1 second to avoid unnecessary spamming). Using `debounce` package: https://www.npmjs.com/package/debounce
  win.on('resize', debounce.debounce(() => { saveWindowBoundsToState(win); }, 1000));
  win.on('move', debounce.debounce(() => { saveWindowBoundsToState(win); }, 1000));

  // On focus, set `focusedWindowId` to win.id
  win.on('focus', () => {
    global.store.dispatch({ type: 'FOCUSED_WINDOW' }, win);
  });

  /*
  On blur, wait a beat. If the user has clicked on another Gambier window it will fire `FOCUSED_WINDOW` and set itself as the `focusedWindowId`. In which case we don't want to do anything. But if the user has clicked outside the app, `focusedWindowId` will still equal this win.projectId after the beat. In which case, set `focusedWindowId` to zero, which we take to mean that the app is in the background.
  */
  win.on('blur', async () => {
    await wait(50);
    if (global.state().focusedWindowId == win.projectId) {
      global.store.dispatch({ type: 'NO_WINDOW_FOCUSED' });
    }
  });

  // De-focus window when a sheet is open
  win.on('sheet-begin', () => {
    global.store.dispatch({ type: 'NO_WINDOW_FOCUSED' });
  });

  // Focus window when a sheet closes
  win.on('sheet-end', () => {
    global.store.dispatch({ type: 'FOCUSED_WINDOW' }, win);
  });

  // Open DevTools
  if (!electron.app.isPackaged) win.webContents.openDevTools();
 
  // Load index.html (old way)
  // await win.loadFile(path.join(__dirname, 'index.html'), {
  
  // Load local index.html file
  // "Electron by default allows local resources to be accessed by render processes only when their html files are loaded from local sources with the file:// protocol for security reasons."

  await win.loadURL(url__default["default"].format({
    pathname: 'index.html',
    protocol: 'file:',
    slashes: true,
    query: {
      id: win.projectId
    }
  }));

  // Save window bounds
  saveWindowBoundsToState(win);

  // Set project window status to 'open'
  global.store.dispatch({
    type: 'OPENED_PROJECT_WINDOW',
  }, win);

  return win
}

/**
 * Save window bounds to state, so we can restore after restart.
 */
function saveWindowBoundsToState(win) {
  global.store.dispatch({
    type: 'SAVE_PROJECT_WINDOW_BOUNDS',
    windowBounds: win.getBounds()
  }, win);
}

// let projects = {
//   allIds: [],
//   byId: {}
// }

function init$1() {

  // ------ SETUP CHANGE LISTENERS ------ //

  global.store.onDidAnyChange(async (state, oldState) => {

    const projectAdded = state.projects.allIds.length > oldState.projects.allIds.length;

    const projectRemoved = state.projects.allIds.length < oldState.projects.allIds.length;

    const aProjectDirectoryHasChanged = stateHasChanged(global.patches, ['projects', 'byId', 'directory']);

    const aWindowIsSafeToClose = stateHasChanged(global.patches, ['window', 'status'], 'safeToClose');

    const appIsQuitting = propHasChangedTo('appStatus', 'wantsToQuit', state, oldState);


    // If project added, create a Window and Watcher 
    // Determine new project by comparing new and old `allIds`.
    if (projectAdded) {
      const id = getArrayDiff(state.projects.allIds, oldState.projects.allIds)[0];
      createWindowAndWatcher(state, id);
    }

    // If project directory changed, update (or start) the Watcher
    if (aProjectDirectoryHasChanged) {
      const projectIds = getIdsOfProjectsWhoseDirectoriesHaveChanged(state, oldState);
      projectIds.forEach((id) => {
        const project = state.projects.byId[id];
        const watcher = global.watchers.find((watcher) => watcher.id == id);
        const watcherIsRunning = watcher.directory !== '';
        if (!watcherIsRunning) {
          watcher.directory = project.directory;
          watcher.start();
        } else {
          watcher.changeDirectories(project.directory);
        }
      });
    }

    // If project removed, stop the watcher, then remove from `global.watchers`.
    // Determine removed project by comparing old and new `allIds`.
    if (projectRemoved) {
      const id = getArrayDiff(oldState.projects.allIds, state.projects.allIds)[0];
      const watcher = global.watchers.find((w) => w.id == id);
      const indexOfWatcher = global.watchers.findIndex((w) => w.id == id);
      watcher.stop();
      global.watchers.splice(indexOfWatcher, 1);
    }

    // Close any window whose `window.status` just changed to 'safeToClose'
    if (aWindowIsSafeToClose) {
      const windowsToClose = getWindowsThatAreSafeToClose(state, oldState);
      windowsToClose.forEach((window) => window.close());
    }

    // If app is quitting, start to close all windows
    if (appIsQuitting) {
      const windows = electron.BrowserWindow.getAllWindows();
      if (windows.length) {
        windows.forEach((win) => win.close());
      }
    }
  });


  // ------ DO INITIAL SETUP ------ //

  const state = global.state();

  // On startup, for each project, create a Window and Watcher
  state.projects.allIds.forEach((id) => {
    createWindowAndWatcher(state, id);
  });
}


/**
 * Create a window and watcher for a project
 * @param {*} id - Of the project
 */
async function createWindowAndWatcher(state, id) {
  const project = state.projects.byId[id];
  const window = await createWindow(id, project);
  const watcher = new Watcher(id, project, window);
  global.watchers.push(watcher);
}


/**
 * Get projects whose directories have changed
 */
function getIdsOfProjectsWhoseDirectoriesHaveChanged(state, oldState) {
  let projects = [];
  state.projects.allIds.forEach((id) => {
    const directory = state.projects.byId[id].directory;
    const oldDirectory = oldState.projects.byId[id].directory;
    if (directory !== oldDirectory) {
      projects.push(id);
    }
  });
  return projects
}

/**
 * Get windows that are safe to close
 */
function getWindowsThatAreSafeToClose(state, oldState) {
  let windows = [];
  state.projects.allIds.forEach((id) => {
    const windowStatus = state.projects.byId[id].window.status;
    const oldWindowStatus = oldState.projects.byId[id]?.window.status;
    if (windowStatus == 'safeToClose' && oldWindowStatus !== 'safeToClose') {
      const window = electron.BrowserWindow.getAllWindows().find((win) => win.projectId == id);
      windows.push(window);
    }
  });
  return windows
}

const preferencesWindowConfig = {
  show: false,
  // width: 1060, // With dev tools open
  width: 700,
  height: 480,
  zoomFactor: 1.0,
  titleBarStyle: 'hidden',
  // resizable: false,
  webPreferences: {
    // Security:
    allowRunningInsecureContent: false,
    contextIsolation: true,
    enableRemoteModule: false,
    nativeWindowOpen: false,
    nodeIntegration: false,
    nodeIntegrationInWorker: false,
    nodeIntegrationInSubFrames: false,
    safeDialogs: true,
    sandbox: true,
    webSecurity: true,
    webviewTag: false,
    // Preload
    preload: path__default["default"].join(__dirname, 'preload.js')
  }
};

function init() {

  // ------ SETUP CHANGE LISTENERS ------ //

  // Did `prefs: isOpen` change?
  global.store.onDidAnyChange((state, oldState) => {
    const shouldOpenPrefs = stateHasChanged(global.patches, ["prefs", "isOpen"], true);
    if (shouldOpenPrefs) {
      open();
    }
  });
}

async function open() {

  const win = new electron.BrowserWindow(preferencesWindowConfig);

  // Set window background color.
  // TODO: Setting backgroundColor is currently broken. 
  // Background always renders as black, regardless of the value. 
  // Bug: https://github.com/electron/electron/issues/26842
  const backgroundColor = global.state().systemColors.windowBackgroundColor;
  if (backgroundColor) win.setBackgroundColor(backgroundColor);
  
  win.once('ready-to-show', () => {
    win.show();
  });

  // 'projectId' is a bit of a misnomer for Preferences, but we use it for the sake of consistency.
  win.projectId = 'preferences';

  // On focus, set `focusedWindowId` to win.id
  win.on('focus', () => {
    global.store.dispatch({ type: 'FOCUSED_WINDOW' }, win);
  });

  /*
  On blur, wait a beat. If the user has clicked on another Gambier window it will fire `FOCUSED_WINDOW` and set itself as the `focusedWindowId`. In which case we don't want to do anything. But if the user has clicked outside the app, `focusedWindowId` will still equal this win.projectId after the beat. In which case, set `focusedWindowId` to zero, which we take to mean that the app is in the background.
  */
  win.on('blur', async () => {
    await wait(50);
    if (global.state().focusedWindowId == win.projectId) {
      global.store.dispatch({ type: 'NO_WINDOW_FOCUSED' });
    }
  });

  // De-focus window when a sheet is open
  win.on('sheet-begin', () => {
    global.store.dispatch({ type: 'NO_WINDOW_FOCUSED' });
  });

  // Focus window when a sheet closes
  win.on('sheet-end', () => {
    global.store.dispatch({ type: 'FOCUSED_WINDOW' }, win);
  });

  win.on('close', () => {
    global.store.dispatch({ type: 'CLOSE_PREFERENCES' });
  });

  // if (!app.isPackaged) {
  //   win.webContents.openDevTools();
  //   win.setBounds({ width: 1000 })
  // }

  // Load index.html
  // await win.loadFile(path.join(__dirname, 'preferences.html'), {
  //   query: {
  //     id: win.projectId
  //   },
  // })
  await win.loadURL(url__default["default"].format({
    pathname: 'index-preferences.html',
    protocol: 'file:',
    slashes: true,
    query: {
      id: win.projectId
    }
  }));
}

// External dependencies


// -------- Process variables -------- //

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;


// -------- Reload (Development-only) -------- //

electron.app.commandLine.appendSwitch('inspect=5858');
electron.app.commandLine.appendSwitch('enable-transparent-visuals');

if (!electron.app.isPackaged) {

  const thingsToWatchForReload = [
    path__default["default"].join(__dirname, '**/*.js'),
    // path.join(__dirname, '**/*.html'),
    path__default["default"].join(__dirname, '**/*.css'),
    // path.join(__dirname, '**/*.xml')
    // 'main.js',
    // '**/*.js',
    // '**/*.html',
    // '**/*.css',
    // '**/*.xml',
    // '**/*.png',
    // '**/*.jpg',
  ];

  // We use `electron-reload` package to do a hard reset of electron
  // every time a file changes.
  require('electron-reload')(thingsToWatchForReload, {

    // awaitWriteFinish: {
    //   stabilityThreshold: 10,
    //   pollInterval: 50
    // },

    // We reset electron each time (starting a new electron process, and
    // not just restarting web contents, which the default) by specifying 
    // the path to the electron package.
    electron: path__default["default"].join(__dirname, '../node_modules', '.bin', 'electron'),

    // "If your app overrides some of the default quit or close actions 
    // (e.g. closing the last app window hides the window instead of 
    // quitting the app) then the default electron-reload hard restart 
    // could leave you with multiple instances of your app running. In 
    // these cases you can change the default hard restart action from 
    // app.quit() to app.exit() by specifying the hard reset method in 
    // the electron-reload options"
    // https://www.npmjs.com/package/electron-reload
    // hardResetMethod: 'exit',

    argv: ['--inspect=5858', '--enable-transparent-visuals'],
  });

  // console.log('// - - - - - - - - - - - - - - - //')
  // console.log(`Gambier... Electron ${process.versions.electron}. Chrome ${process.versions['chrome']}`)
}


// -------- IPC TESTING -------- //

// ipc.config.id = 'world';
// ipc.config.retry = 1500;

// ipc.serve(() => {

//     ipc.server.on('message', (data, socket) => {
//       ipc.log('got a message : '.debug, data)
//       ipc.server.emit(
//         socket,
//         'message',  // This can be anything you want so long as your client knows.
//         data + ' world!'
//       )
//     })

//     ipc.server.on('socket.disconnected', (socket, destroyedSocketID) => {
//       ipc.log('client ' + destroyedSocketID + ' has disconnected!')
//     })
//   }
// )

// ipc.server.start()



// -------- SETUP -------- //

// Set this to shut up console warnings re: deprecated default. If not set, it defaults to `false`, and console then warns us it will default `true` as of Electron 9. Per: https://github.com/electron/electron/issues/18397
electron.app.allowRendererProcessReuse = true;

// Create store (and global variables for store and state)
global.store = new Store();
global.state = () => global.store.store;
global.patches = []; // Most recent patches from Immer
global.watchers = []; // Watchers. Are populdated by ProjectManager

// Create Sqlite databaase (happens in the constructor). 
// Class instance has useful functions for interacting w/ the db.
// E.g. Insert new row, update, etc.
global.db = new DbManager();

// Start app
electron.app.whenReady()
  .then(async () => {


    // Catch when user toggles macOS keyboard navigation by 
    // listening to system changes.
    electron.systemPreferences.subscribeNotification('com.apple.KeyboardUIModeDidChange', async (evt, userInfo, object) => {
      await global.store.dispatch({
        type: 'SET_SYSTEM_VALUES',
        values: {
          ...global.state().system,
          keyboardNavEnabled: electron.systemPreferences.getUserDefault('AppleKeyboardUIMode', 'boolean')
        }
      });
    });

    // Ensure app assets load reliably from both absolute and
    // relative urls by intercepting, determining if the request
    // is for an app asset (it doesn't start with `Users`, in
    // case of macOS), and if so, inserting app path at start.
    // Before we added this, absolute paths to app assets would
    // fail.
    // Before: `file:///img/arrow.svg`
    // After: `file:///Users/josh/Desktop/gambier/img/arrow.svg`
    electron.protocol.interceptFileProtocol('file', (request, callback) => {
      
      // If the request url starts with `file:///Users`, it's
      // not a request for an app asset, so we don't need to
      // append the app path. This happens when user loads an 
      // image from the project, for example. We just cleanup
      // the request url.
      const isRequestForAppAsset = !request.url.startsWith('file:///Users/');
      if (!isRequestForAppAsset) {
        
        // Clean up the request url by removing the file prefix
        // and replacing ascii spaces with real spaces:
        // Before: file:///Users/josh/Desktop/Notes/climate%20graph.jpg
        // After:  /Users/josh/Desktop/Notes/climate graph.jpg
        let url = request.url.substr('file://'.length);
        url = path__default["default"].normalize(url);
        url = url.replaceAll('%20', ' ');
        // console.log(url)
        callback({ path: url });
        return
      }

      let url = request.url.substr('file'.length + 1);

      // Build complete path for node require function
      url = path__default["default"].join(__dirname, url);

      const containsQuery = url.includes('?');
      if (containsQuery) {
        url = url.substring(0, url.lastIndexOf('?'));
      }

      // Replace backslashes by forward slashes (windows)
      url = path__default["default"].normalize(url);
      
      // console.log(url)

      callback({ path: url });

    });

    // Create IPC listeners/handlers
    init$3();

    // Setup preferences manager
    init();

    // Prep state as necessary. E.g. Prune projects with bad directories.
    await global.store.dispatch({ type: 'START_COLD_START' });

    // Setup menu bar
    init$2();

    // Get initial system appearance values
    init$4();

    // Create windows and watchers for projects
    init$1();

    // App startup complete!
    await global.store.dispatch({ type: 'FINISH_COLD_START' });
  });


// -------- LISTENERS -------- //

// Start to quit app: Set appStatus to 'safeToQuit'. This triggers windows to close. Once all of them have safely closed (e.g. open docs are saved), appStatus is updated to 'safeToQuit', and we call `app.quit` again. This time it will go through.

electron.app.on('before-quit', async (evt) => {
  const appStatus = global.state().appStatus;
  switch (appStatus) {

    // If app is open, preventDefault, and update appStatus state
    // via reducer. 
    case 'open': {
      evt.preventDefault();
      await global.store.dispatch({
        type: 'START_TO_QUIT'
      });
      break
    }

    // If quit has already started, preventDefault.
    case 'wantsToQuit': {
      evt.preventDefault();
      break
    }

    // If app is safe to quit, do nothing; allow it to quit.
    case 'safeToQuit': {
      console.log("Quitting app!");
      // Do nothing
      break
    }
  }
});

/**
 * Quit app when appStatus changes to 'safeToQuit'
 */
global.store.onDidAnyChange(async (state, oldState) => {

  const canSafelyQuit = propHasChangedTo('appStatus', 'safeToQuit', state, oldState);

  if (canSafelyQuit) {
    electron.app.quit();
  }
});

// On all windows closed, if app is quitting, set `safeToQuit` on appStatus
// via 'CAN_SAFELY_QUIT' reducer. Else, do nothing.
electron.app.on('window-all-closed', async () => {

  const appWantsToQuit = global.state().appStatus == 'wantsToQuit';
  const isNotMacApp = process.platform !== 'darwin';

  // "On macOS it is common for applications and their menu bar to stay active until the user quits explicitly with Cmd + Q" — https://www.geeksforgeeks.org/save-files-in-electronjs/
  if (appWantsToQuit || isNotMacApp) {
    await global.store.dispatch({
      type: 'CAN_SAFELY_QUIT'
    });
  }
});
//# sourceMappingURL=main.js.map
