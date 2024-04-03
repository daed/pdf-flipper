import React, { useEffect,  useRef, useState } from "react";
import Directions from "./Directions";
import Footer from "./Footer";
import Title from "./Title";
import Preview from "./Preview";
import { Box, Button, Typography } from "@mui/material";
import Impose from "../lib/imposifiy.mjs";
import { Document, Page, pdfjs } from "react-pdf";
import { useAppContext } from '../context/AppContext';

const Main = () => {
    // Create a ref to store the file input element
    const fileInputRef = useRef(null);
    // Boolean to determine if we are dragging a file
    const [isDragging, setIsDragging] = useState(false);
    const { sharedState, setSharedState } = useAppContext();

    // our pdf manipulation class itself
    const [impose] = useState(() => new Impose());

    // Set the path to the PDF.js worker from a CDN
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

    // Turns the spinner on/off via CSS.  doing it this way instead of
    // via react state seems to result in a quicker loading initial
    // image than allowing a rerender would.
    const setSpinner = (val) => {
        const docBox = document.getElementById("document-box");
        const spinBox = document.getElementById("spinner-box")
        if (val) {
            docBox.classList = "hidden";
            spinBox.classList = "";
        }
        else {
            docBox.classList = "doc-box";
            spinBox.classList = "hidden";
        }
    };

    // "download pdf" gets clicked by the user.  adds a anchor
    // to the page and triggers it to start the file download.
    const handleDownloadButtonClick = () => {
        try {
            const url = URL.createObjectURL(sharedState.foldedPDF);
            const link = document.createElement("a");
            link.href = url;
            link.download = "folded-pdf.pdf";
            document.body.appendChild(link);
            link.click();
            // don't leave the link dangling
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error generating download:", error);
        }
    };


    // pdf file passed to imposify via drag and drop or by open
    // menu.  currently this function loads a pdf, imposes it
    // via a simple two-page spread method, converts it back to
    // a pdf blob, and prepares it for rendering.
    const processFile = async (file) => {
        handleResize();
        setSharedState({...sharedState, pageNumberFolded: 1});
        let completedPDF = false;
        try {
            setSpinner(true);
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
                console.log(`blob: ${blob}`);
                console.log("setting state for preview rendering")
                setSharedState({...sharedState, foldedPDF: blob, loaded: true});
                console.log(sharedState);
            }
            else {
                throw new Error(`completedPDF was ${completedPDF}`);
            }
        } catch (error) {
            console.error("Error processing file:", error);
        }
        // We're loaded but we should delay unshowing the Spinner just a while
        setTimeout(() => setSpinner(false), 1250);
    };

    const handleResize = () => {
        setSharedState(currentState => {
            const newPreviewWidth = window.innerWidth > 599 ? window.innerWidth * 0.4 : window.innerWidth * 0.8;
            return {...currentState, previewWidth: newPreviewWidth};
        });
    };

    useEffect(() => {
        setSharedState(currentState => {
            const newPreviewWidth = window.innerWidth > 599 ? window.innerWidth * 0.4 : window.innerWidth * 0.8;
            return {...currentState, previewWidth: newPreviewWidth};
        });
    }, []);
    
    const handleOpenButtonClick = () => {
        // Programmatically click the hidden file input
        fileInputRef.current.click();
    };

    // handle open button
    const handleFileSelected = async (event) => {
        const file = event.target.files[0];
        if (file) {
            processFile(file);
        }
    };
    // handle drag and drop
    const handleDrop = async (event) => {
        event.preventDefault();
        setIsDragging(false); // Reset drag state on drop
        const file = event.dataTransfer.files[0];
        if (file && file.type === "application/pdf") {
            processFile(file);
        }
    };
    // handle dragging activity overlay
    const handleDragEnter = (event) => {
        event.preventDefault();
        setIsDragging(true);
    };
    const handleDragOver = handleDragEnter;
    // turn off dragging overlay afterward
    const handleDragLeave = (event) => {
        event.preventDefault();
        setIsDragging(false); // Reset drag state when leaving the drop area
    };

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <Box id="main"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        style={{ 
            border: isDragging ? '2px dashed #000' : '1px solid #ddd',
            backgroundColor: isDragging ? "rgba(0, 0, 0, 0.5)" : 'unset',
            maxWidth: "1200px",
            margin: "auto",
            padding: '20px',
            textAlign: 'center' }} 
            >
                {isDragging && (
                    <Box
                    position="absolute"
                    top={0}
                    left={0}
                    width="100%"
                    height="100%"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    overflow="hidden"
                    backgroundColor="rgba(0, 0, 0, 0.5)" // Translucent background
                    zIndex={2} // Ensure it's above other content
                    style={{ pointerEvents: "none" }} // Allows clicks to go through if necessary
                    >
                        <Typography overflow="hidden" variant="h4" color="white">
                            Drag and drop PDF files here
                        </Typography>
                    </Box>
                )} 
                <Title></Title>
                <Box display="flex">
                    <Button onClick={handleOpenButtonClick}>Open PDF</Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelected}
                        style={{ display: "none" }} // Hide the file input
                        accept="application/pdf" // Accept only PDF files
                    />
                    <Box id="pdfDisplayBlock">
                        <Button disabled={!sharedState.loaded} onClick={handleDownloadButtonClick}>Download PDF</Button>
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
                    <Directions></Directions>
                    <Box minWidth="50%" maxWidth="50%" textAlign="left" id="testFolded" marginBottom="20px">
                        <Preview></Preview>
                    </Box>
                </Box>
                <Footer></Footer>
            </Box>
    );
};

export default Main;
