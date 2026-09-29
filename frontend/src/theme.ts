import { createTheme } from "@mui/material/styles";

export const muiTheme = createTheme({
  palette: {
    primary: {
      main: "#e60023",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#211922",
    },
    divider: "#dadad3",
    text: {
      primary: "#000000",
      secondary: "#62625b",
    },
    background: {
      default: "#fbfbf9",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily:
      '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: {
      fontWeight: 700,
      textTransform: "none",
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid #dadad3",
          boxShadow: "none",
          backdropFilter: "none",
        },
        rounded: {
          borderRadius: 16,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: "#ffffff",
          boxShadow: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 800,
          boxShadow: "none",
        },
        contained: {
          backgroundColor: "#e60023",
          "&:hover": {
            backgroundColor: "#cc001f",
            boxShadow: "none",
          },
        },
        outlined: {
          backgroundColor: "#f6f6f3",
          borderColor: "transparent",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          borderRadius: 16,
          "& fieldset": {
            borderColor: "#91918c",
          },
          "&:hover fieldset": {
            borderColor: "#000000",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#000000",
            boxShadow: "0 0 0 4px #ffffff, 0 0 0 6px #435ee5",
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          borderRadius: 16,
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          minWidth: 720,
          borderCollapse: "separate",
          borderSpacing: 0,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          ".MuiTableCell-root": {
            backgroundColor: "#ffffff",
            backgroundImage: "none",
            color: "#62625b",
            fontSize: 12,
            fontWeight: 800,
            lineHeight: 1.2,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            letterSpacing: "0.05em",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid #e5e5e0",
          color: "#33332e",
          fontSize: 14,
          padding: "20px 24px",
          verticalAlign: "middle",
        },
        head: {
          borderBottom: "1px solid #dadad3",
          paddingBottom: 16,
          paddingTop: 16,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: "background-color 140ms ease",
          "&.MuiTableRow-hover:hover": {
            backgroundColor: "#fbfbf9",
          },
          "&:last-child .MuiTableCell-root": {
            borderBottom: 0,
          },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          borderTop: "1px solid #dadad3",
          color: "#62625b",
          overflow: "hidden",
        },
        toolbar: {
          minHeight: 52,
          paddingLeft: 16,
          paddingRight: 10,
        },
        selectLabel: {
          fontSize: 12,
          fontWeight: 700,
        },
        displayedRows: {
          fontSize: 12,
          fontWeight: 700,
        },
      },
    },
  },
});
