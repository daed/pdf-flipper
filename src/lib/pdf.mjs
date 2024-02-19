// pdf.js
import { PDFDocument, rgb } from 'pdf-lib';

export async function loadPDF(pdfURL) {
	return await PDFDocument.load(pdfURL);
}

export async function foldPDF(pdf, start=0, end=0) {
	const len = getPDFLength(pdf);
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
		const [secondPage] = await newPdf.copyPages(pdf, [start]); // Copy first page of the first PDF
		const [firstPage] = await newPdf.copyPages(pdf, [end]); // copy the last page of the first pdf
		const [thirdPage] = await newPdf.copyPages(pdf, [start+1]);
		const [fourthPage] = await newPdf.copyPages(pdf, [end-1]);

		newPdf.addPage(firstPage);
		newPdf.addPage(secondPage); 
		newPdf.addPage(thirdPage); 
		newPdf.addPage(fourthPage);
		
		end -= 2;
	}
	return newPdf
}

export async function renderPage(pdf, pageNumber, canvas) {
	const page = await pdf[pageNumber];
	const viewport = page.getViewport({ scale: 1.5 });
	canvas.height = viewport.height;
	canvas.width = viewport.width;

	const renderContext = {
		canvasContext: canvas.getContext('2d'),
		viewport
	};
	await page.render(renderContext).promise;
}

export async function compositeTwoPages(firstPage, secondPage, workingPdf) { 
  const width = firstPage.width;
  const height = firstPage.height;
  console.log(`compositeTwoPages: page width: ${width}, ${height}`);
  // Create a new page with double the width of the original to hold two pages side by side
  const newPage = workingPdf.addPage([width * 2, height]);

  console.log("rendering first page");
  // Draw the first page on the left half
  newPage.drawPage(firstPage, {
    x: 0,
    y: 0,
    width: width,
    height: height,
  });
  
  console.log("rendering second page");
  // Draw the second page on the right half
  newPage.drawPage(secondPage, {
    x: width, // Offset by the width of the first page
    y: 0,
    width: width,
    height: height,
  });
  
}

function getPDFLength(pdfDoc) {
	return pdfDoc.getPages().length;
}

async function newPage(pdfDoc) {
    // Check if the document has at least two pages to get the dimensions from the second page
    if (pdfDoc.getPageCount() < 2) {
        console.error("The document does not have a second page.");
        return;
    }
    
    // Get the second page
    const secondPage = pdfDoc.getPages()[1];
    
    // Extract the width and height from the second page
    const width = secondPage.getWidth();
    const height = secondPage.getHeight();
    
    // Add a new blank page with the same dimensions as the second page
    const blankPage = pdfDoc.addPage([width, height]);
    
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
}

async function addPagesBeforeLast(pdfDoc, pages=1) {
    // Create a new PDF document
    const newPdfDoc = await PDFDocument.create();
    
    // Determine the number of pages in the original document
    const numberOfPages = pdfDoc.getPageCount();
    
    // Copy all pages from the original document to the new one, except for the last page
    for (let i = 0; i < numberOfPages - 1; i++) {
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
        newPdfDoc.addPage(copiedPage);
    }
    
	while (pages > 0) {
		// Add the blank page to the new document before the last page of the original document
		newPage(newPdfDoc);
		pages--;
	}
    // Now, copy the last page of the original document to the new document
    const [lastPage] = await newPdfDoc.copyPages(pdfDoc, [numberOfPages - 1]);
    newPdfDoc.addPage(lastPage);
    
	return newPdfDoc;
}

export async function createBookletPDF(originalPdfBytes) {
	let originalPdfDoc = await PDFDocument.load(originalPdfBytes);
	const len = originalPdfDoc.getPageCount();
	console.log(`initial pdf page count: ${len}`);
	// Calculate how many blank pages are needed to make the page count a multiple of 4
	let pagesToAdd = (4 - (len % 4)) % 4; // This ensures that we add pages only if needed
	console.log(`pages to add: ${pagesToAdd}`);
	if (pagesToAdd)	originalPdfDoc = await addPagesBeforeLast(originalPdfDoc, pagesToAdd);
	console.log(originalPdfDoc);
	console.log(`new pdf length: ${originalPdfDoc.getPageCount()}`);

	console.log("folding pdf");
	const foldedPdf = await foldPDF(originalPdfDoc);
	
	console.log("original pdf");
	console.log(originalPdfDoc);
	console.log("folded pdf");
	console.log(foldedPdf);

	const newPdfDoc = await PDFDocument.create();
	for (let i=0; i<foldedPdf.getPages().length; i+=2) {
		console.log(`getting pages ${i} and ${i+1}`);
		const [firstPage] = await newPdfDoc.embedPdf(foldedPdf, [i]);
		const [secondPage] = await newPdfDoc.embedPdf(foldedPdf, [i+1]);
		console.log("pdf page:");
		console.log(firstPage);
		await compositeTwoPages(firstPage, secondPage, newPdfDoc);
		console.log(`composited ${i} and ${i+1}`);
	}
	// Serialize the PDFDocument to bytes
	const pdfBytes = await newPdfDoc.save();
	// Here, you can save the pdfBytes to a file, or return it from a server endpoint, etc.
	return pdfBytes;
}
