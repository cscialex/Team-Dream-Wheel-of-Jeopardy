import { createTheme } from "@mui/material/styles";


const theme = createTheme({
    palette: {
        mode: "dark",
        background: {
            default: "#030518", // var --color-navy-900
            paper: "#0a1240" // var --color-navy-700
        },
        primary: {
            main: "#ffd447", // color gold
            light: "#FFD962",
            dark: "#DEB83D",
            contrastText: "#030518" // contrast against the gold
        },
        secondary: {
            main: "#2f6fed"
        },
        text: {
            primary: "#fff",
            secondary: "#c9d4ff"
        },
        error: {
            main: "#e8433f"
        }
    },
    typography: {
        fontFamily: "var(--font-body)"
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    fontFamily: "var(--font-jeopardy)",
                    fontWeight: 600,
                }
            }
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    "& fieldset": {
                        borderColor: "#2a3a8f"
                    },
                    "&:hover fieldset": {
                        borderColor: "#ffd447"
                    }
                }
            }
        }
    }
})

export default theme;