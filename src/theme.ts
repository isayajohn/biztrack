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
    divider: "rgba(16, 35, 30, 0.09)",
    text: {
      primary: "#10231e",
      secondary: "rgba(16, 35, 30, 0.65)",
    },
    background: {
      default: "#eef5f2",
      paper: "rgba(255, 255, 255, 0.78)",
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
    borderRadius: 10,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "linear-gradient(145deg, rgba(255,255,255,0.9), rgba(255,255,255,0.66))",
          border: "1px solid rgba(16, 35, 30, 0.09)",
          boxShadow: "0 18px 54px rgba(13, 60, 52, 0.1)",
          backdropFilter: "blur(16px) saturate(145%)",
        },
        rounded: {
          borderRadius: 10,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: "rgba(255,255,255,0.76)",
          boxShadow: "0 16px 48px rgba(13, 60, 52, 0.09)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 800,
          boxShadow: "none",
        },
        contained: {
          backgroundColor: "#12977c",
          "&:hover": {
            backgroundColor: "#0b7567",
            boxShadow: "0 14px 32px rgba(11, 146, 121, 0.2)",
          },
        },
        outlined: {
          backgroundColor: "rgba(255,255,255,0.58)",
          borderColor: "rgba(16, 35, 30, 0.14)",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255,255,255,0.66)",
          borderRadius: 10,
          "& fieldset": {
            borderColor: "rgba(16, 35, 30, 0.12)",
          },
          "&:hover fieldset": {
            borderColor: "rgba(24, 189, 151, 0.45)",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#18bd97",
            boxShadow: "0 0 0 3px rgba(24, 189, 151, 0.12)",
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255, 255, 255, 0.76)",
          borderRadius: 10,
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
            backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.72), rgba(231,250,245,0.58))",
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
