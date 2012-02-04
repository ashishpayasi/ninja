/* <copyright>
This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
(c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
</copyright> */

/**
@module js/document/documentManager
@requires montage/core/core
@requires montage/ui/component
@requires js/document/html-document
@requires js/document/text-document
*/

var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    Uuid = require("montage/core/uuid").Uuid,
    HTMLDocument = require("js/io/document/html-document").HTMLDocument,
    TextDocument = require("js/io/document/text-document").TextDocument;

var DocumentController = exports.DocumentController = Montage.create(Component, {
    hasTemplate: {
        value: false
    },

    _documents: {
        value: []
    },

    _activeDocument: { value: null },
    _iframeCounter: { value: 1, enumerable: false },
    _iframeHolder: { value: null, enumerable: false },
    _textHolder: { value: null, enumerable: false },
    _codeMirrorCounter: {value: 1, enumerable: false},

    tmpSourceForTesting: {
        value: "function CodeMirror(place, givenOptions) {" +
                "// Determine effective options based on given values and defaults." +
                "var options = {}, defaults = CodeMirror.defaults; }"
    },

    _codeEditor: {
        value: {
            "editor": {
                value: null,
                enumerable: false
            },
            "hline": {
                value: null,
                enumerable: false
            }
        }
    },

    activeDocument: {
        get: function() {
            return this._activeDocument;
        },
        set: function(doc) {
            if(this._activeDocument)  this._activeDocument.isActive = false;

            if(this._documents.indexOf(doc) === -1) this._documents.push(doc);

            this._activeDocument = doc;
            this._activeDocument.isActive = true;

        }
    },

    deserializedFromTemplate: {
        value: function() {
            this.eventManager.addEventListener("appLoaded", this, false);
            this.eventManager.addEventListener("executeFileOpen", this, false);
            this.eventManager.addEventListener("executeNewFile", this, false);
        }
    },

    handleAppLoaded: {
        value: function() {
            this.openDocument({"type": "html"});
        }
    },

    handleExecuteFileOpen: {
        value: function(event) {
            var pickerSettings = event._event.settings || {};
            pickerSettings.callback = this.openFileWithURI;
            pickerSettings.callbackScope = this;
            this.application.ninja.filePickerController.showFilePicker(pickerSettings);

            //this.openDocument({"type": "js", "source": this.tmpSourceForTesting});
        }
    },

    handleExecuteNewFile: {
            value: function(event) {
                var newFileSettings = event._event.settings || {};
                newFileSettings.callback = this.createNewFile;
                newFileSettings.callbackScope = this;
                this.application.ninja.newFileController.showNewFileDialog(newFileSettings);
            }
    },

    createNewFile:{
        value:function(newFileObj){
            //console.log(newFileObj);//contains the template uri and the new file uri
            if(!newFileObj) return;
            this.application.ninja.ioMediator.fileNew(newFileObj.newFilePath, newFileObj.fileTemplateUri, {"operation":this.openNewFileCallback, "thisScope":this});

            if((newFileObj.fileExtension !== ".html") && (newFileObj.fileExtension !== ".htm")){//open code view

            }else{
                //open design view
            }
        }
    },

    /**
     * Public method
     * doc contains:
     *      type : file type, like js, css, etc
     *      name : file name
     *      source : file content
     *      uri : file uri
     */
    openNewFileCallback:{
        value:function(doc){
            if(!doc){
                doc = {"type": "js", "name": "filename", "source": "test file content", "uri": "/fs/fsd/"}  ;
            }
            this.openDocument(doc);
        }
    },

    openFileWithURI: {
        value: function(uriArrayObj) {
            var uri = "", fileContent = "", response=null, filename="", fileType="js";
            if(!!uriArrayObj && !!uriArrayObj.uri && (uriArrayObj.uri.length > 0)){
                uri = uriArrayObj.uri[0];
            }
            //console.log("URI is: ", uri);

            this.application.ninja.ioMediator.fileOpen({"uri":uri}, {"operation":this.openFileCallback, "thisScope":this});
        }
    },

    /**
     * Public method
     * doc contains:
     *      type : file type, like js, css, etc
     *      name : file name
     *      source : file content
     *      uri : file uri
     */
    openFileCallback:{
        value:function(doc){
            this.openDocument(doc);
        }
    },


    openProjectWithURI: {
        value: function(uri) {
            console.log("URI is: ", uri);

        }
    },

    /** Open a Document **/
    openDocument: {
        value: function(doc) {
            var newDoc;

            if(!doc) return false;

           // try {
                if (doc.type === 'html' || doc.type === 'htm') {
                    newDoc = Montage.create(HTMLDocument);
                    newDoc.initialize(doc, Uuid.generate(), this._createIframeElement(), this._onOpenDocument);
                } else {
                    newDoc = Montage.create(TextDocument, {
                        "source": { value: doc.source }
                    });
                    var docUuid = Uuid.generate();
                    var textArea = this.application.ninja.stage.stageView.createTextAreaElement(docUuid);
                    newDoc.initialize(doc, docUuid, textArea, textArea.parentNode);

                    // Tmp this will be filled with the real content
                    newDoc.textArea.value = doc.source; //this.tmpSourceForTesting;

                    this.textDocumentOpened(newDoc);

                }

           // } catch (err) {
           //     console.log("Could not open Document ",  err);
           // }
        }
    },

    textDocumentOpened: {
       value: function(doc) {



           this.application.ninja.stage.stageView.createTextView(doc);

           /*
           DocumentManager._hideCurrentDocument();
           stageManagerModule.stageManager._scrollFlag = false;    // TODO HACK to prevent type error on Hide/Show Iframe
           DocumentManager.activeDocument = doc;

           var type;

           switch(doc.documentType) {
               case  "css" :
                   type = "css";
                   break;
               case "js" :
                   type = "javascript";
                   break;
           }

           DocumentManager._codeEditor.editor = CodeMirror.fromTextArea(doc.textArea, {
                       lineNumbers: true,
                       mode: type,
                       onCursorActivity: function() {
                           DocumentManager._codeEditor.editor.setLineClass(DocumentManager._codeEditor.hline, null);
                           DocumentManager._codeEditor.hline = DocumentManager._codeEditor.editor.setLineClass(DocumentManager._codeEditor.editor.getCursor().line, "activeline");
                       }
           });
           DocumentManager._codeEditor.hline = DocumentManager._codeEditor.editor.setLineClass(0, "activeline");
           */

       }
   },

    closeDocument: {
        value: function(id) {

            //if file dirty then save

            var doc = this._findDocumentByUUID(id);
            this._removeDocumentView(doc.container);

            this._documents.splice(this._findIndexByUUID(id), 1);

            if(this.activeDocument.uuid === id && this._documents.length > 0) {

                var closeDocumentIndex = this._findIndexByUUID(id);
                var nextDocumentIndex = -1 ;
                if((this._documents.length > 0) && (closeDocumentIndex === 0)){
                    nextDocumentIndex = 1;
                }else if((this._documents.length > 0) && (closeDocumentIndex > 0)){
                    nextDocumentIndex = closeDocumentIndex - 1;
                }

                //remove the codemirror div if this is for a code view
                /////test

                ////end- test

                this.switchDocument(this._documents[0].uuid);

            }
        }
    },

    switchDocument: {
        value: function(id) {
            this._hideCurrentDocument();
            this.activeDocument = this._findDocumentByUUID(id);

            this.application.ninja.stage._scrollFlag = false;    // TODO HACK to prevent type error on Hide/Show Iframe
            this._showCurrentDocument();

            if(this.activeDocument.documentType === "htm" || this.activeDocument.documentType === "html") {
                this.application.ninja.stage._scrollFlag = true; // TODO HACK to prevent type error on Hide/Show Iframe
                // TODO dispatch event here
//                appDelegateModule.MyAppDelegate.onSetActiveDocument();
            }
        }
    },

    switchViews: {
        value: function() {

            //save file if dirty

            this.application.ninja.stage.saveScroll();
            this._hideCurrentDocument();

            if(this.activeDocument.currentView === "design") {
                this._textHolder.style.display = "none";
                this.activeDocument.container.style["display"] = "block";
                this.application.ninja.stage._scrollFlag = true;
                //this._showCurrentDocument();
                this.application.ninja.stage.restoreScroll();

            } else {
                this.application.ninja.stage._scrollFlag = false;    // TODO HACK to prevent type error on Hide/Show Iframe

                var codeview = this.activeDocument.container;
                //this._textHolder.style.display = "block";
                //codeview.firstChild.innerHTML = this.activeDocument.iframe.contentWindow.document.body.parentNode.innerHTML;

//                this._codeEditor.editor = CodeMirror.fromTextArea(codeview.firstChild, {
//                            lineNumbers: true,
//                            mode: "htmlmixed",
//                            onCursorActivity: function() {
//                                DocumentController._codeEditor.editor.setLineClass(DocumentController._codeEditor.hline, null);
//                                DocumentController._codeEditor.hline = DocumentController._codeEditor.editor.setLineClass(DocumentController._codeEditor.editor.getCursor().line, "activeline");
//                            }
//                });
//                this._codeEditor.hline = DocumentController._codeEditor.editor.setLineClass(0, "activeline");
            }
        }
    },


    // Document has been loaded into the Iframe. Dispatch the event.
    // Event Detail: Contains the current ActiveDocument
    _onOpenDocument: {
        value: function(doc){
            //var data = DocumentManager.activeDocument;
            //DocumentManager._hideCurrentDocument();

            //stageManagerModule.stageManager.toggleCanvas();

            DocumentController.activeDocument = doc;

            NJevent("onOpenDocument", doc);
//            appDelegateModule.MyAppDelegate.onSetActiveDocument();

        }
    },


    _onOpenTextDocument: {
        value: function(doc) {
            this._hideCurrentDocument();
            this.application.ninja.stage._scrollFlag = false;    // TODO HACK to prevent type error on Hide/Show Iframe
            this.activeDocument = doc;

            var type;

            switch(doc.documentType) {
                case  "css" :
                    type = "css";
                    break;
                case "js" :
                    type = "javascript";
                    break;
            }

            DocumentController._codeEditor.editor = CodeMirror.fromTextArea(doc.textArea, {
                        lineNumbers: true,
                        mode: type,
                        onCursorActivity: function() {
                            DocumentController._codeEditor.editor.setLineClass(DocumentController._codeEditor.hline, null);
                            DocumentController._codeEditor.hline = DocumentController._codeEditor.editor.setLineClass(DocumentController._codeEditor.editor.getCursor().line, "activeline");
                        }
            });
            DocumentController._codeEditor.hline = DocumentController._codeEditor.editor.setLineClass(0, "activeline");

        }
    },

    /**
     * VIEW Related Methods
     */
    // PUBLIC
    ShowActiveDocument: {
        value: function() {
            this.activeDocument.iframe.style.opacity = 1.0;
        }
    },

    // PRIVATE
    _findDocumentByUUID: {
        value: function(uuid) {
            var len =  this._documents.length;
            for(var i = 0; i < len; i++) {
                if(this._documents[i].uuid === uuid) return this._documents[i];
            }

            return false;
        }
    },

    _findIndexByUUID: {
        value: function(uuid) {
            var len =  this._documents.length;
            for(var i = 0; i < len; i++) {
                if(this._documents[i].uuid === uuid) return i;
            }

            return false;
        }
    },

    _hideCurrentDocument: {
        value: function() {
            if(this.activeDocument) {
                this.activeDocument.container.style["display"] = "none";
                if(this.activeDocument.currentView === "design" || this.activeDocument.currentView === "design"){
                    this.activeDocument.container.parentNode.style["display"] = "none";
                    this.application.ninja.stage.hideCanvas(true);
                }
            }
        }
    },

    _showCurrentDocument: {
        value: function() {
            if(this.activeDocument) {
                this.activeDocument.container.style["display"] = "block";
                if(this.activeDocument.currentView === "design" || this.activeDocument.currentView === "design"){
                    this.activeDocument.container.parentNode.style["display"] = "block";
                    this.application.ninja.stage.hideCanvas(false);
                }
            }
        }
    },

    _removeDocumentView: {
        value: function(node) {
            node.parentNode.removeChild(node);
        }
    },

    reloadDocumentContent: {
        value: function() {
            this.activeDocument._window.location.reload();
        }
    },

    /**
     * Creates a new iFrame element using a new unique ID for it. Returns the iframe ID.
     */
    _createIframeElement: {
        value: function() {
            var e = document.createElement("iframe");
            e.id = this._createIframeID();
            e.style.border = "none";
            e.style.opacity = 0;
            e.height = 1000;
            e.width = 2000;
            e.src = "";

            if(!this._iframeHolder) this._iframeHolder = document.getElementById("iframeContainer");
            
            this._iframeHolder.appendChild(e);

            return e;
        }
    },


    _createIframeID: {
        value: function() {
            return "userDocument_" + (this._iframeCounter++);
        }
    }
});