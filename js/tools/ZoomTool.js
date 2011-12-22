/* <copyright>
This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
(c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
</copyright> */


var Montage = require("montage/core/core").Montage,
    snapManager = require("js/helper-classes/3D/snap-manager").SnapManager,
    viewUtils = require("js/helper-classes/3D/view-utils").ViewUtils,
    vecUtils = require("js/helper-classes/3D/vec-utils").VecUtils,
    drawUtils = require("js/helper-classes/3D/draw-utils").DrawUtils,
    DrawingTool = require("js/tools/drawing-tool").DrawingTool;

exports.ZoomTool = Montage.create(DrawingTool, {
     drawingFeedback: { value: { mode: "Draw2D", type: "" } },
    _mode :{ value: null},
    _isDrawing: {value: false},
    _zoomFactor :{value: 1.0},
    _hasDraw :{value:false},
    _escPressed:{value:true},
    _layerX:{value:0},
    _layerY:{value:0},
    _delta:{value:0},
    _x:{value:0},
    _y:{value:0},
    _factor:{value:1},


    HandleLeftButtonDown: {
        value : function (event) {

            NJevent("enableStageMove");
            this._isDrawing=true;

            var point = webkitConvertPointFromPageToNode(this.application.ninja.stage.canvas,
                                                        new WebKitPoint(event.pageX, event.pageY));
            this.downPoint.x = point.x;
            this.downPoint.y = point.y;
        }
    },

    HandleAltKeyDown: {
		value: function(event) {

         this.setCursor();
         this._altKeyDown=true;

		}
	},

	HandleAltKeyUp: {
		value: function(event) {

         this.setCursor();
         this._altKeyDown=false;
		}
	},

    HandleEscape: {
        value: function(event) {
            this.application.ninja.stage.clearDrawingCanvas();
            this._escPressed=false;
        }
    },

    Configure: {
        value: function(wasSelected) {

            if(this.options.selectedElement==="zoomOutTool"){
                var cursor = "url('images/cursors/zoom_minus.png'), default";
                this.application.ninja.stage.drawingCanvas.style.cursor = cursor;
            }
           if(wasSelected) {
                this.AddCustomFeedback();
                this.eventManager.addEventListener( "toolDoubleClick", this, false);

           } else {
                this.RemoveCustomFeedback();
                this.eventManager.removeEventListener( "toolDoubleClick", this, false);
           }
        }
    },

    AddCustomFeedback: {
		value: function (event) {

            this.application.ninja.stage.canvas.addEventListener("mousewheel", this, false);

		}
	},

    handleScrollValue:{
       value:function(){

           this._mode = "mouseWheelZoom";
           this._zoomFactor= this.application.ninja.documentBar.zoomFactor/100;

           if(this._delta > 0){
                 this._zoomFactor *= 1.2;
           }
           else{
                 this._zoomFactor /= 1.2;
           }
           this._zoomFactor = this.checkZoomLimit(this._zoomFactor);
           this._setZoom(this._mode,this._zoomFactor);
           this._mode="modeReset";

       }
    },

    handleMousewheel :{
        value:function(event){

           var point = webkitConvertPointFromPageToNode(this.application.ninja.stage.canvas,
                                                        new WebKitPoint(event.pageX, event.pageY));
            this._layerX = point.x;
            this._layerY = point.y;

           this._delta = 0;

           if (event.wheelDelta) {
                    this._delta = event.wheelDelta/120;
           }

           if (this._delta){
                    this.handleScrollValue(this._delta);
           }

           if (event.preventDefault)
                    event.preventDefault();
           event.returnValue = false;

        }
    },

	HandleMouseMove:
	{
		value : function (event)
		{
			// check for some reasonable amount of mouse movement
			var dx = Math.abs(event.layerX - this.downPoint.x),
				dy = Math.abs(event.layerY - this.downPoint.y);

			if ((dx >= 4) || (dy >= 4))
			{
				// Drawing the Marquee
				if(this.options.selectedElement==="zoomInTool")
				{
					if(this._altKeyDown)
						this._hasDraw=false;
					else
						this._hasDraw = true;
				}
				else
				{
					if(this._altKeyDown)
						this._hasDraw=true;
					else
						this._hasDraw=false;
				}

				if(this._hasDraw)
				{
					this.doDraw(event);
					this._x = this.downPoint.x;
					this._y = this.downPoint.y;
				}
			}
		}
	},

	handleZoomChange:
	{
		value: function(event)
		{
		}
	},

    _setZoom:{
        value:function(mode,zoomFactor)
		{
            var userContent = this.application.ninja.currentDocument.documentRoot;
            this._oldValue = this.application.ninja.documentBar.zoomFactor;

			var globalPt;
            if(this._mode==="mouseClickZoom")
			{
				if(this.options.selectedElement==="zoomInTool")
				{
					if(this._altKeyDown)
						this._factor = this._oldValue/(zoomFactor*100);
					else
						this._factor = (zoomFactor*100)/this._oldValue;
				}
				else
				{
					if(this._altKeyDown)
						this._factor = (zoomFactor*100)/this._oldValue;
					else
						this._factor = this._oldValue/(zoomFactor*100);
				}

				var hitRec = snapManager.snap( this._layerX, this._layerY, true );
				if (hitRec)
				{
					var elt = hitRec.getElement();
					if (elt)
					{
//						console.log( "hit: " + hitRec.getElement().id );
						var localToGlobalMat = viewUtils.getLocalToGlobalMatrix( elt );
						var localPt;
						if (elt != userContent)
							localPt = hitRec.calculateElementPreTransformScreenPoint();
						else
						{
							localPt = hitRec.calculateElementWorldPoint();
							viewUtils.pushViewportObj( userContent );
							var cop = viewUtils.getCenterOfProjection();
							this._localPt = [cop[0] + localPt[0],  cop[1] + localPt[1],  localPt[2]];
							localPt = this._localPt.slice();
							viewUtils.popViewportObj();
						}

						globalPt = MathUtils.transformAndDivideHomogeneousPoint( localPt,  localToGlobalMat );
					}
					else
						globalPt = [this._layerX, this._layerY, 0];
				}
				else
					globalPt = [this._layerX, this._layerY, 0];
			}
			else if (this._mode==="marqueeZoom")
			{
				this._factor = (zoomFactor*100)/this._oldValue;

				var p0 = [this._x, this._y, 0];
				var p1 = [this._layerX, this._layerY, 0];
				globalPt = vecUtils.vecAdd(3, p0, p1);
				vecUtils.vecScale(3, globalPt, 0.5);

				var hitRec = snapManager.snap( globalPt[0], globalPt[1], true );
				if (hitRec)
				{
					var elt = hitRec.getElement();
					if (elt)
					{
//						console.log( "hit: " + hitRec.getElement().id );
						var localToGlobalMat = viewUtils.getLocalToGlobalMatrix( elt );
						var localPt  = hitRec.calculateElementPreTransformScreenPoint();
						globalPt = MathUtils.transformAndDivideHomogeneousPoint( localPt,  localToGlobalMat );
					}
				}
			}
			else if (this._mode === "doubleClickReset")
			{
				if (userContent)
				{
					var w = userContent.offsetWidth,
						h = userContent.offsetHeight;
					if(userContent.width)
						w = userContent.width;
					if(userContent.height)
						h = userContent.height;
					globalPt = [ w/2,  h/2, 0];
				}
				else
					globalPt = [0,0,0];
				zoomFactor = 1;
			}
			else if (this._mode === "mouseWheelZoom")
			{
				if (userContent)
				{
					var w = userContent.offsetWidth,
						h = userContent.offsetHeight;
					if(userContent.width)
						w = userContent.width;
					if(userContent.height)
						h = userContent.height;
					var localPt = [ w/2,  h/2, 0];
					globalPt = viewUtils.localToGlobal( localPt, userContent );
				}
				else
					globalPt = [0,0,0];
			}
			else
			{
				console.log( "unhandled zoom mode: " + this._mode );
				return;
			}

			// apply the scale to the matrices
			var localPt = viewUtils.globalToLocal( globalPt, userContent );
			viewUtils.setStageZoom( globalPt,  zoomFactor );

			// let the document and stage manager know about the zoom change
			this.application.ninja.stage._firstDraw = true;
			this.application.ninja.documentBar.zoomFactor = zoomFactor*100;
            //this.application.ninja.stage.zoomFactor = zoomFactor;
			if (zoomFactor >= 1)
				this.application.ninja.currentDocument.iframe.style.zoom = zoomFactor;
			this.application.ninja.stage._firstDraw = false;
			//tmp3 = viewUtils.localToGlobal( localPt,  userContent );	// DEBUG - remove this line

			// if we are resetting the zoom, clear out the translation from the matrices
			if (this._mode === "doubleClickReset")
			{
				viewUtils.clearStageTranslation();
                this.application.ninja.stage.centerStage();
			}

			// we need to redraw the entire stage after a zoom
            this.application.ninja.stage.updatedStage = true;
		}
	},

    handleToolDoubleClick: {
        value: function () {

            this._zoomFactor = 1;
            this._mode="doubleClickReset";
            this._setZoom(this._mode ,this._zoomFactor);

        }
    },

    RemoveCustomFeedback: {
		value: function (event) {

            this.application.ninja.stage.canvas.removeEventListener("mousewheel", this, false);

		}
	},

    HandleLeftButtonUp : {
        value : function(event) {
            var point = webkitConvertPointFromPageToNode(this.application.ninja.stage.canvas,
                                                        new WebKitPoint(event.pageX, event.pageY));
            this._layerX = point.x;
            this._layerY = point.y;

        if(event.which===1){
            if(this._isDrawing){
                this.endDraw(event);
                if(this._hasDraw){
                   if(this._escPressed){
                        this._mode="marqueeZoom";
                        this._zoomFactor =this.application.ninja.documentBar.zoomFactor/100;
                        this._zoomFactor *=4;
                        this._zoomFactor = this.checkZoomLimit(this._zoomFactor);
                        this._setZoom(this._mode,this._zoomFactor);
                        this._mode="modeReset";

                   }
                   this._escPressed=true;

                } else{
                        this._mode="mouseClickZoom";
                        this._zoomFactor=this.application.ninja.documentBar.zoomFactor/100;

                        if((this.options.selectedElement==="zoomInTool")){

                            if(this._altKeyDown)
                                this._zoomFactor /= 1.2 ;
                            else
                                this._zoomFactor *= 1.2 ;

                        }
                        else{
                             if(this._altKeyDown){
                                this._zoomFactor *= 1.2 ;
                             }
                            else{
                                this._zoomFactor /= 1.2 ;
                            }

                        }

                        this._zoomFactor = this.checkZoomLimit(this._zoomFactor);
                        this._setZoom(this._mode,this._zoomFactor);
                        this._mode="modeReset";

                }
            }

            this._hasDraw=false;
            NJevent("disableStageMove");
            this._isDrawing = false ;
          }
          else
            {
                return;
            }
      }
    },

    checkZoomLimit:{
        value:function( zoomFactor ){
            if(zoomFactor > 20)
                zoomFactor = 20;

            if(zoomFactor < .25)
                zoomFactor = .25;

			return zoomFactor;
        }
    },

    setCursor:{
        value:function(){

            if(this._altKeyDown){
                if(this.options.selectedElement==="zoomOutTool"){
                     var cursor = "url('images/cursors/zoom_minus.png'), default";
                    this.application.ninja.stage.drawingCanvas.style.cursor = cursor;
            }
                else{
                     var cursor = "url('images/cursors/zoom.png'), default";
                    this.application.ninja.stage.drawingCanvas.style.cursor = cursor;

            }

          }
            else{

                if(this.options.selectedElement==="zoomOutTool"){
                     var cursor = "url('images/cursors/zoom.png'), default";
                    this.application.ninja.stage.drawingCanvas.style.cursor = cursor;
            }
                else{
                     var cursor = "url('images/cursors/zoom_minus.png'), default";
                    this.application.ninja.stage.drawingCanvas.style.cursor = cursor;

            }
          }

        }
    }


});
