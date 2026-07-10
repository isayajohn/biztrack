import { createTheme } from "@mui/material/styles";

export const muiTheme = createTheme({
  palette: {
    primary: {
      main: "#18bd97",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#0b9279",
    },
    text: {
      primary: "#10231e",
      secondary: "rgba(16, 35, 30, 0.65)",
    },
    background: {
      default: "#f7faf9",
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
            backgroundColor: "#f7faf9",
            color: "rgba(16, 35, 30, 0.52)",
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
          borderBottom: "1px solid rgba(16, 35, 30, 0.08)",
          color: "#10231e",
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
            backgroundColor: "rgba(18, 184, 144, 0.06)",
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
          borderTop: "1px solid rgba(16, 35, 30, 0.08)",
          color: "rgba(16, 35, 30, 0.62)",
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
