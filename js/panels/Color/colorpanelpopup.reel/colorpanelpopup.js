/* <copyright>
This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
(c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
</copyright> */

////////////////////////////////////////////////////////////////////////
//
var Montage = 			require("montage/core/core").Montage,
	Component = 		require("montage/ui/component").Component,
	Slider = 			require("js/components/slider.reel").Slider,
	Button = 			require("js/components/button.reel").Button,
	HotText = 			require("js/components/hottext.reel").HotText,
	ColorWheel = 		require("js/components/colorwheel.reel").ColorWheel,
	GradientPicker = 	require("js/components/gradientpicker.reel").GradientPicker;
////////////////////////////////////////////////////////////////////////
//Exporting as ColorPanelPopup
exports.ColorPanelPopup = Montage.create(Component, {
	////////////////////////////////////////////////////////////////////
	//
	hasTemplate: {
        value: true
    },
    ////////////////////////////////////////////////////////////////////
    //Storing color manager
    _colorManager: {
        enumerable: false,
        value: false
    },
    ////////////////////////////////////////////////////////////////////
    //Color manager
    colorManager: {
    	enumerable: true,
        get: function() {
            return this._colorManager;
        },
        set: function(value) {
        	if (value !== this._colorManager) {
        		this._colorManager = value;
        	}
        }
    },
    ////////////////////////////////////////////////////////////////////
    //Storing color panel
    _colorPanel: {
        enumerable: false,
        value: false
    },
    ////////////////////////////////////////////////////////////////////
    //Color panel
    colorPanel: {
    	enumerable: true,
        get: function() {
            return this._colorPanel;
        },
        set: function(value) {
        	this._colorPanel = value;
        }
    },
    ////////////////////////////////////////////////////////////////////
    //
    setNoColor: {
    	enumerable: true,
    	value: function (e) {
    		this.colorManager.applyNoColor();
    	}
    },
    ////////////////////////////////////////////////////////////////////
    //
    prepareForDraw: {
    	enumerable: false,
    	value: function () {
    		//
    		this.element._popups = {containers: {wheel: null, palette: null, gradient: null, image: null}};
    		this.element._components = {wheel: null, combo: null};
    		//Storing containers for reference
    		this.element._popups.containers.wheel = this.element.getElementsByClassName('cp_pu_wheel_container')[0];
    		this.element._popups.containers.palette = this.element.getElementsByClassName('cp_pu_palette_container')[0];
    		this.element._popups.containers.gradient = this.element.getElementsByClassName('cp_pu_gradient_container')[0];
    		this.element._popups.containers.image = this.element.getElementsByClassName('cp_pu_image_container')[0];
    		this.element._popups.containers.alpha = this.element.getElementsByClassName('cp_pu_alpha')[0];
    	}
    },
    ////////////////////////////////////////////////////////////////////
    //
    willDraw: {
    	enumerable: false,
    	value: function() {
    		//
    		this.element.style.opacity = 0;
    		//
    		this.element._components.combo = {};
    		this.element._components.combo.slider = Slider.create();
	   		this.element._components.combo.hottext = HotText.create();
    		this.element._components.combo.slider.element = this.element.getElementsByClassName('cp_pu_a_slider')[0];
   			this.element._components.combo.hottext.element = this.element.getElementsByClassName('cp_pu_a_hottext')[0];
    		//
    		Object.defineBinding(this.element._components.combo.hottext, "_value", {
   				boundObject: this.element._components.combo.slider,
       		    boundObjectPropertyPath: "value",
       		    oneway: false,
               	boundValueMutator: function(value) {
                   	return Math.round(value);
                }
   			});
   			//
   			Object.defineBinding(this.element._components.combo.hottext, "value", {
   				boundObject: this.element._components.combo.slider,
       		    boundObjectPropertyPath: "value",
       		    oneway: false,
               	boundValueMutator: function(value) {
                   	return Math.round(value);
                }
   			});
   			if (this.application.ninja.colorController.colorView) {
	    		Object.defineBinding(this.element._components.combo.slider, "value", {
    				boundObject: this.application.ninja.colorController.colorView._combo[3].slider,
       			    boundObjectPropertyPath: "value",
    	   		    oneway: false,
	               	boundValueMutator: function(value) {
                   		return Math.round(value);
                	   }
    			});
    		}
	       	//
	       	this.element._components.combo.slider.maxValue = this.element._components.combo.hottext.maxValue = 100;
	       	if (this.application.ninja.colorController.colorView) {
    			this.element._components.combo.slider.customBackground = this.application.ninja.colorController.colorView._slider3Background.bind(this.application.ninja.colorController.colorView);
    		}
    		//
   			this.element._components.combo.slider.addEventListener('change', this.alphaChange.bind(this), true);
   			this.element._components.combo.hottext.addEventListener('change', this.alphaChange.bind(this), true);
   			//
   			this.element._components.wheel = ColorWheel.create();
		    this.element._components.wheel.element = this.element._popups.containers.wheel;
	        this.element._components.wheel.element.style.display = 'block';
	        this.element._components.wheel.rimWidth = 14;
		    this.element._components.wheel.strokeWidth = 2;
		    //
	        this.element._components.wheel.value = this.colorManager.hsv;
		    this.element._components.wheel.addEventListener('change', this, true);
		    this.element._components.wheel.addEventListener('changing', this, true);
	        //
		    Object.defineBinding(this.element._components.wheel, "value", {
    			boundObject: this.colorManager,
        	    boundObjectPropertyPath: "_hsv",
               	boundValueMutator: function(value) {
                   	return value;
                }
    		});
    	}
    },
    ////////////////////////////////////////////////////////////////////
    //
    draw: {
    	enumerable: false,
    	value: function() {
    		//
    		this.drawPalette(this.defaultPalette);
    		//
    		if (!this.colorManager.gradient) {
    			this.drawGradient(this.defaultGradient);
    		}
    		//
	    	this.application.ninja.colorController.colorView.addButton('hexinput', this.element.getElementsByClassName('cp_pu_hottext_hex')[0]);
	       	//
	       	this.element._components.combo.slider.needsDraw = true;
	       	this.element._components.combo.hottext.needsDraw = true;
   			//
   			this.element.getElementsByClassName('cp_pu_nocolor')[0].addEventListener('click', function () {
   				this.setNoColor();
    		}.bind(this), true);
    		//
    		this.element.getElementsByClassName('cp_pu_palettes')[0].addEventListener('click', function () {
   				this.popupSwitchInputTo(this.element._popups.containers.palette);
    		}.bind(this), true);
    		//
    		this.element.getElementsByClassName('cp_pu_wheel')[0].addEventListener('click', function () {
   				this.popupSwitchInputTo(this.element._popups.containers.wheel);
    		}.bind(this), true);
    		//
    		this.element.getElementsByClassName('cp_pu_gradients')[0].addEventListener('click', function () {
   				this.popupSwitchInputTo(this.element._popups.containers.gradient);
    		}.bind(this), true);
    		//
    		this.element.getElementsByClassName('cp_pu_images')[0].style.opacity = .2;//TODO: Remove, visual feedback for disable button
    		this.element.getElementsByClassName('cp_pu_images')[0].addEventListener('click', function () {
   				//this.popupSwitchInputTo(this.element._popups.containers.image);
    		}.bind(this), true);
    		//
    		this.application.ninja.colorController.colorView.addButton('current', this.element.getElementsByClassName('cp_pu_color_current')[0]);
    		this.application.ninja.colorController.colorView.addButton('previous', this.element.getElementsByClassName('cp_pu_color_previous')[0]);
    		//
    		this.element._components.wheel.addEventListener('firstDraw', this, false);
    		//
    		this.element._components.wheel.needsDraw = true;
    	}
    },
    ////////////////////////////////////////////////////////////////////
    //
    didDraw: {
    	enumerable: false,
    	value: function() {
    		//
    		
    	}
    },
    ////////////////////////////////////////////////////////////////////
    //Reworking logic, firstDraw bubbles up, so target must be checked
    handleFirstDraw: {
    	enumerable: false,
    	value: function (e) {
    		//
    		if (this.element._components.wheel) {
	    		//Only using it for one instance, no need to check target
    			this.element._components.wheel.removeEventListener('firstDraw', this, false);
    		}
    		//Switching to tab from previous selection
    		switch (this.application.ninja.colorController.popupTab) {
    			case 'wheel':
    				this.popupSwitchInputTo(this.element._popups.containers.wheel);
    				break;
    			case 'palette':
    				this.popupSwitchInputTo(this.element._popups.containers.palette);
    				break;
    			case 'image':
    				this.popupSwitchInputTo(this.element._popups.containers.image);
    				break;
    			default:
    				this.popupSwitchInputTo(this.element._popups.containers.wheel);
    				break
    		}
    		//Checking for a gradient to be current color
    		if (this.colorManager.gradient) {
    			if (this.colorManager.colorHistory[this.colorManager.input] && this.colorManager.colorHistory[this.colorManager.input][this.colorManager.colorHistory[this.colorManager.input].length-1].m !== 'gradient') {
    				//If no gradient set, using default
    				this.drawGradient(this.defaultGradient);
    			} else {
    				//Gradient has been set, so opening gradient tab with gradient
	   				this.drawGradient(this.colorManager.gradient);
   					this.popupSwitchInputTo(this.element._popups.containers.gradient);
   				}
    		}
    		//Displaying element once it's been drawn
	   		this.element.style.opacity = 1;
    	}
    },
    ////////////////////////////////////////////////////////////////////
    //
    popupSwitchInputTo: {
    	enumerable: true,
    	value: function (tab) {
    		//
    		if (tab !== this.element._popups.containers.palette) {
    			this.element._popups.containers.palette.style.display = 'none';
    		} else {
    			this.element._popups.containers.palette.style.display = 'block';
    			this.element._popups.containers.alpha.style.display = 'block';
    			//
    			this.application.ninja.colorController.popupTab = 'palette';
    		}
    		//
    		if (tab !== this.element._popups.containers.wheel && this.element._components.wheel.element) {
    			this.element._components.wheel.element.style.display = 'none';
    		} else if (this.element._components.wheel.element && this.element._components.wheel.element.style.display !== 'block'){
    			this.element._components.wheel.element.style.display = 'block';
    			this.element._popups.containers.alpha.style.display = 'block';
    			//
    			this.application.ninja.colorController.popupTab = 'wheel';
    		} else {
    			this.element._popups.containers.wheel.style.display = 'none';
    		}
    		//
    		if (tab !== this.element._popups.containers.image) {
    			this.element._popups.containers.image.style.display = 'none';
    		} else {
    			this.element._popups.containers.image.style.display = 'block';
    			this.element._popups.containers.alpha.style.display = 'none';
    			//
    			this.application.ninja.colorController.popupTab = 'image';
    		}
    		//
    		if (tab !== this.element._popups.containers.gradient) {
    			this.element._popups.containers.gradient.style.display = 'none';
    			//
    			if (this.element._components.wheel._value) {
    				this.element._components.wheel.value = {h: this.element._components.wheel._value.h, s: this.element._components.wheel._value.s, v: this.element._components.wheel._value.v, wasSetByCode: false};
    			} else {
    				this.element._components.wheel.value = {h: 0, s: 1, v: 1, wasSetByCode: false};
    			}
    		} else {
    			this.element._popups.containers.gradient.style.display = 'block';
    			this.element._popups.containers.alpha.style.display = 'none';
    			//
    			this.application.ninja.colorController.popupTab = 'gradient';
    		}
    		//
    		this.application.ninja.colorController.colorPopupManager.hideColorChipPopup();
    	}
    },
    ////////////////////////////////////////////////////////////////////
    //
    drawPalette: {
    	enumerable: true,
    	value: function (c) {
    		var i, button;
    		//
    		this.element._popups.containers.palette.style.display = 'block';
    		//
    		for (i in c) {
    			button = document.createElement('button');
    			button.style.background = c[i].css;
    			button.title = c[i].css.toUpperCase();
    			button.colorMode = c[i].mode;
    			button.colorValue = c[i].value;
    			this.element._popups.containers.palette.appendChild(button);
    			button.addEventListener('click', function (b) {
    				var rgb, color;
    				//
    				if (b._event.srcElement.colorMode !== 'hex') {
    					color = b._event.srcElement.colorValue;
	    				color.wasSetByCode = false;
    					color.type = 'change';
    					this.colorManager[b._event.srcElement.colorMode] = color;
    				} else {
    					if (this.colorManager.mode === 'hsl') {
    						rgb = this.colorManager.hexToRgb(b._event.srcElement.colorValue);
    						if (rgb) {
			    				color = this.colorManager.rgbToHsl(rgb.r, rgb.g, rgb.b);
    							color.wasSetByCode = false;
			    				color.type = 'change';
    							this.colorManager.hsl = color;
    						} else {
			    				this.colorManager.applyNoColor();
    						}
			    		} else {
    						color = this.colorManager.hexToRgb(b._event.srcElement.colorValue);
			    			if (color) {
    							color.wasSetByCode = false;
    							color.type = 'change';
			    				this.colorManager.rgb = color;
    						} else {
    							this.colorManager.applyNoColor();
			    			}
    					}
    				}
    			}.bind(this), true);
    		}
    		//
    		this.element._popups.containers.palette.style.display = 'none';
    	}
    },
    ////////////////////////////////////////////////////////////////////
    //
    defaultPalette: {
    	enumerable: true,
    	value: [{mode: 'hex', value: '000000', css: '#000000'}, {mode: 'hex', value: '808080', css: '#808080'}, {mode: 'hex', value: '000000', css: '#000000'}, {mode: 'hex', value: '003300', css: '#003300'}, {mode: 'hex', value: '006600', css: '#006600'}, {mode: 'hex', value: '009900', css: '#009900'}, {mode: 'hex', value: '00cc00', css: '#00cc00'}, {mode: 'hex', value: '00ff00', css: '#00ff00'}, {mode: 'hex', value: '330000', css: '#330000'}, {mode: 'hex', value: '333300', css: '#333300'}, {mode: 'hex', value: '336600', css: '#336600'}, {mode: 'hex', value: '339900', css: '#339900'}, {mode: 'hex', value: '33cc00', css: '#33cc00'}, {mode: 'hex', value: '33ff00', css: '#33ff00'}, {mode: 'hex', value: '660000', css: '#660000'}, {mode: 'hex', value: '663300', css: '#663300'}, {mode: 'hex', value: '666600', css: '#666600'}, {mode: 'hex', value: '669900', css: '#669900'}, {mode: 'hex', value: '66cc00', css: '#66cc00'}, {mode: 'hex', value: '66ff00', css: '#66ff00'},
    			{mode: 'hex', value: '333333', css: '#333333'}, {mode: 'hex', value: '808080', css: '#808080'}, {mode: 'hex', value: '000033', css: '#000033'}, {mode: 'hex', value: '003333', css: '#003333'}, {mode: 'hex', value: '006633', css: '#006633'}, {mode: 'hex', value: '009933', css: '#009933'}, {mode: 'hex', value: '00cc33', css: '#00cc33'}, {mode: 'hex', value: '00ff33', css: '#00ff33'}, {mode: 'hex', value: '330033', css: '#330033'}, {mode: 'hex', value: '333333', css: '#333333'}, {mode: 'hex', value: '336633', css: '#336633'}, {mode: 'hex', value: '339933', css: '#339933'}, {mode: 'hex', value: '33cc33', css: '#33cc33'}, {mode: 'hex', value: '33ff33', css: '#33ff33'}, {mode: 'hex', value: '660033', css: '#660033'}, {mode: 'hex', value: '663333', css: '#663333'}, {mode: 'hex', value: '666633', css: '#666633'}, {mode: 'hex', value: '669933', css: '#669933'}, {mode: 'hex', value: '66cc33', css: '#66cc33'}, {mode: 'hex', value: '66ff33', css: '#66ff33'},
    			{mode: 'hex', value: '666666', css: '#666666'}, {mode: 'hex', value: '808080', css: '#808080'}, {mode: 'hex', value: '000066', css: '#000066'}, {mode: 'hex', value: '003366', css: '#003366'}, {mode: 'hex', value: '006666', css: '#006666'}, {mode: 'hex', value: '009966', css: '#009966'}, {mode: 'hex', value: '00cc66', css: '#00cc66'}, {mode: 'hex', value: '00ff66', css: '#00ff66'}, {mode: 'hex', value: '330066', css: '#330066'}, {mode: 'hex', value: '333366', css: '#333366'}, {mode: 'hex', value: '336666', css: '#336666'}, {mode: 'hex', value: '339966', css: '#339966'}, {mode: 'hex', value: '33cc66', css: '#33cc66'}, {mode: 'hex', value: '33ff66', css: '#33ff66'}, {mode: 'hex', value: '660066', css: '#660066'}, {mode: 'hex', value: '663366', css: '#663366'}, {mode: 'hex', value: '666666', css: '#666666'}, {mode: 'hex', value: '669966', css: '#669966'}, {mode: 'hex', value: '66cc66', css: '#66cc66'}, {mode: 'hex', value: '66ff66', css: '#66ff66'},
    			{mode: 'hex', value: '999999', css: '#999999'}, {mode: 'hex', value: '808080', css: '#808080'}, {mode: 'hex', value: '000099', css: '#000099'}, {mode: 'hex', value: '003399', css: '#003399'}, {mode: 'hex', value: '006699', css: '#006699'}, {mode: 'hex', value: '009999', css: '#009999'}, {mode: 'hex', value: '00cc99', css: '#00cc99'}, {mode: 'hex', value: '00ff99', css: '#00ff99'}, {mode: 'hex', value: '330099', css: '#330099'}, {mode: 'hex', value: '333399', css: '#333399'}, {mode: 'hex', value: '336699', css: '#336699'}, {mode: 'hex', value: '339999', css: '#339999'}, {mode: 'hex', value: '33cc99', css: '#33cc99'}, {mode: 'hex', value: '33ff99', css: '#33ff99'}, {mode: 'hex', value: '660099', css: '#660099'}, {mode: 'hex', value: '663399', css: '#663399'}, {mode: 'hex', value: '666699', css: '#666699'}, {mode: 'hex', value: '669999', css: '#669999'}, {mode: 'hex', value: '66cc99', css: '#66cc99'}, {mode: 'hex', value: '66ff99', css: '#66ff99'},
    			{mode: 'hex', value: 'cccccc', css: '#cccccc'}, {mode: 'hex', value: '808080', css: '#808080'}, {mode: 'hex', value: '0000cc', css: '#0000cc'}, {mode: 'hex', value: '0033cc', css: '#0033cc'}, {mode: 'hex', value: '0066cc', css: '#0066cc'}, {mode: 'hex', value: '0099cc', css: '#0099cc'}, {mode: 'hex', value: '00cccc', css: '#00cccc'}, {mode: 'hex', value: '00ffcc', css: '#00ffcc'}, {mode: 'hex', value: '3300cc', css: '#3300cc'}, {mode: 'hex', value: '3333cc', css: '#3333cc'}, {mode: 'hex', value: '3366cc', css: '#3366cc'}, {mode: 'hex', value: '3399cc', css: '#3399cc'}, {mode: 'hex', value: '33cccc', css: '#33cccc'}, {mode: 'hex', value: '33ffcc', css: '#33ffcc'}, {mode: 'hex', value: '6600cc', css: '#6600cc'}, {mode: 'hex', value: '6633cc', css: '#6633cc'}, {mode: 'hex', value: '6666cc', css: '#6666cc'}, {mode: 'hex', value: '6699cc', css: '#6699cc'}, {mode: 'hex', value: '66cccc', css: '#66cccc'}, {mode: 'hex', value: '66ffcc', css: '#66ffcc'},
    			{mode: 'hex', value: 'ffffff', css: '#ffffff'}, {mode: 'hex', value: '808080', css: '#808080'}, {mode: 'hex', value: '0000ff', css: '#0000ff'}, {mode: 'hex', value: '0033ff', css: '#0033ff'}, {mode: 'hex', value: '0066ff', css: '#0066ff'}, {mode: 'hex', value: '0099ff', css: '#0099ff'}, {mode: 'hex', value: '00ccff', css: '#00ccff'}, {mode: 'hex', value: '00ffff', css: '#00ffff'}, {mode: 'hex', value: '3300ff', css: '#3300ff'}, {mode: 'hex', value: '3333ff', css: '#3333ff'}, {mode: 'hex', value: '3366ff', css: '#3366ff'}, {mode: 'hex', value: '3399ff', css: '#3399ff'}, {mode: 'hex', value: '33ccff', css: '#33ccff'}, {mode: 'hex', value: '33ffff', css: '#33ffff'}, {mode: 'hex', value: '6600ff', css: '#6600ff'}, {mode: 'hex', value: '6633ff', css: '#6633ff'}, {mode: 'hex', value: '6666ff', css: '#6666ff'}, {mode: 'hex', value: '6699ff', css: '#6699ff'}, {mode: 'hex', value: '66ccff', css: '#66ccff'}, {mode: 'hex', value: '66ffff', css: '#66ffff'},
    			{mode: 'hex', value: 'ff0000', css: '#ff0000'}, {mode: 'hex', value: '808080', css: '#808080'}, {mode: 'hex', value: '990000', css: '#990000'}, {mode: 'hex', value: '993300', css: '#993300'}, {mode: 'hex', value: '996600', css: '#996600'}, {mode: 'hex', value: '999900', css: '#999900'}, {mode: 'hex', value: '99cc00', css: '#99cc00'}, {mode: 'hex', value: '99ff00', css: '#99ff00'}, {mode: 'hex', value: 'cc0000', css: '#cc0000'}, {mode: 'hex', value: 'cc3300', css: '#cc3300'}, {mode: 'hex', value: 'cc6600', css: '#cc6600'}, {mode: 'hex', value: 'cc9900', css: '#cc9900'}, {mode: 'hex', value: 'cccc00', css: '#cccc00'}, {mode: 'hex', value: 'ccff00', css: '#ccff00'}, {mode: 'hex', value: 'ff0000', css: '#ff0000'}, {mode: 'hex', value: 'ff3300', css: '#ff3300'}, {mode: 'hex', value: 'ff6600', css: '#ff6600'}, {mode: 'hex', value: 'ff9900', css: '#ff9900'}, {mode: 'hex', value: 'ffcc00', css: '#ffcc00'}, {mode: 'hex', value: 'ffff00', css: '#ffff00'},
    			{mode: 'hex', value: '00ff00', css: '#00ff00'}, {mode: 'hex', value: '808080', css: '#808080'}, {mode: 'hex', value: '990033', css: '#990033'}, {mode: 'hex', value: '993333', css: '#993333'}, {mode: 'hex', value: '996633', css: '#996633'}, {mode: 'hex', value: '999933', css: '#999933'}, {mode: 'hex', value: '99cc33', css: '#99cc33'}, {mode: 'hex', value: '99ff33', css: '#99ff33'}, {mode: 'hex', value: 'cc0033', css: '#cc0033'}, {mode: 'hex', value: 'cc3333', css: '#cc3333'}, {mode: 'hex', value: 'cc6633', css: '#cc6633'}, {mode: 'hex', value: 'cc9933', css: '#cc9933'}, {mode: 'hex', value: 'cccc33', css: '#cccc33'}, {mode: 'hex', value: 'ccff33', css: '#ccff33'}, {mode: 'hex', value: 'ff0033', css: '#ff0033'}, {mode: 'hex', value: 'ff3333', css: '#ff3333'}, {mode: 'hex', value: 'ff6633', css: '#ff6633'}, {mode: 'hex', value: 'ff9933', css: '#ff9933'}, {mode: 'hex', value: 'ffcc33', css: '#ffcc33'}, {mode: 'hex', value: 'ffff33', css: '#ffff33'},
    			{mode: 'hex', value: '0000ff', css: '#0000ff'}, {mode: 'hex', value: '808080', css: '#808080'}, {mode: 'hex', value: '990066', css: '#990066'}, {mode: 'hex', value: '993366', css: '#993366'}, {mode: 'hex', value: '996666', css: '#996666'}, {mode: 'hex', value: '999966', css: '#999966'}, {mode: 'hex', value: '99cc66', css: '#99cc66'}, {mode: 'hex', value: '99ff66', css: '#99ff66'}, {mode: 'hex', value: 'cc0066', css: '#cc0066'}, {mode: 'hex', value: 'cc3366', css: '#cc3366'}, {mode: 'hex', value: 'cc6666', css: '#cc6666'}, {mode: 'hex', value: 'cc9966', css: '#cc9966'}, {mode: 'hex', value: 'cccc66', css: '#cccc66'}, {mode: 'hex', value: 'ccff66', css: '#ccff66'}, {mode: 'hex', value: 'ff0066', css: '#ff0066'}, {mode: 'hex', value: 'ff3366', css: '#ff3366'}, {mode: 'hex', value: 'ff6666', css: '#ff6666'}, {mode: 'hex', value: 'ff9966', css: '#ff9966'}, {mode: 'hex', value: 'ffcc66', css: '#ffcc66'}, {mode: 'hex', value: 'ffff66', css: '#ffff66'},
    			{mode: 'hex', value: 'ffff00', css: '#ffff00'}, {mode: 'hex', value: '808080', css: '#808080'}, {mode: 'hex', value: '990099', css: '#990099'}, {mode: 'hex', value: '993399', css: '#993399'}, {mode: 'hex', value: '996699', css: '#996699'}, {mode: 'hex', value: '999999', css: '#999999'}, {mode: 'hex', value: '99cc99', css: '#99cc99'}, {mode: 'hex', value: '99ff99', css: '#99ff99'}, {mode: 'hex', value: 'cc0099', css: '#cc0099'}, {mode: 'hex', value: 'cc3399', css: '#cc3399'}, {mode: 'hex', value: 'cc6699', css: '#cc6699'}, {mode: 'hex', value: 'cc9999', css: '#cc9999'}, {mode: 'hex', value: 'cccc99', css: '#cccc99'}, {mode: 'hex', value: 'ccff99', css: '#ccff99'}, {mode: 'hex', value: 'ff0099', css: '#ff0099'}, {mode: 'hex', value: 'ff3399', css: '#ff3399'}, {mode: 'hex', value: 'ff6699', css: '#ff6699'}, {mode: 'hex', value: 'ff9999', css: '#ff9999'}, {mode: 'hex', value: 'ffcc99', css: '#ffcc99'}, {mode: 'hex', value: 'ffff99', css: '#ffff99'},
    			{mode: 'hex', value: '00ffff', css: '#00ffff'}, {mode: 'hex', value: '808080', css: '#808080'}, {mode: 'hex', value: '9900cc', css: '#9900cc'}, {mode: 'hex', value: '9933cc', css: '#9933cc'}, {mode: 'hex', value: '9966cc', css: '#9966cc'}, {mode: 'hex', value: '9999cc', css: '#9999cc'}, {mode: 'hex', value: '99cccc', css: '#99cccc'}, {mode: 'hex', value: '99ffcc', css: '#99ffcc'}, {mode: 'hex', value: 'cc00cc', css: '#cc00cc'}, {mode: 'hex', value: 'cc33cc', css: '#cc33cc'}, {mode: 'hex', value: 'cc66cc', css: '#cc66cc'}, {mode: 'hex', value: 'cc99cc', css: '#cc99cc'}, {mode: 'hex', value: 'cccccc', css: '#cccccc'}, {mode: 'hex', value: 'ccffcc', css: '#ccffcc'}, {mode: 'hex', value: 'ff00cc', css: '#ff00cc'}, {mode: 'hex', value: 'ff33cc', css: '#ff33cc'}, {mode: 'hex', value: 'ff66cc', css: '#ff66cc'}, {mode: 'hex', value: 'ff99cc', css: '#ff99cc'}, {mode: 'hex', value: 'ffcccc', css: '#ffcccc'}, {mode: 'hex', value: 'ffffcc', css: '#ffffcc'},
    			{mode: 'hex', value: 'ff00ff', css: '#ff00ff'}, {mode: 'hex', value: '808080', css: '#808080'}, {mode: 'hex', value: '9900ff', css: '#9900ff'}, {mode: 'hex', value: '9933ff', css: '#9933ff'}, {mode: 'hex', value: '9966ff', css: '#9966ff'}, {mode: 'hex', value: '9999ff', css: '#9999ff'}, {mode: 'hex', value: '99ccff', css: '#99ccff'}, {mode: 'hex', value: '99ffff', css: '#99ffff'}, {mode: 'hex', value: 'cc00ff', css: '#cc00ff'}, {mode: 'hex', value: 'cc33ff', css: '#cc33ff'}, {mode: 'hex', value: 'cc66ff', css: '#cc66ff'}, {mode: 'hex', value: 'cc99ff', css: '#cc99ff'}, {mode: 'hex', value: 'ccccff', css: '#ccccff'}, {mode: 'hex', value: 'ccffff', css: '#ccffff'}, {mode: 'hex', value: 'ff00ff', css: '#ff00ff'}, {mode: 'hex', value: 'ff33ff', css: '#ff33ff'}, {mode: 'hex', value: 'ff66ff', css: '#ff66ff'}, {mode: 'hex', value: 'ff99ff', css: '#ff99ff'}, {mode: 'hex', value: 'ffccff', css: '#ffccff'}, {mode: 'hex', value: 'ffffff', css: '#ffffff'}]
    },
    ////////////////////////////////////////////////////////////////////
    //
    drawGradient: {
    	enumerable: true,
    	value: function (g) {
    		//TODO: Remove container, insert in reel
    		var container = document.createElement('div'), gradient = GradientPicker.create();
    		this.element._popups.containers.gradient.appendChild(container);
    		//Creating gradient picker from components
    		gradient.element = container;
    		gradient.hack = this.hack; // TODO: Remove
    		//
    		if (g && g.value && g.value.stops && g.value.mode) {
    			gradient._mode = g.value.mode;
    			gradient.value = g.value.stops;
    		} else {
    			gradient._mode = this.defaultGradient.mode;
    			gradient.value = this.defaultGradient.stops;
    		}
    		//
    		gradient.needsDraw = true;
    		gradient.addEventListener('change', function (e){
    			//
    			if (!e._event.wasSetByCode) {
    				this.colorManager.gradient = {value: e._event.gradient, type: 'change', wasSetByCode: false};
    			}
    		}.bind(this), true);
    	}
    },
     ////////////////////////////////////////////////////////////////////
    //
    defaultGradient: {
    	enumerable: true,
    	value: {mode: 'linear', stops: [{mode: 'rgb', value: {r: 255, g: 255, b: 255, a: 1, css: 'rgb(255, 255, 255)'}, position: 0}, {mode: 'rgb', value: {r: 0, g: 0, b: 0, a: 1, css: 'rgb(0, 0, 0)'}, position: 100}]}
    },
    ////////////////////////////////////////////////////////////////////
    //
    alphaChange: {
    	enumerable: false,
    	value: function (e) {
	    	if (!e._event.wasSetByCode) {
    			var update = {value: this.element._components.combo.slider.value/100, wasSetByCode: false, type: 'change'};
    			this.colorManager.alpha = update;
    		}
    	}
    },
    ////////////////////////////////////////////////////////////////////
    //
    handleChange: {
    	enumerable: false,
    	value: function (e) {
    		this.dispatchEvent(e._event);
    	}
    },
    ////////////////////////////////////////////////////////////////////
    //
    handleChanging: {
    	enumerable: false,
    	value: function (e) {
    		this.dispatchEvent(e._event);
    	}
    },
    ////////////////////////////////////////////////////////////////////
    //
    _handleWheelEvent: {
    	enumerable: false,
    	value: function (e) {
    		if (!e._event.wasSetByCode) {
    			//
    			this.dispatchEvent(e);
    		}
    	}
    },
    ////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////
    //Garbage collection (Manual method)
    destroy: {
    	enumerable: false,
    	value: function() {
    		//
    		this.application.ninja.colorController.colorView.removeButton('hexinput', this.element.getElementsByClassName('cp_pu_hottext_hex')[0]);
    		Object.deleteBinding(this.element._components.combo.hottext, "value");
    		Object.deleteBinding(this.element._components.combo.slider, "value");
    		Object.deleteBinding(this.element._components.wheel, "value");
    		this.element._components.wheel = null;
    	}
    }
    ////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////
});
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////