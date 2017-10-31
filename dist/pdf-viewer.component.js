/**
 * Created by vadimdez on 21/06/16.
 */
import { Component, Input, Output, ElementRef, EventEmitter } from '@angular/core';
var PdfViewerComponent = (function () {
    /**
     * @param {?} element
     */
    function PdfViewerComponent(element) {
        this.element = element;
        this._showAll = false;
        this._renderText = true;
        this._originalSize = true;
        this._page = 1;
        this._zoom = 1;
        this._rotation = 0;
        this.afterLoadComplete = new EventEmitter();
        this.onError = new EventEmitter();
        this.onProgress = new EventEmitter();
        this.pageChange = new EventEmitter(true);
        this.pdfjsPromise = import(/* webpackChunkName: "pdfjs" */ 'pdfjs-dist/build/pdf').then(function (pdfjsGlobal) {
            var pdfjs = pdfjsGlobal.PDFJS;
            pdfjs.verbosity = pdfjs.VERBOSITY_LEVELS.errors;
            pdfjs.workerSrc = 'https://mozilla.github.io/pdf.js/build/pdf.worker.js';
            return Promise.resolve(pdfjs);
        });
    }
    Object.defineProperty(PdfViewerComponent.prototype, "page", {
        /**
         * @param {?} _page
         * @return {?}
         */
        set: function (_page) {
            _page = parseInt(_page, 10);
            if (this._pdf && !this.isValidPageNumber(_page)) {
                _page = 1;
            }
            this._page = _page;
            this.pageChange.emit(_page);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PdfViewerComponent.prototype, "renderText", {
        /**
         * @param {?} renderText
         * @return {?}
         */
        set: function (renderText) {
            this._renderText = renderText;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PdfViewerComponent.prototype, "originalSize", {
        /**
         * @param {?} originalSize
         * @return {?}
         */
        set: function (originalSize) {
            this._originalSize = originalSize;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PdfViewerComponent.prototype, "showAll", {
        /**
         * @param {?} value
         * @return {?}
         */
        set: function (value) {
            this._showAll = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PdfViewerComponent.prototype, "zoom", {
        /**
         * @return {?}
         */
        get: function () {
            return this._zoom;
        },
        /**
         * @param {?} value
         * @return {?}
         */
        set: function (value) {
            if (value <= 0) {
                return;
            }
            this._zoom = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PdfViewerComponent.prototype, "rotation", {
        /**
         * @param {?} value
         * @return {?}
         */
        set: function (value) {
            if (!(typeof value === 'number' && value % 90 === 0)) {
                console.warn('Invalid pages rotation angle.');
                return;
            }
            this._rotation = value;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @param {?} changes
     * @return {?}
     */
    PdfViewerComponent.prototype.ngOnChanges = function (changes) {
        if ('src' in changes) {
            this.loadPDF();
        }
        else if (this._pdf) {
            this.update();
        }
    };
    /**
     * @return {?}
     */
    PdfViewerComponent.prototype.onPageResize = function () {
        var _this = this;
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout(function () {
            _this.render();
        }, 100);
    };
    /**
     * @return {?}
     */
    PdfViewerComponent.prototype.loadPDF = function () {
        var _this = this;
        if (!this.src) {
            return;
        }
        this.pdfjsPromise.then(function (pdfjs) {
            var /** @type {?} */ loadingTask = pdfjs.getDocument(_this.src);
            loadingTask.onProgress = function (progressData) {
                _this.onProgress.emit(progressData);
            };
            ((loadingTask.promise))
                .then(function (pdf) {
                _this._pdf = pdf;
                _this.afterLoadComplete.emit(pdf);
                _this.update();
            }, function (error) {
                _this.onError.emit(error);
            });
        });
    };
    /**
     * @return {?}
     */
    PdfViewerComponent.prototype.update = function () {
        this.page = this._page;
        this.render();
    };
    /**
     * @return {?}
     */
    PdfViewerComponent.prototype.render = function () {
        if (!this._showAll) {
            this.renderPage(this._page);
        }
        else {
            this.renderMultiplePages();
        }
    };
    /**
     * @return {?}
     */
    PdfViewerComponent.prototype.renderMultiplePages = function () {
        var _this = this;
        var /** @type {?} */ container = this.element.nativeElement.querySelector('div');
        this.removeAllChildNodes(container);
        // render pages synchronously
        var /** @type {?} */ render = function (page) {
            _this.renderPage(page).then(function () {
                if (page < _this._pdf.numPages) {
                    render(page + 1);
                }
            });
        };
        render(1);
    };
    /**
     * @param {?} page
     * @return {?}
     */
    PdfViewerComponent.prototype.isValidPageNumber = function (page) {
        return this._pdf.numPages >= page && page >= 1;
    };
    /**
     * @param {?} pageNumber
     * @return {?}
     */
    PdfViewerComponent.prototype.renderPage = function (pageNumber) {
        var _this = this;
        return this._pdf.getPage(pageNumber).then(function (page) {
            var /** @type {?} */ viewport = page.getViewport(_this._zoom, _this._rotation);
            var /** @type {?} */ container = _this.element.nativeElement.querySelector('div');
            if (!_this._originalSize) {
                viewport = page.getViewport(_this.element.nativeElement.offsetWidth / viewport.width, _this._rotation);
            }
            if (!_this._showAll) {
                _this.removeAllChildNodes(container);
            }
            return Promise.all([
                ((page)).getOperatorList(),
                _this.pdfjsPromise
            ]).then(function (_a) {
                var opList = _a[0], pdfjs = _a[1];
                var /** @type {?} */ svgGfx = new ((pdfjs)).SVGGraphics(((page)).commonObjs, ((page)).objs);
                return svgGfx.getSVG(opList, viewport).then(function (svg) {
                    var /** @type {?} */ $div = document.createElement('div');
                    $div.classList.add('page');
                    $div.setAttribute('data-page-number', "" + page.pageNumber);
                    $div.appendChild(svg);
                    container.appendChild($div);
                });
            });
        });
    };
    /**
     * @param {?} element
     * @return {?}
     */
    PdfViewerComponent.prototype.removeAllChildNodes = function (element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    };
    PdfViewerComponent.decorators = [
        { type: Component, args: [{
                    selector: 'pdf-viewer',
                    template: "\n    <div class=\"ng2-pdf-viewer-container\"\n       [ngClass]=\"{'ng2-pdf-viewer--zoom': zoom < 1}\"\n       (window:resize)=\"onPageResize()\"\n    ></div>\n  ",
                    styles: ["\n    .ng2-pdf-viewer--zoom {\n      overflow-x: scroll;\n    }\n    \n    :host >>> .ng2-pdf-viewer-container .page {\n      background-color: #fff;\n    }\n  "]
                },] },
    ];
    /**
     * @nocollapse
     */
    PdfViewerComponent.ctorParameters = function () { return [
        { type: ElementRef, },
    ]; };
    PdfViewerComponent.propDecorators = {
        'afterLoadComplete': [{ type: Output, args: ['after-load-complete',] },],
        'onError': [{ type: Output, args: ['error',] },],
        'onProgress': [{ type: Output, args: ['on-progress',] },],
        'src': [{ type: Input },],
        'page': [{ type: Input, args: ['page',] },],
        'pageChange': [{ type: Output },],
        'renderText': [{ type: Input, args: ['render-text',] },],
        'originalSize': [{ type: Input, args: ['original-size',] },],
        'showAll': [{ type: Input, args: ['show-all',] },],
        'zoom': [{ type: Input, args: ['zoom',] },],
        'rotation': [{ type: Input, args: ['rotation',] },],
    };
    return PdfViewerComponent;
}());
export { PdfViewerComponent };
function PdfViewerComponent_tsickle_Closure_declarations() {
    /** @type {?} */
    PdfViewerComponent.decorators;
    /**
     * @nocollapse
     * @type {?}
     */
    PdfViewerComponent.ctorParameters;
    /** @type {?} */
    PdfViewerComponent.propDecorators;
    /** @type {?} */
    PdfViewerComponent.prototype._showAll;
    /** @type {?} */
    PdfViewerComponent.prototype._renderText;
    /** @type {?} */
    PdfViewerComponent.prototype._originalSize;
    /** @type {?} */
    PdfViewerComponent.prototype._pdf;
    /** @type {?} */
    PdfViewerComponent.prototype._page;
    /** @type {?} */
    PdfViewerComponent.prototype._zoom;
    /** @type {?} */
    PdfViewerComponent.prototype._rotation;
    /** @type {?} */
    PdfViewerComponent.prototype.resizeTimeout;
    /** @type {?} */
    PdfViewerComponent.prototype.pdfjsPromise;
    /** @type {?} */
    PdfViewerComponent.prototype.afterLoadComplete;
    /** @type {?} */
    PdfViewerComponent.prototype.onError;
    /** @type {?} */
    PdfViewerComponent.prototype.onProgress;
    /** @type {?} */
    PdfViewerComponent.prototype.src;
    /** @type {?} */
    PdfViewerComponent.prototype.pageChange;
    /** @type {?} */
    PdfViewerComponent.prototype.element;
}
//# sourceMappingURL=pdf-viewer.component.js.map