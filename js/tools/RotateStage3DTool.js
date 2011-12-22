/* <copyright>
This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
(c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
</copyright> */

var Montage = require("montage/core/core").Montage,
    Rotate3DToolBase = require("js/tools/Rotate3DToolBase").Rotate3DToolBase,
    toolHandleModule = require("js/stage/tool-handle"),
    snapManager = require("js/helper-classes/3D/snap-manager").SnapManager,
    viewUtils = require("js/helper-classes/3D/view-utils").ViewUtils,
    vecUtils = require("js/helper-classes/3D/vec-utils").VecUtils,
    drawUtils = require("js/helper-classes/3D/draw-utils").DrawUtils,
    ElementsMediator = require("js/mediators/element-mediator").ElementMediator;

exports.RotateStage3DTool = Montage.create(Rotate3DToolBase, {
    _toolID: { value: "rotateStage3DTool" },
    _imageID: { value: "rotateStage3DToolImg" },
    _toolImageClass: { value: "rotateStage3DToolUp" },
    _selectedToolImageClass: { value: "rotateStage3DToolDown" },
    _toolTipText : { value : "3D Rotate Stage Tool" },
    _canOperateOnStage:{value:false,writable:true},

    _initializeToolHandles: {
        value: function() {
            if(!this._handles)
            {
                this._handles = [];

                // TODO - Using dummy cursors for now

                // rotateX
                var rX = toolHandleModule.RotateHandle.create();
                rX.init("url('images/cursors/Translate_X.png') 0 0, default", 'rgba(255,0,0,1)', "x");
                this._handles.push(rX);

                // rotateY
                var rY = toolHandleModule.RotateHandle.create();
                rY.init("url('images/cursors/Translate_Y.png') 0 0, default", 'rgba(0,255,0,1)', "y");
                this._handles.push(rY);

                // rotateZ
                var rZ = toolHandleModule.RotateHandle.create();
                rZ.init("url('images/cursors/Translate_Z.png') 0 0, default", 'rgba(0,0,255,1)', "z");
                this._handles.push(rZ);
            }

            var len = this._handles.length;
            var i = 0,
                toolHandle;
            for (i=0; i<len; i++)
            {
                toolHandle = this._handles[i];
                toolHandle._lineWidth = 3;
                toolHandle._radius = 100;
                toolHandle._nTriangles = 60;
                var angle = 2.0*Math.PI/Number(toolHandle._nTriangles);
                toolHandle._rotMat = Matrix.RotationZ( angle );
            }
        }
    },

    _updateTargets: {
        value: function(addToUndoStack) {
            this._targets = [];
            var elt = this._target;

            var curMat = viewUtils.getMatrixFromElement(elt);
            var curMatInv = glmat4.inverse(curMat, []);

            viewUtils.pushViewportObj( elt );
            var eltCtr = viewUtils.getCenterOfProjection();
            viewUtils.popViewportObj();

            eltCtr = viewUtils.localToGlobal(eltCtr, elt);

            this._targets.push({elt:elt, mat:curMat, matInv:curMatInv, ctr:eltCtr});

            viewUtils.setMatrixForElement( elt, curMat, false );
        }
    },

    captureSelectionDrawn: {
        value: function(event){
            this._origin = null;
            this._targets = null;
            this._startOriginArray = null;

            var stage = this.application.ninja.currentDocument.documentRoot;
            this.target = stage;

            viewUtils.pushViewportObj( stage );
            var eltCtr = viewUtils.getCenterOfProjection();
            viewUtils.popViewportObj();

            this._targets = [];

            var curMat = viewUtils.getMatrixFromElement(stage);
            var curMatInv = glmat4.inverse(curMat, []);

            this._targets.push({elt:stage, mat:curMat, matInv:curMatInv, ctr:eltCtr});

            var ctrOffset = stage.elementModel.props3D.m_transformCtr;
            if(ctrOffset)
            {
                eltCtr[2] = 0;
                eltCtr = vecUtils.vecAdd(3, eltCtr, ctrOffset);
            }

            this._origin = viewUtils.localToGlobal(eltCtr, stage);

            this._setTransformOrigin(false);

            this.DrawHandles();
        }
    },

    captureElementChange: {
        value: function(event) {
            if(event._event.item === this.application.ninja.currentDocument.documentRoot)
            {
                this.captureSelectionDrawn(null);
            }
        }
    },

    Reset : {
       value : function()
       {
           // Reset stage to identity matrix
           var iMat = Matrix.I(4);

           ElementsMediator.setMatrix(this.application.ninja.currentDocument.documentRoot, iMat, false);

           this.application.ninja.currentDocument.documentRoot.elementModel.props3D.m_transformCtr = null;

           // TODO - Any updates to the stage should redraw stage's children. Move this to mediator?
           this.application.ninja.stage.updatedStage = true;

           this.isDrawing = false;
           this.endDraw(event);

//			this.UpdateSelection(true);
           this.Configure(true);
       }
   }

});
