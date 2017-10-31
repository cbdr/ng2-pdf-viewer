/// <reference types="pdf" />
/**
 * Created by vadimdez on 21/06/16.
 */
import { ElementRef, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
export declare class PdfViewerComponent implements OnChanges {
    private element;
    private _showAll;
    private _renderText;
    private _originalSize;
    private _pdf;
    private _page;
    private _zoom;
    private _rotation;
    private resizeTimeout;
    private pdfjsPromise;
    afterLoadComplete: EventEmitter<PDFDocumentProxy>;
    onError: EventEmitter<any>;
    onProgress: EventEmitter<PDFProgressData>;
    constructor(element: ElementRef);
    src: string | Uint8Array | PDFSource;
    page: any;
    pageChange: EventEmitter<number>;
    renderText: boolean;
    originalSize: boolean;
    showAll: boolean;
    zoom: number;
    rotation: number;
    ngOnChanges(changes: SimpleChanges): void;
    onPageResize(): void;
    private loadPDF();
    private update();
    private render();
    private renderMultiplePages();
    private isValidPageNumber(page);
    private renderPage(pageNumber);
    private removeAllChildNodes(element);
}
