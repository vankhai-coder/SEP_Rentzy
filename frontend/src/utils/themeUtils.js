/**
 * Utility functions for theme-based styling in owner dashboard
 * @param {string} theme - 'dark' or 'light'
 * @returns {object} Theme utility functions
 */
export const createThemeUtils = (theme) => {
  const isDark = (theme || "light") === "dark";
  
  return {
    // Background colors
    bg: (light, dark) => isDark ? dark : light,
    
    // Text colors
    text: (light, dark) => isDark ? dark : light,
    
    // Border colors
    border: (light, dark) => isDark ? dark : light,
    
    // Common background classes
    bgMain: isDark ? "bg-secondary-950" : "bg-secondary-100",
    bgCard: isDark ? "bg-secondary-800" : "bg-white",
    bgHover: isDark ? "hover:bg-secondary-700" : "hover:bg-gray-50",
    
    // Common text classes
    textPrimary: isDark ? "text-white" : "text-black",
    textSecondary: isDark ? "text-gray-400" : "text-gray-700",
    textMuted: isDark ? "text-gray-500" : "text-gray-600",
    
    // Common border classes
    borderColor: isDark ? "border-secondary-700" : "border-gray-200",
    
    // Helper to combine classes
    cn: (...classes) => classes.filter(Boolean).join(" "),
  };
};

