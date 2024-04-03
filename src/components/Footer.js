import React from "react";
import { Box } from "@mui/material";
import Donation from "./Donation";
import packageJson from '../../package.json'; // Adjust the relative path as necessary

const Footer = () => {
    const version = packageJson.version;
    
    return (
        <Box display="flex" justifyContent="space-between" position="relative" paddingTop="48px" bottom={0}>
            <Box textAlign="left" maxWidth="35%" paddingLeft="6px" marginRight="6px" position="relative" bottom={0}>
                <p textAlign="right">
                    Cookies for eating, not tracking.
                </p>
                <p textAlign="right">
                    You bind your business and we'll bind ours.
                </p>
            </Box>
            <Box textAlign="left" maxWidth="35%" paddingLeft="6px" marginRight="6px" position="relative" bottom={0}>
                <div display="flex" height={"100%"} flexDirection={"column-reverse"} padding={"0 0 0px 0"}>
                    <Donation></Donation>
                </div>
            </Box>
            <Box textAlign="left" maxWidth="35%" paddingLeft="6px" marginRight="6px" position="relative" bottom={0}>
                <div textAlign="right">
                    <p textAlign="right"> 
                        imposify v{version}
                    </p>
                </div>
                <div>
                    <p textAlign="right">
                        <a href="https://github.com/daed/imposify">github page!</a>
                    </p>
                </div>
            </Box>
        </Box>
    );
};

export default Footer;