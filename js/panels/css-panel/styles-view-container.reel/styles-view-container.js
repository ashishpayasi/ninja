/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.StylesViewContainer = Montage.create(Component, {
    contentController : {
        value: null
    },
    contentPanel : {
        value: 'rules'
    },
    _hasStyles : {
        value: false
    },
    hasStyles : {
        get: function() {
            return this._hasStyles;
        },
        set: function(hasThem) {
            this._hasStyles = hasThem;
            this.needsDraw = true;
        }
    },

    _getElementLabel : {
        value: function(el) {
            var id = '#'+el.id,
                className = '.'+Array.prototype.slice.call(el.classList).join('.'),
                nodeName = el.nodeName;

            if(id.length > 1) {
                return nodeName + id;
            } else if(className.length > 1) {
                return nodeName + className;
            }

            return nodeName;
        }
    },

    templateDidLoad : {
        value: function() {
            this.eventManager.addEventListener('styleSheetsReady', this, false);
            //this.eventManager.addEventListener('elementChanging', this, false);
            this.eventManager.addEventListener('elementChange', this, false);
        }
    },
    handleStyleSheetsReady: {
        value: function(e) {
            this.eventManager.addEventListener( "selectionChange", this, false);
        }
    },
    handleSelectionChange: {
        value: function() {
            var elements = this.application.ninja.selectedElements;

            if(elements.length === 0) {
                this.hasStyles = false;
                return false;
            } else if(elements.length === 1) {

                ///// update the selection status label with the label of the element
                this.selectionNameLabel.innerHTML = this._getElementLabel(elements[0]);

                if(this.contentPanel === "rules") {
                    this.ruleListContainer.displayListForSelection(elements);
                } else {
                    this.computedStyleView.declaration = elements[0];
                }
            } else {

            }

            this.hasStyles = true;
        }
    },
    handleElementChange : {
        value: function(e) {
            var elements = this.application.ninja.selectedElements;

            if(elements.length === 0) {
                return false;
            } else if(elements.length === 1) {
                if(this.contentPanel === "rules") {
                    if(e._event.detail.type !== 'cssChange') {
                        this.ruleListContainer.displayedList.component.update();
                    }
                } else {
                    this.computedStyleView.declaration = elements[0];
                }
            } else {
                return false;
            }

        }
    },

    handleElementChanging : {
        value: function(e) {
            var elements = this.application.ninja.selectedElements;

            if(elements.length === 1) {
                if(this.contentPanel === "rules") {
//                    if(e._event.detail.type !== 'cssChange') {
//                        this.ruleListContainer.displayedList.component.update();
//                    }
                } else {
                    this.computedStyleView.declaration = elements[0];
                }
            }

               return false;

        }
    },

    draw : {
        value: function() {
            if(this.hasStyles) {
                this.element.classList.remove('no-styles');
                this.selectionNameLabel.classList.remove('no-styles');
            } else {
                this.element.classList.add('no-styles');
                this.selectionNameLabel.classList.add('no-styles');
            }
        }
    }
});