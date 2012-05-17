/* <copyright>
This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
(c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
</copyright> */

////////////////////////////////////////////////////////////////////////
//
var Montage = 		require("montage/core/core").Montage,
    Component = 	require("montage/ui/component").Component,
    NJUtils     = require("js/lib/NJUtils").NJUtils,
    World = require("js/lib/drawing/world").World,
    ShapesController = require("js/controllers/elements/shapes-controller").ShapesController,
        ShapeModel    = require("js/models/shape-model").ShapeModel;

var ClipboardController = exports.ClipboardController = Montage.create(Component, {
    hasTemplate: {
        value: false
    },

    deserializedFromTemplate: {
        value: function() {
            document.body.addEventListener("copy", this, false);
            document.body.addEventListener("cut", this, false);
            document.body.addEventListener("paste", this, false);

            //ninja menu events
            this.eventManager.addEventListener("executeCut", this, false);
            this.eventManager.addEventListener("executeCopy", this, false);
            this.eventManager.addEventListener("executePaste", this, false);

        }
    },

    copiedObjects:{
        value: null
    },

    _copyFlag:{
        value:false
    },

    copyFlag:{
        get:function(){return this._copyFlag;},
        set:function(value){this._copyFlag = value;}
    },

    _newCopyFlag:{
        value:true
    },

    newCopyFlag:{
        get:function(){return this._newCopyFlag;},
        set:function(value){this._newCopyFlag = value;}
    },

    handleExecuteCopy:{
        value: function(){document.execCommand('copy',false,null);}
    },

    handleExecuteCut:{
        value: function(){document.execCommand('cut',false,null);}
    },

    handleExecutePaste:{
        value: function(){document.execCommand('paste',false,null);}
    },

    handleCopy:{
        value:function(clipboardEvent){
            var elem = null, computedStyles = null, originalStyleAttr = null, computedStylesStr = "", i=0, stylePropertyName="";
            if(this.application.ninja.documentController.activeDocument.currentView === "code") return;

            if(this.application.ninja.selectedElements.length > 0){
                //handling 1 selected element for now

                if(this.application.ninja.selectedElements[0].tagName === "CANVAS"){
                    this.copiedObjects = this.application.ninja.selectedElements[0];
                }

                elem = this.application.ninja.selectedElements[0];
                originalStyleAttr = elem.getAttribute("style");//preserve the current styles
                elem.removeAttribute("style");

                //build the computed style attribute
                computedStyles = elem.ownerDocument.defaultView.getComputedStyle(elem);

                //todo: consider cleaning up the position data [or making posiiton:relative with 0,0] from the computed styles,
                // so that the object is pasted onto expernal applicaitons [like gmail] with no offset

                for (i = 0; i < computedStyles.length; i++) {
                    stylePropertyName = computedStyles[i];
                    computedStylesStr = computedStylesStr + stylePropertyName + ":" + computedStyles.getPropertyValue(stylePropertyName) + ";";
                }
                elem.setAttribute("style", computedStylesStr);

                //set clipboard data
                clipboardEvent.clipboardData.setData('text/html', ''+this.application.ninja.selectedElements[0].outerHTML);//copying first selected element for POC
                //clipboardEvent.clipboardData.setData('ninja', 'test');//works

                elem.setAttribute("style", originalStyleAttr);//reset style after copying to clipboard

                //end - handling 1 selected element

                clipboardEvent.preventDefault();
            }
        }
    },

    handlePaste:{
        value:function(clipboardEvent){
            if(this.application.ninja.documentController.activeDocument.currentView === "code") return;

            //TODO: return if stage is not focussed

            var clipboardData = clipboardEvent.clipboardData,
                htmlData = clipboardData.getData("text/html"),
                textData = clipboardData.getData("text/plain");

            this.pasteItems(htmlData, textData);

            clipboardEvent.preventDefault();
        }
    },

    pasteItems:{
        value: function(htmlData, textData){
            var data = null, i=0,
                pasteDataObject=null,
                clipboardHelper=this.createClipboardHelper(),
                pastedElements = null,
                node = null,
                styles = null;

            data = htmlData || textData;

            if(htmlData){
                //TODO: cleanse HTML

                this.application.ninja.selectedElements.length = 0;
                NJevent("selectionChange", {"elements": this.application.ninja.selectedElements, "isDocument": true} );

                clipboardHelper.innerHTML = htmlData;//add the copied html to generate the nodes

                while(clipboardHelper.hasChildNodes()){
                    if(clipboardHelper.lastChild.tagName === "META") {
                        clipboardHelper.removeChild(clipboardHelper.lastChild);//remove unnecesary meta tag
                    }
                    else if (clipboardHelper.lastChild.tagName === "CANVAS"){//temporary - we probably won't need to serialize this to the system clipboard

                        //only handling 1 canvas for POC


                        //clone copied canvas
                        var canvas = document.application.njUtils.make("canvas", this.copiedObjects.className, this.application.ninja.currentDocument);
                        canvas.width = this.copiedObjects.width;
                        canvas.height = this.copiedObjects.height;
                        //end - clone copied canvas

                        if (!canvas.getAttribute( "data-RDGE-id" )) canvas.setAttribute( "data-RDGE-id", NJUtils.generateRandom() );
                        document.application.njUtils.createModelWithShape(canvas);

                        styles = canvas.elementModel.data || {};
                        styles.top = "" + (this.application.ninja.elementMediator.getProperty(this.copiedObjects, "top", parseInt) - 50) + "px";
                        styles.left = "" + (this.application.ninja.elementMediator.getProperty(this.copiedObjects, "left", parseInt) - 50) + "px";

                        this.application.ninja.elementMediator.addElements(canvas, styles, false);

                        var world, worldData = this.copiedObjects.elementModel.shapeModel.GLWorld.exportJSON();
                        if(worldData)
                        {

                            var jObj;
                            var index = worldData.indexOf( ';' );
                            if ((worldData[0] === 'v') && (index < 24))
                            {
                                // JSON format.  separate the version info from the JSON info
                                var jStr = worldData.substr( index+1 );
                                jObj = JSON.parse( jStr );

                                world = new World(canvas, jObj.webGL);
                                canvas.elementModel.shapeModel.GLWorld = world;
                                canvas.elementModel.shapeModel.useWebGl = jObj.webGL;
                                world.importJSON(jObj);
                                this.application.ninja.currentDocument.buildShapeModel( canvas.elementModel, world );
                            }

                       }

                        NJevent("elementAdded", canvas);


                        clipboardHelper.removeChild(clipboardHelper.lastChild);
                    }
                    else if(clipboardHelper.lastChild.nodeType === 3){//TextNode
                        node = clipboardHelper.removeChild(clipboardHelper.lastChild);

                        //USE styles controller to create the styles of the div and span
                        var doc = this.application.ninja.currentDocument ? this.application.ninja.currentDocument._document : document;
                        var aspan = doc.createElement("span");
                        aspan.appendChild(node);
                        var adiv = doc.createElement("div");
                        adiv.appendChild(aspan);
                        styles = {"top":"100px", "left":"100px"};


                        this.pastePositioned(node, styles);
                    }
                    else {
                        node = clipboardHelper.removeChild(clipboardHelper.lastChild);

                        if(node.removeAttribute) {node.removeAttribute("style");}//remove the computed styles attribute which is placed only for pasting to external applications

                        //get class string while copying .... generate styles from class
                        //styles = {"top":"100px", "left":"100px"};

                        this.pastePositioned(node, styles);
                    }

                }

                this.application.ninja.documentController.activeDocument.needsSave = true;
            }else if(textData){

                //USE styles controller to create the styles of the div and span
                clipboardHelper.innerHTML = "<div><span>"+ textData +"</span></div>";//add the copied html to generate the nodes
                node = clipboardHelper.removeChild(clipboardHelper.lastChild);
                styles = {"top":"100px", "left":"100px"};//get real stage center coordinates
                this.pastePositioned(node, styles);
            }

        }
    },

    pastePositioned:{
        value: function(element, styles){// for now can wok for both in-place and centered paste
            NJUtils.createModel(element);
            this.application.ninja.elementMediator.addElements(element, styles);
        }
    },

    pasteInPlace:{
        value: function(element){
            NJUtils.createModel(element);
            this.application.ninja.elementMediator.addElements(element, null);//does not work now
        }
    },

    handleCut:{
        value:function(clipboardEvent){
            var clipboardData = clipboardEvent.clipboardData,
                htmlData = clipboardData.getData("text/html"),
                textData = clipboardData.getData("text/plain");

            console.log("$$$ handleCut ", textData);


            clipboardEvent.preventDefault();
        }
    },

    samplePasteJson:{
        value:{
            "htmlString" : "<div></div>",
                 "styles": {"position": "absolute",
                        "top": "304px",
                        "left": "318px",
                        "width": "125px",
                        "height": "71px",
                        "background-image": "none",
                        "background-color": "#2EFF5B"}

        }
    },

    createClipboardHelper:{
        value:function(){
            var doc = this.application.ninja.currentDocument ? this.application.ninja.currentDocument._document : document,
                clipboardHelper=doc.getElementById("clipboardHelper");
            //dynamically create editable div for execCommand->copy
            if(!clipboardHelper){
                clipboardHelper = doc.createElement ("div");
                clipboardHelper.id = "clipboardHelper";
                //clipboardHelper.style.display="none";
                clipboardHelper.style.position = "absolute";
                clipboardHelper.style.right = "0px";
                clipboardHelper.style.top = "0px";

                document.body.appendChild (clipboardHelper);
            }
            return clipboardHelper;
        }
    }
});