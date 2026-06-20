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
  components: {
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
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
            backgroundColor: "#fbfaf6",
            color: "rgba(23, 33, 27, 0.52)",
            fontSize: 11,
            fontWeight: 800,
            lineHeight: 1.2,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid rgba(23, 33, 27, 0.08)",
          color: "#17211b",
          fontSize: 13,
          padding: "12px 14px",
          verticalAlign: "middle",
        },
        head: {
          paddingBottom: 10,
          paddingTop: 10,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: "background-color 140ms ease",
          "&.MuiTableRow-hover:hover": {
            backgroundColor: "rgba(31, 138, 91, 0.045)",
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
          borderTop: "1px solid rgba(23, 33, 27, 0.08)",
          color: "rgba(23, 33, 27, 0.62)",
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
