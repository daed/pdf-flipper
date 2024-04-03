<Box minWidth="50%" maxWidth="50%" textAlign="left" id="testFolded" marginBottom="20px">
                        <h3>Preview</h3>
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