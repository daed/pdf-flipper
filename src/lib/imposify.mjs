// pdf.js
import { PDFDocument, rgb } from 'pdf-lib';

const newPage = async (pdf) => {
    // Check if the document has at least two pages to get the dimensions from the second page
    if (pdf.getPageCount() < 2) {
        console.error("The document does not have a second page.");
        return;
    }
    
    // Get the second page
    const secondPage = pdf.getPages()[1];
    
    // Extract the width and height from the second page
    const width = secondPage.getWidth();
    const height = secondPage.getHeight();
    
    // Add a new blank page with the same dimensions as the second page
    const blankPage = pdf.addPage([width, height]);
    
    // Optionally set the entire new page as white
    // Note: This step might be unnecessary if you're okay with the default white background,
    // but it ensures the page is initialized with content.
    blankPage.drawRectangle({
        x: 0, // Starting X coordinate
        y: 0, // Starting Y coordinate
        width: width,
        height: height,
        color: rgb(1, 1, 1), // RGB color for white
    });
    pdf.embedPage(blankPage);
}

const makePageSpread = async (pdf, firstPage, secondPage) => { 
    const width = firstPage.width;
    const height = firstPage.height;
    // Create a new page with double the width of the original to hold two pages side by side
    const newPage = pdf.addPage([width * 2, height]);

    // Draw the first page on the left half
    newPage.drawPage(firstPage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
    });
    // Draw the second page on the right half
    newPage.drawPage(secondPage, {
        x: width, // Offset by the width of the first page
        y: 0,
        width: width,
        height: height,
    });
}


export default class Impose {
    loaded = false; 
    orig_pdf = null;
    pdf = null;

    constructor(pdfURL) {        
        if (pdfURL) this.loadPDF(pdfURL);
    }

    async loadPDF(pdfURL) {
        // is there a cheaper way of doing this like a deepcopy?
        this.pdf = await PDFDocument.load(pdfURL);
        //this.orig_pdf = await PDFDocument.load(pdfURL);
        console.log(`loadPDF: finished loading ${pdfURL}`);
        this.loaded = true;
    }

    async isSpreadPrinted() {
        const pages = this.pdf.getPages();
        console.log("spread detection starts here");
    
        // Ensure there are enough pages to compare
        if (pages.length < 2) return false;
      
        const firstPage = pages[0];
        const lastPage = pages[pages.length - 1];
        
        const backInsideCoverIndex = pages.length - 2;
        const firstPageWidth = firstPage.getSize().width;
        const lastPageWidth = lastPage.getSize().width;
        let interiorPageWidth = pages[1].getSize().width; 
        const backInsideCoverWidth = pages[backInsideCoverIndex].getSize().width;
         
        // Early exit for very short documents
        if (pages.length < 4) {
          // If it's less than 4 pages, check if the first/last pages are narrower (assuming they could be half-width covers)
          console.log("less than 4 pages");
          console.log(`spread return ${firstPageWidth < interiorPageWidth || lastPageWidth < backInsideCoverWidth}`);
          return firstPageWidth < interiorPageWidth || lastPageWidth < backInsideCoverWidth;
        }
        const arePagesWider = (firstPageWidth < interiorPageWidth || lastPageWidth < interiorPageWidth);
          if (arePagesWider) {
          console.log(`interior page was wider ${interiorPageWidth} than first/last page ${firstPageWidth}/${lastPageWidth}`);
          // Further validation to ensure consistency among interior pages
          for (let i = 2; i < pages.length - 2; i++) {
              if (pages[i].getSize().width !== interiorPageWidth) {
                console.log(`pages[${i}].width ${pages[i].getSize().width} !== interiorPageWidth: ${pages[i].getSize().width !== interiorPageWidth}`);
                console.log("spread return false");  
              return false; // Found an inconsistency, not a spread
            }
          }
          console.log(``)
          console.log("spread return true");
          return true; // All checks passed, likely a spread
        }
        console.log("spread return false");  
        return false; // Default case, doesn't match the spread criteria
    }

