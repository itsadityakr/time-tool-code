import React, { useState } from "react";
import { X, FileText, FileSpreadsheet, FileDown, Download } from "lucide-react";

const ExportModal = ({ isOpen, onClose, onExport, isDarkMode, isMerged }) => {
    const [exportType, setExportType] = useState("xlsx");
    const [filename, setFilename] = useState(
        isMerged ? "WorkLogs_Merged" : "WorkLogs",
    );

    if (!isOpen) return null;

    const exportOptions = [
        {
            id: "csv",
            label: "CSV",
            description:
                "Comma-separated values, works with any spreadsheet app",
            icon: FileText,
        },
        {
            id: "xlsx",
            label: "Excel",
            description: "Microsoft Excel format with formatting",
            icon: FileSpreadsheet,
        },
        {
            id: "pdf",
            label: "PDF",
            description: "Portable document format, great for sharing",
            icon: FileDown,
        },
    ];

    const handleExport = () => {
        onExport(exportType, filename);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`relative w-full max-w-md rounded-2xl border shadow-2xl ${
                    isDarkMode
                        ? "bg-slate-900/95 border-white/10"
                        : "bg-white border-gray-200"
                } backdrop-blur-xl animate-scale-in`}>
                {/* Header */}
                <div
                    className={`flex items-center justify-between p-6 border-b ${
                        isDarkMode ? "border-white/10" : "border-gray-100"
                    }`}>
                    <h2
                        className={`text-xl font-bold ${
                            isDarkMode ? "text-white" : "text-gray-900"
                        }`}>
                        Export Worklogs
                    </h2>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg transition-colors ${
                            isDarkMode
                                ? "hover:bg-white/10 text-white/60"
                                : "hover:bg-gray-100 text-gray-400"
                        }`}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Filename Input */}
                    <div>
                        <label
                            className={`block text-sm font-medium mb-2 ${
                                isDarkMode ? "text-white/70" : "text-gray-700"
                            }`}>
                            Filename
                        </label>
                        <input
                            type="text"
                            value={filename}
                            onChange={(e) => setFilename(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors ${
                                isDarkMode
                                    ? "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-orange-500/50"
                                    : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-orange-500"
                            } outline-none`}
                            placeholder="Enter filename"
                        />
                    </div>

                    {/* Export Type Selection */}
                    <div>
                        <label
                            className={`block text-sm font-medium mb-3 ${
                                isDarkMode ? "text-white/70" : "text-gray-700"
                            }`}>
                            Export Format
                        </label>
                        <div className="space-y-2">
                            {exportOptions.map((option) => (
                                <label
                                    key={option.id}
                                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                                        exportType === option.id
                                            ? isDarkMode
                                                ? "bg-orange-500/10 border-orange-500/50"
                                                : "bg-orange-50 border-orange-300"
                                            : isDarkMode
                                              ? "bg-white/5 border-white/10 hover:bg-white/10"
                                              : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                    }`}>
                                    <input
                                        type="radio"
                                        name="exportType"
                                        value={option.id}
                                        checked={exportType === option.id}
                                        onChange={(e) =>
                                            setExportType(e.target.value)
                                        }
                                        className="sr-only"
                                    />
                                    <div
                                        className={`p-2 rounded-lg ${
                                            exportType === option.id
                                                ? "bg-orange-500 text-white"
                                                : isDarkMode
                                                  ? "bg-white/10 text-white/60"
                                                  : "bg-gray-200 text-gray-500"
                                        }`}>
                                        <option.icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div
                                            className={`font-medium ${
                                                isDarkMode
                                                    ? "text-white"
                                                    : "text-gray-900"
                                            }`}>
                                            {option.label}
                                        </div>
                                        <div
                                            className={`text-xs ${
                                                isDarkMode
                                                    ? "text-white/50"
                                                    : "text-gray-500"
                                            }`}>
                                            {option.description}
                                        </div>
                                    </div>
                                    <div
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            exportType === option.id
                                                ? "border-orange-500 bg-orange-500"
                                                : isDarkMode
                                                  ? "border-white/20"
                                                  : "border-gray-300"
                                        }`}>
                                        {exportType === option.id && (
                                            <div className="w-2 h-2 rounded-full bg-white" />
                                        )}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div
                    className={`flex items-center justify-end gap-3 p-6 border-t ${
                        isDarkMode ? "border-white/10" : "border-gray-100"
                    }`}>
                    <button
                        onClick={onClose}
                        className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                            isDarkMode
                                ? "text-white/70 hover:bg-white/10"
                                : "text-gray-600 hover:bg-gray-100"
                        }`}>
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/20 transition-all">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
