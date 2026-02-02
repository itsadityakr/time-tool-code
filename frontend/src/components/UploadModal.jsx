import React, { useState, useRef } from "react";
import { Upload, FileSpreadsheet, X, Loader2 } from "lucide-react";

const SUPPORTED_EXTENSIONS = [".xlsx", ".csv"];
const SUPPORTED_MIME_TYPES = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "application/vnd.ms-excel",
];

const UploadModal = ({
    isOpen,
    onClose,
    onUpload,
    onError,
    isDarkMode,
    canClose = true,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const validateFile = (file) => {
        if (!file) {
            return {
                valid: false,
                message: "No file selected",
                details: "Please select a file to upload.",
            };
        }

        const fileName = file.name.toLowerCase();
        const hasValidExtension = SUPPORTED_EXTENSIONS.some((ext) =>
            fileName.endsWith(ext),
        );

        if (!hasValidExtension) {
            const extension = fileName.split(".").pop() || "unknown";
            return {
                valid: false,
                message: "Unsupported file type",
                details: `File "${file.name}" has extension ".${extension}" which is not supported.\n\nSupported formats:\n• .xlsx (Excel Workbook)\n• .csv (Comma Separated Values)\n\nPlease convert your file to one of these formats and try again.`,
            };
        }

        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return {
                valid: false,
                message: "File too large",
                details: `File "${file.name}" is ${(file.size / 1024 / 1024).toFixed(2)}MB.\n\nMaximum file size: 10MB\n\nPlease reduce the file size or split it into smaller files.`,
            };
        }

        return { valid: true };
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        const validation = validateFile(file);

        if (!validation.valid) {
            onError?.(validation.message, validation.details);
            return;
        }

        await handleFile(file);
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        const validation = validateFile(file);

        if (!validation.valid) {
            onError?.(validation.message, validation.details);
            e.target.value = ""; // Reset input
            return;
        }

        await handleFile(file);
    };

    const handleFile = async (file) => {
        setIsUploading(true);
        try {
            await onUpload(file);
            if (canClose) onClose();
        } catch (error) {
            const errorMessage =
                error?.response?.data?.message ||
                error.message ||
                "Unknown error";
            onError?.(
                "Upload failed",
                `Failed to process file "${file.name}".\n\nError: ${errorMessage}\n\nPlease check that your file has the correct format and try again.`,
            );
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 ${
                    isDarkMode ? "bg-black/80" : "bg-gray-900/60"
                } backdrop-blur-md`}
                onClick={canClose ? onClose : undefined}
            />

            {/* Modal */}
            <div
                className={`relative w-full max-w-2xl mx-4 rounded-3xl border shadow-2xl ${
                    isDarkMode
                        ? "bg-slate-900/95 border-white/10"
                        : "bg-white border-gray-200"
                } backdrop-blur-xl animate-scale-in`}>
                {/* Header */}
                <div
                    className={`flex items-center justify-between p-6 border-b ${
                        isDarkMode ? "border-white/10" : "border-gray-100"
                    }`}>
                    <div>
                        <h2
                            className={`text-2xl font-bold ${
                                isDarkMode ? "text-white" : "text-gray-900"
                            }`}>
                            Upload Timesheet
                        </h2>
                        <p
                            className={`text-sm mt-1 ${
                                isDarkMode ? "text-white/50" : "text-gray-500"
                            }`}>
                            Import your worklog data from Excel or CSV
                        </p>
                    </div>
                    {canClose && (
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-lg transition-colors ${
                                isDarkMode
                                    ? "hover:bg-white/10 text-white/60"
                                    : "hover:bg-gray-100 text-gray-400"
                            }`}>
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Drop Zone */}
                <div className="p-8">
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
                            isDragging
                                ? isDarkMode
                                    ? "border-orange-500 bg-orange-500/10"
                                    : "border-orange-500 bg-orange-50"
                                : isDarkMode
                                  ? "border-white/20 hover:border-white/40 hover:bg-white/5"
                                  : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                        }`}>
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-4">
                                <Loader2
                                    className={`w-16 h-16 animate-spin ${
                                        isDarkMode
                                            ? "text-orange-500"
                                            : "text-orange-500"
                                    }`}
                                />
                                <p
                                    className={`text-lg font-medium ${
                                        isDarkMode
                                            ? "text-white"
                                            : "text-gray-700"
                                    }`}>
                                    Uploading...
                                </p>
                            </div>
                        ) : (
                            <>
                                <div
                                    className={`p-4 rounded-2xl mb-4 ${
                                        isDragging
                                            ? "bg-orange-500 text-white"
                                            : isDarkMode
                                              ? "bg-white/10 text-white/60"
                                              : "bg-gray-100 text-gray-400"
                                    }`}>
                                    <Upload className="w-12 h-12" />
                                </div>
                                <p
                                    className={`text-xl font-semibold mb-2 ${
                                        isDarkMode
                                            ? "text-white"
                                            : "text-gray-800"
                                    }`}>
                                    {isDragging
                                        ? "Drop your file here"
                                        : "Drag & drop your file"}
                                </p>
                                <p
                                    className={`text-sm mb-6 ${
                                        isDarkMode
                                            ? "text-white/50"
                                            : "text-gray-500"
                                    }`}>
                                    or click to browse from your computer
                                </p>

                                {/* File type indicators */}
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
                                            isDarkMode
                                                ? "bg-green-500/20 text-green-400"
                                                : "bg-green-100 text-green-700"
                                        }`}>
                                        <FileSpreadsheet className="w-4 h-4" />
                                        .xlsx
                                    </div>
                                    <div
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
                                            isDarkMode
                                                ? "bg-blue-500/20 text-blue-400"
                                                : "bg-blue-100 text-blue-700"
                                        }`}>
                                        <FileSpreadsheet className="w-4 h-4" />
                                        .csv
                                    </div>
                                </div>
                            </>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.csv"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>
                </div>

                {/* Footer hint */}
                <div
                    className={`px-8 pb-6 text-center ${
                        isDarkMode ? "text-white/40" : "text-gray-400"
                    }`}>
                    <p className="text-xs">
                        Supported columns: Date, JIRA ID, Description, Time
                        Logged, Status, Project Name, Remarks
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UploadModal;
