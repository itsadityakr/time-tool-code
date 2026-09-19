import React from "react";
import { Search, Moon, Sun, Plus, Trash2 } from "lucide-react";
import { THEME } from "../constants";

const Header = ({
    searchQuery,
    setSearchQuery,
    isDarkMode,
    setIsDarkMode,
    setCurrentEntry,
    setModalMode,
    setIsModalOpen,
    hasData,
    onClearAll,
}) => {
    return (
        <header
            className={`h-20 px-8 flex items-center justify-between backdrop-blur-md border-b ${
                isDarkMode
                    ? "border-white/5 bg-black/10"
                    : "border-orange-900/5 bg-white/30"
            }`}>
            {/* Search Bar */}
            <div
                className={`flex items-center gap-4 border rounded-full px-4 py-2 w-96 transition-all duration-300 ${
                    isDarkMode
                        ? "bg-white/5 border-white/10 focus-within:bg-white/10 focus-within:border-white/20"
                        : "bg-white/40 border-orange-900/5 focus-within:bg-white/60 focus-within:border-orange-900/10 shadow-sm"
                }`}>
                <Search
                    className={`w-4 h-4 ${
                        isDarkMode ? "text-white/40" : "text-gray-400"
                    }`}
                />
                <input
                    type="text"
                    placeholder="Search logs, tickets, projects..."
                    className={`bg-transparent border-none outline-none text-sm w-full ${
                        isDarkMode
                            ? "placeholder:text-white/30"
                            : "placeholder:text-gray-400 text-gray-800"
                    }`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`p-2.5 rounded-full border transition-colors ${
                        isDarkMode
                            ? "bg-white/5 border-white/10 hover:bg-white/10"
                            : "bg-white border-gray-200 hover:bg-gray-50 text-gray-600 shadow-sm"
                    }`}>
                    {isDarkMode ? (
                        <Sun className="w-4 h-4" />
                    ) : (
                        <Moon className="w-4 h-4" />
                    )}
                </button>

                {/* Clear All Button (only when data exists) */}
                {hasData && (
                    <button
                        onClick={onClearAll}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all ${
                            isDarkMode
                                ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                                : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                        }`}>
                        <Trash2 className="w-4 h-4" />
                        Clear All
                    </button>
                )}

                {/* New Entry Button */}
                <button
                    onClick={() => {
                        setCurrentEntry(null);
                        setModalMode("add");
                        setIsModalOpen(true);
                    }}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm text-white shadow-lg shadow-orange-500/20 bg-gradient-to-r ${THEME.gradient} hover:scale-105 active:scale-95 transition-all duration-300`}>
                    <Plus className="w-4 h-4" /> New Entry
                </button>
            </div>
        </header>
    );
};

export default Header;
