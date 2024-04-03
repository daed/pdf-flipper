import { PDFDocument } from 'pdf-lib';
import { loadPDF, foldPDF, renderPage, compositeTwoPages, createBookletPDF } from '../lib/imposify.mjs';

import React, { useEffect,  useRef, useState } from "react";
import Directions from "./Directions";
import Footer from "./Footer";
import { Box, Button, Typography } from "@mui/material";
import Impose from "../lib/imposify.mjs";
import { Document, Page, pdfjs } from "react-pdf";

const Visual = () => {
    // Boolean to determine if we are loaded
    const [loaded, setLoaded] = useState(false);
    // holds the pdf binary blob used in the preview
    const [foldedPDF1, setFoldedPDF1] = useState(null);
    const [foldedPDF2, setFoldedPDF2] = useState(null);
    const [foldedPDF3, setFoldedPDF3] = useState(null);
    const [foldedPDF4, setFoldedPDF4] = useState(null);

    // number of pages in the folded pdf
    const [numPagesFolded, setNumPagesFolded] = useState(null);
    // current page of the pdf preview
    const [pageNumberFolded, setPageNumberFolded] = useState(1);
    // auto-calculated width of the pdf preview (in pixels)
    const [previewWidth, setPreviewWidth] = useState();
    // our pdf manipulation class itself
    const [impose] = useState(() => new Impose());

    // move preview to the previous set of pages
    const decrementFolded = () => {
        if(pageNumberFolded - 1 >= 1) // Updated to prevent going below 1
            setPageNumberFolded(pageNumberFolded - 1);
    };

    // move preview to the next set of pages
    const incrementFolded = () => {
        if(pageNumberFolded + 1 <= numPagesFolded)
            setPageNumberFolded(pageNumberFolded + 1);
    };

    // pdf file passed to imposify via drag and drop or by open
    // menu.  currently this function loads a pdf, imposes it
    // via a simple two-page spread method, converts it back to
    // a pdf blob, and prepares it for rendering.
    const processFile = async (file, setter) => {
        handleResize();
        setPageNumberFolded(1);
        let completedPDF = false;
        try {
            console.log("loading");
            // load pdf here
            await impose.loadPDF(await file.arrayBuffer());
            console.log("imposing");
            // createBooklet() does a lot all at once.
            const completedPdf = await impose.createBooklet();
            console.log("converting to binary blob");
            // generate blob from pdf
            if (completedPdf) {
                const blob = new Blob([completedPdf], { type: "application/pdf" });
                console.log("setting state for preview rendering")
                setter(blob);
                setLoaded(true);
            }
            else {
                throw new Error(`completedPDF was ${completedPDF}`);
            }
        } catch (error) {
            console.error("Error processing file:", error);
        }

    };

    // we have to calculate the size of the preview canvas outside of css
    const handleResize = () => {
        if (window.innerWidth > 599) {
            setPreviewWidth(window.innerWidth * 0.4);
        } else {
            setPreviewWidth(window.innerWidth * 0.8);
        }
    };

    // Set the path to the PDF.js worker from a CDN
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

    // event listeners //

    const onPDFFoldSuccess = ({ numPages }) => {
        // runs after the pdf is folded and the preview is rendering
        console.log("onPDFFoldSuccess: pdf should have loaded correctly");
        setLoaded(true);
        setNumPagesFolded(numPages);
    };

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // PDF loader  //
    useEffect(() => {
        // many (mod4) pages, "page print",
        // many (not mod4) pages, "page print",
        // many (mod4) pages, "spread print",
        // many (not mod4) pages, "spread print",
        
        const getFileAndProcess = async (url, setter) => {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Network response was not ok, status: ${response.status}`);
            }
            const fileBlob = await response.blob();
            await processFile(fileBlob, setFoldedPDF1);
        };

        const urlList = [
            "url1",
            "url2",
            "url3",
            "url4"
        ];

        const setterList = [
            setFoldedPDF1,
            setFoldedPDF2,
            setFoldedPDF3,
            setFoldedPDF4
        ]

        for (let i=0; i<urlList.length; i++) {
            getFileAndProcess(urlList[i], setterList[i]);
        }


    }, []);

    return (
    <Box display="flex" className="column">
        <Box 
        display="flex" 
        margin="auto"
        maxWidth={1200}
        justifyContent="space-between"
        flexDirection="row"
        class="column-fold"
        >
            <Box minWidth="50%" maxWidth="50%" textAlign="left" id="visual1" marginBottom="20px">
                <h3>Preview 1</h3>
                <Box maxWidth="100%" height="100%" margin="auto" id="document-box" className="doc-box" display="flex" flexDirection="column" justifyContent="space-between">
                    <Box width={previewWidth} margin="auto" minHeight="80%">
                        <Document width={previewWidth} file={foldedPDF1} onLoadSuccess={onPDFFoldSuccess}>
                            <Page
                                pageNumber={pageNumberFolded}
                                renderAnnotationLayer={false}
                                renderTextLayer={false}
                                width={previewWidth}
                                >

                            </Page>
                        </Document>
                    </Box>
                    <Box display="flex" width="100%" justifyContent="center">
                        <Button style={{ width: "50%", fontSize: "40px" }} onClick={decrementFolded}> ⇐ </Button>
                        <Button style={{ width: "50%", fontSize: "40px" }} onClick={incrementFolded}> ⇒ </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
        <Box 
        display="flex" 
        margin="auto"
        maxWidth={1200}
        justifyContent="space-between"
        flexDirection="row"
        class="column-fold"
        >
            <Box minWidth="50%" maxWidth="50%" textAlign="left" id="visual2" marginBottom="20px">
                    <h3>Preview 2</h3>
                    <Box maxWidth="100%" height="100%" margin="auto" id="document-box" className="doc-box" display="flex" flexDirection="column" justifyContent="space-between">
                        <Box width={previewWidth} margin="auto" minHeight="80%">
                            <Document width={previewWidth} file={foldedPDF2} onLoadSuccess={onPDFFoldSuccess}>
                                <Page
                                    pageNumber={pageNumberFolded}
                                    renderAnnotationLayer={false}
                                    renderTextLayer={false}
                                    width={previewWidth}
                                    >

                                </Page>
                            </Document>
                        </Box>
                        <Box display="flex" width="100%" justifyContent="center">
                            <Button style={{ width: "50%", fontSize: "40px" }} onClick={decrementFolded}> ⇐ </Button>
                            <Button style={{ width: "50%", fontSize: "40px" }} onClick={incrementFolded}> ⇒ </Button>
                        </Box>
                    </Box>
            </Box>
        </Box>
        <Box 
        display="flex" 
        margin="auto"
        maxWidth={1200}
        justifyContent="space-between"
        flexDirection="row"
        class="column-fold"
        >
            <Box minWidth="50%" maxWidth="50%" textAlign="left" id="visual3" marginBottom="20px">
                <h3>Preview 3</h3>
                <Box maxWidth="100%" height="100%" margin="auto" id="document-box" className="doc-box" display="flex" flexDirection="column" justifyContent="space-between">
                    <Box width={previewWidth} margin="auto" minHeight="80%">
                        <Document width={previewWidth} file={foldedPDF3} onLoadSuccess={onPDFFoldSuccess}>
                            <Page
                                pageNumber={pageNumberFolded}
                                renderAnnotationLayer={false}
                                renderTextLayer={false}
                                width={previewWidth}
                                >

                            </Page>
                        </Document>
                    </Box>
                    <Box display="flex" width="100%" justifyContent="center">
                        <Button style={{ width: "50%", fontSize: "40px" }} onClick={decrementFolded}> ⇐ </Button>
                        <Button style={{ width: "50%", fontSize: "40px" }} onClick={incrementFolded}> ⇒ </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
        <Box 
        display="flex" 
        margin="auto"
        maxWidth={1200}
        justifyContent="space-between"
        flexDirection="row"
        class="column-fold"
        >
            <Box minWidth="50%" maxWidth="50%" textAlign="left" id="visual4" marginBottom="20px">
                <h3>Preview 4</h3>
                <Box maxWidth="100%" height="100%" margin="auto" id="document-box" className="doc-box" display="flex" flexDirection="column" justifyContent="space-between">
                    <Box width={previewWidth} margin="auto" minHeight="80%">
                        <Document width={previewWidth} file={foldedPDF4} onLoadSuccess={onPDFFoldSuccess}>
                            <Page
                                pageNumber={pageNumberFolded}
                                renderAnnotationLayer={false}
                                renderTextLayer={false}
                                width={previewWidth}
                                >

                            </Page>
                        </Document>
                    </Box>
                    <Box display="flex" width="100%" justifyContent="center">
                        <Button style={{ width: "50%", fontSize: "40px" }} onClick={decrementFolded}> ⇐ </Button>
                        <Button style={{ width: "50%", fontSize: "40px" }} onClick={incrementFolded}> ⇒ </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    </Box>
    );
}

export default Visual;