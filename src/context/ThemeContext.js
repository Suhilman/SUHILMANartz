import React, { createContext, useState, useContext } from 'react';

// Membuat context
const ThemeContext = createContext();

// Provider untuk membungkus komponen dan menyediakan state tema
export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleTheme = () => {
        setIsDarkMode(prevMode => !prevMode);
        document.body.setAttribute('data-theme', isDarkMode ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Custom hook untuk menggunakan context tema
export const useTheme = () => useContext(ThemeContext);
