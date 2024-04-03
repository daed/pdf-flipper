import React from 'react';
import Main from './Main';
import { AppProvider } from '../context/AppContext';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    action: {
      disabledBackground: '#888888', // Use disabledBackground for the background color
      disabled: '#888888', // Use disabled for the text color if needed
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          // Base state with transparent background
          backgroundColor: 'transparent',
          color: '#90EE90', // Light Green for text
          border: '0px solid #90EE90', // Removed border to match your specification
          '&:hover': {
            backgroundColor: 'rgba(144, 238, 144, 0.08)', // Light Green with transparency on hover
          },
          '&:active': {
            backgroundColor: 'rgba(144, 238, 144, 0.2)', // Slightly more opaque on active
          }
        }
      }
    }
  }
});


export default class App extends React.Component {
    render() {
        return (
            <ThemeProvider theme={theme}>
              <AppProvider>
                <div class="container">
                    <Main />
                </div>
              </AppProvider>
            </ThemeProvider>
        );
    }
}
