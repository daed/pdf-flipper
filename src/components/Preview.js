import React, { useEffect, useState } from "react";
import { Box, Button } from "@mui/material";
import Spinner from "./Spinner";
import { useAppContext } from '../context/AppContext';
import { Document, Page, pdfjs } from "react-pdf";

const Preview = () => {
    const { sharedState, setSharedState } = useAppContext();

    // runs after the pdf is folded and the preview is rendering
    const onPDFFoldSuccess = ({ numPages }) => {
        console.log("onPDFFoldSuccess: pdf should have loaded correctly");
        setSharedState({ ...sharedState,
            numPagesFolded: numPages,
            loaded: true
        });
        console.log(sharedState);
    };

    // move preview to the previous set of pages
    const decrementFolded = () => {
        const newval = sharedState.pageNumberFolded - 1;
        if(newval >= 1) // Updated to prevent going below 1
            setSharedState({ ...sharedState, pageNumberFolded: newval});
    };

    // move preview to the next set of pages
    const incrementFolded = () => {
        const newval = sharedState.pageNumberFolded + 1;
        if(newval <= sharedState.numPagesFolded)
            setSharedState({ ...sharedState, pageNumberFolded: newval});
    };

    useEffect(() => {
        if (sharedState.loaded) {
            console.log("Preview:  loaded triggers");
            console.log(sharedState);
        }
    }, [sharedState]);

    return (
        <div>
            <h3>Preview</h3>
            <Box height id="spinner-box" className="hidden" >
                <Box display="flex" minHeight="80%" alignItems="baseline" justifyContent="center">
                    <Box margin="20%">
                        <Spinner />
                    </Box>
                </Box>
            </Box>
            <Box maxWidth="100%" height="100%" margin="auto" id="document-box" className="doc-box" display="flex" flexDirection="column" justifyContent="space-between">
                <Box width={sharedState.previewWidth} margin="auto" minHeight="80%">
                        <Document width={sharedState.previewWidth} file={sharedState.foldedPDF} onLoadSuccess={onPDFFoldSuccess}>
                            <Page
                                pageNumber={sharedState.pageNumberFolded}
                                renderAnnotationLayer={false}
                                renderTextLayer={false}
                                width={sharedState.previewWidth}
                            >
                            </Page>
                        </Document>
                </Box>
                <Box display="flex" width="100%" justifyContent="center">
                    <Button style={{ width: "50%", fontSize: "40px" }} onClick={decrementFolded}> ⇐ </Button>
                    <Button style={{ width: "50%", fontSize: "40px" }} onClick={incrementFolded}> ⇒ </Button>
                </Box>
            </Box>
    </div>
    );
}

export default Preview;