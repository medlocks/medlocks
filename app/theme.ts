const theme = {
  colors: {
    primary: "#ff9db2",
    primaryLight: "#ffd6df",
    accent: "#ffb6c5",
    accentLight: "#ffe6ea",
    background: "#ffffff",
    surface: "#fafafa",
    text: "#222222",
    textLight: "#666666",
    textMuted: "#999999", // ✅ added
    border: "#eeeeee",
    error: "#ff4d4d",
  },

  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 30,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 20,
    xl: 28,
  },

  radius: {
    sm: 6,
    md: 10,
    lg: 16,
    xl: 24,
  },

  shadow: {
    card: {
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
    button: {
      shadowColor: "#ff9db2",
      shadowOpacity: 0.25,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
      elevation: 5,
    },
  },
};

export default theme;
