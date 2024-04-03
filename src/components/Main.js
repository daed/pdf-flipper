import React, { useEffect,  useRef, useState } from "react";
import Directions from "./Directions";
import Spinner from "./Spinner";
import Footer from "./Footer";
import Visual from "./VisualInspection";
import { Box, Button, Typography } from "@mui/material";
import Impose from "../lib/imposify.mjs";
import { Document, Page, pdfjs } from "react-pdf";

const isDev = process.env.NODE_ENV === 'development';


const Main = () => {
    // Create a ref to store the file input element
    const fileInputRef = useRef(null);
    // Boolean to determine if we are loaded
    const [loaded, setLoaded] = useState(false);
    // Boolean to determine if we are dragging a file
    const [isDragging, setIsDragging] = useState(false);
    // holds the pdf binary blob used in the preview
    const [foldedPDF, setFoldedPDF] = useState(null);
    // number of pages in the folded pdf
    const [numPagesFolded, setNumPagesFolded] = useState(null);
    // current page of the pdf preview
    const [pageNumberFolded, setPageNumberFolded] = useState(1);
    // auto-calculated width of the pdf preview (in pixels)
    const [previewWidth, setPreviewWidth] = useState();
    // our pdf manipulation class itself
    const [impose] = useState(() => new Impose());

    const [visualTest, setVisualTest] = useState(false);

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

    // runs after the pdf is folded and the preview is rendering
    const onPDFFoldSuccess = ({ numPages }) => {
        console.log("onPDFFoldSuccess: pdf should have loaded correctly");
        setLoaded(true);
        setNumPagesFolded(numPages);
    };

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

    // "download pdf" gets clicked by the user.  adds a anchor
    // to the page and triggers it to start the file download.
    const handleDownloadButtonClick = () => {
        try {
            const url = URL.createObjectURL(foldedPDF);
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
        setPageNumberFolded(1);
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
                console.log("setting state for preview rendering")
                setFoldedPDF(blob);
                setLoaded(true);
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

    const doVisualTest = () => {
        setVisualTest(true);
    }

    // we have to calculate the size of the preview canvas outside of css
    const handleResize = () => {
        if (window.innerWidth > 599) {
            setPreviewWidth(window.innerWidth * 0.4);
        } else {
            setPreviewWidth(window.innerWidth * 0.8);
        }
    };

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
            height: visualTest ? "auto" : 'unset',
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

                    <Box>
                    <h1>Imposify</h1>
                    <h2>the free book imposition tool</h2>
                </Box>
                {!visualTest && (
                <box>
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
                            <Button disabled={!loaded} onClick={handleDownloadButtonClick}>Download PDF</Button>
                        </Box>
                        {isDev && (
                            <Box>
                                <Button onClick={doVisualTest}>Visual Test Mode</Button>
                            </Box>
                        )}
                    </Box>
                    <Box 
                    display="flex" 
                    margin="auto"
                    maxWidth={1200}
                    justifyContent="space-between"
                    flexDirection="row"
                    class="column-fold"
                    >
                        <Box>
                        <Directions></Directions>
                        </Box>
                        <Box minWidth="50%" maxWidth="50%" textAlign="left" id="testFolded" marginBottom="20px">
                            <h3>Preview</h3>
                            <Box height id="spinner-box" className="hidden" >
                                <Box display="flex" minHeight="80%" alignItems="baseline" justifyContent="center">
                                    <Box margin="20%">
                                        <Spinner />
                                    </Box>
                                </Box>
                            </Box>
                            <Box maxWidth="100%" height="100%" margin="auto" id="document-box" className="doc-box" display="flex" flexDirection="column" justifyContent="space-between">
                                <Box width={previewWidth} margin="auto" minHeight="80%">
                                        <Document width={previewWidth} file={foldedPDF} onLoadSuccess={onPDFFoldSuccess}>
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
                </box>
                // end of visual test
                )}
                {visualTest && (
                    <Visual></Visual>
                )}
                <Footer></Footer>
            </Box>
    );
};

export default Main;
