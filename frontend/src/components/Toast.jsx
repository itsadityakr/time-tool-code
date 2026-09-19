import React, { useState, useEffect } from "react";
import { X, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

const Toast = ({
    message,
    details,
    type = "error",
    isVisible,
    onClose,
    isDarkMode,
    duration = 5000,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (isVisible && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    const bgColors = {
        error: isDarkMode ? "bg-red-500/20" : "bg-red-50",
        success: isDarkMode ? "bg-green-500/20" : "bg-green-50",
        warning: isDarkMode ? "bg-yellow-500/20" : "bg-yellow-50",
    };

    const borderColors = {
        error: isDarkMode ? "border-red-500/50" : "border-red-200",
        success: isDarkMode ? "border-green-500/50" : "border-green-200",
        warning: isDarkMode ? "border-yellow-500/50" : "border-yellow-200",
    };

    const iconColors = {
        error: "text-red-500",
        success: "text-green-500",
        warning: "text-yellow-500",
    };

    const textColors = {
        error: isDarkMode ? "text-red-300" : "text-red-800",
        success: isDarkMode ? "text-green-300" : "text-green-800",
        warning: isDarkMode ? "text-yellow-300" : "text-yellow-800",
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] animate-slide-in-up max-w-md">
            <div
                className={`rounded-xl border shadow-2xl backdrop-blur-xl ${bgColors[type]} ${borderColors[type]} overflow-hidden transition-all duration-300`}>
                {/* Main toast content */}
                <div className="p-4 flex items-start gap-3">
                    <AlertCircle
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColors[type]}`}
                    />

                    <div className="flex-1 min-w-0">
                        <p className={`font-medium ${textColors[type]}`}>
                            {message}
                        </p>

                        {details && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className={`flex items-center gap-1 mt-1 text-sm ${
                                    isDarkMode
                                        ? "text-white/50 hover:text-white/70"
                                        : "text-gray-500 hover:text-gray-700"
                                } transition-colors`}>
                                {isExpanded ? (
                                    <>
                                        <ChevronUp className="w-4 h-4" />
                                        Hide details
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-4 h-4" />
                                        Show details
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className={`p-1 rounded-lg transition-colors flex-shrink-0 ${
                            isDarkMode
                                ? "hover:bg-white/10 text-white/50"
                                : "hover:bg-black/5 text-gray-400"
                        }`}>
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Expandable details section */}
                {details && isExpanded && (
                    <div
                        className={`px-4 pb-4 pt-0 border-t ${
                            isDarkMode ? "border-white/10" : "border-gray-200"
                        }`}>
                        <pre
                            className={`mt-3 p-3 rounded-lg text-xs font-mono overflow-x-auto ${
                                isDarkMode
                                    ? "bg-black/30 text-white/70"
                                    : "bg-white text-gray-600"
                            }`}>
                            {details}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Toast;