    async detachSpreads() {
        // Create a new PDF document
        const newPdfDoc = await PDFDocument.create();

        // For non-spread pages, just copy the page as is
        const [copiedFirstPage] = await newPdfDoc.copyPages(this.pdf, [0]);
        newPdfDoc.addPage(copiedFirstPage);

        for (let pageIndex = 1; pageIndex < this.pdf.getPageCount() - 1; pageIndex++) {
            const page = this.pdf.getPage(pageIndex);
            const {width, height} = page.getSize();
            const middle = width / 2;

            // Copy the left half of the spread
            const leftPage = await newPdfDoc.addPage([middle, height]);
            const copiedPageLeft = await newPdfDoc.embedPage(page, {
                left: 0,
                bottom: 0,
                right: middle,
                top: height,
            });
            leftPage.drawPage(copiedPageLeft);

            // Copy the right half of the spread
            const rightPage = await newPdfDoc.addPage([middle, height]);
            const copiedPageRight = await newPdfDoc.embedPage(page, {
                left: middle,
                bottom: 0,
                right: width,
                top: height,
            });
            rightPage.drawPage(copiedPageRight);
        }
        
        // For non-spread pages, just copy the page as is
        console.log(`last page: ${this.pdf.getPageCount()-1}`);
        const [copiedLastPage] = await newPdfDoc.copyPages(this.pdf, [this.pdf.getPageCount()-1]);
        newPdfDoc.addPage(copiedLastPage);
        this.pdf = newPdfDoc;
        return newPdfDoc;
    }

    
    async renderPage(pageNumber, canvas) {
        const page = await this.pdf[pageNumber];
        const viewport = page.getViewport({ scale: 1.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: canvas.getContext('2d'),
            viewport
        };
        await page.render(renderContext).promise;
    }

    length() {
        return this.pdf.getPages().length;
    }
    
    async addPadding(pages=1) {
        let pdf = this.pdf;
        // Create a new PDF document
        const newPdfDoc = await PDFDocument.create();
        
        // Determine the number of pages in the original document
        const numberOfPages = pdf.getPageCount();
        
        // Copy all pages from the original document to the new one, except for the last page
        for (let i = 0; i < numberOfPages - 1; i++) {
            const [copiedPage] = await newPdfDoc.copyPages(pdf, [i]);
            newPdfDoc.addPage(copiedPage);
        }
        
        while (pages > 0) {
            // Add the blank page to the new document before the last page of the original document
            newPage(newPdfDoc);
            pages--;
        }
        // Now, copy the last page of the original document to the new document
        const [lastPage] = await newPdfDoc.copyPages(pdf, [numberOfPages - 1]);
        newPdfDoc.addPage(lastPage);
        this.pdf = newPdfDoc;
    }


    async foldPDF(start=0, end=0) {
        const len = this.length();
        console.log(`len: ${len}`);

        // unless specified, autodetect the end
        if (end === 0 && len > 2) {
            // -1 because zero-indexed
            end = len - 1;
        }

        // sanity check
        if (start > end) {
            console.error("Overran the page numbers, something went wrong!");
            return;
        }
        
        // pdf length must be multiples of 4
        if (len % 4 !== 0) {
            console.error(`pdf is incorrect number of pages (${len} pages).  This will fail as it must be a multiple of 4.`);
            return;
        }
        
        const newPdf = await PDFDocument.create();
        for (start; start<end; start+=2) {
            const [secondPage] = await newPdf.copyPages(this.pdf, [start]); // Copy first page of the first PDF
            const [firstPage] = await newPdf.copyPages(this.pdf, [end]); // copy the last page of the first pdf
            const [thirdPage] = await newPdf.copyPages(this.pdf, [start+1]);
            const [fourthPage] = await newPdf.copyPages(this.pdf, [end-1]);

            newPdf.addPage(firstPage);
            newPdf.addPage(secondPage); 
            newPdf.addPage(thirdPage); 
            newPdf.addPage(fourthPage);
            
            end -= 2;
        }
        this.pdf = newPdf;
    }
    
    async createBooklet() {
        // load pdf -> split spreads -> pad pages -> reorder for stuff
        if (await this.isSpreadPrinted()) {
            console.log("spread pages detected in pdf, splitting!");
            await this.detachSpreads();
        }
        // Calculate how many blank pages are needed to make the page count a multiple of 4
        let pagesToAdd = (4 - (this.length() % 4)) % 4; // This ensures that we add pages only if needed
        console.log(`pages to add: ${pagesToAdd}`);
        if (pagesToAdd)	await this.addPadding(pagesToAdd);
        console.log(`new pdf length: ${this.pdf.getPageCount()}`);

        console.log("folding pdf");
        await this.foldPDF();

        const newPdfDoc = await PDFDocument.create();
        for (let i=0; i<this.pdf.getPages().length; i+=2) {
            const [firstPage] = await newPdfDoc.embedPdf(this.pdf, [i]);
            const [secondPage] = await newPdfDoc.embedPdf(this.pdf, [i+1]);
            await makePageSpread(newPdfDoc, firstPage, secondPage);
        }
        // Serialize the PDFDocument to bytes
        const pdfBytes = await newPdfDoc.save();
        // Here, you can save the pdfBytes to a file, or return it from a server endpoint, etc.
        return pdfBytes;
    }
}
