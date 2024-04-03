import React, { useEffect,  useRef, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useAppContext } from '../context/AppContext';


const Controls = () => {
    // Create a ref to store the file input element
    const fileInputRef = useRef(null);
    const { sharedState, setSharedState } = useAppContext();

    const handleOpenButtonClick = () => {
        // Programmatically click the hidden file input
        fileInputRef.current.click();
    };

    // handle open button
    const handleFileSelected = async (event) => {
        const file = event.target.files[0];
        if (file) {
            setSharedState({...sharedState, origPDF: file});
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

    return (
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
    );
};

export default Controls;