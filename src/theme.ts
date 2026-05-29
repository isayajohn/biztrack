import { createTheme } from "@mui/material/styles";

export const muiTheme = createTheme({
  palette: {
    primary: {
      main: "#1f8a5b",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#c86b3c",
    },
    text: {
      primary: "#17211b",
      secondary: "rgba(23, 33, 27, 0.65)",
    },
    background: {
      default: "#fbfaf6",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily:
      '"Open Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: {
      fontWeight: 700,
      textTransform: "none",
    },
  },
  shape: {
    borderRadius: 12,
  },
});
