import React from "react";
import { Plus, Edit2, X } from "lucide-react";
import { GlassInput } from "./UIComponents";
import { THEME, STATUS_OPTIONS } from "../constants";

const Modal = ({
    isModalOpen,
    setIsModalOpen,
    modalMode,
    currentEntry,
    handleSave,
    isDarkMode,
}) => {
    if (!isModalOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={() => setIsModalOpen(false)}></div>

            {/* Modal Content */}
            <div
                className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden animate-scale-in ${
                    isDarkMode
                        ? "bg-[#1a1a1a]/90 border-white/10"
                        : "bg-white/95 border-gray-200"
                } backdrop-blur-xl`}>
                {/* Modal Header */}
                <div
                    className={`p-6 border-b flex items-center justify-between bg-gradient-to-r ${THEME.gradient} ${
                        isDarkMode
                            ? "bg-opacity-10 border-white/10"
                            : "bg-opacity-90 border-transparent"
                    }`}>
                    <h3
                        className={`text-lg font-bold flex items-center gap-2 ${
                            isDarkMode ? "text-white" : "text-white"
                        }`}>
                        {modalMode === "add" ? (
                            <Plus className="w-5 h-5" />
                        ) : (
                            <Edit2 className="w-5 h-5" />
                        )}
                        {modalMode === "add" ? "New Entry" : "Edit Entry"}
                    </h3>
                    <button
                        onClick={() => setIsModalOpen(false)}
                        className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Modal Form */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        const data = {
                            date: formData.get("date"),
                            jiraId: formData.get("jiraId"),
                            projectName: formData.get("projectName"),
                            description: formData.get("description"),
                            timeLogged: formData.get("timeLogged"),
                            status: formData.get("status"),
                            remarks: formData.get("remarks"),
                        };
                        if (currentEntry) {
                            data.id = currentEntry.id;
                        }
                        handleSave(data);
                    }}
                    className="p-6 space-y-4">
                    {/* Date and JIRA ID */}
                    <div className="grid grid-cols-2 gap-4">
                        <GlassInput
                            name="date"
                            label="Date"
                            type="date"
                            defaultValue={
                                currentEntry?.date
                                    ? new Date(currentEntry.date)
                                          .toISOString()
                                          .split("T")[0]
                                    : new Date().toISOString().split("T")[0]
                            }
                            isDark={isDarkMode}
                            required
                        />
                        <GlassInput
                            name="jiraId"
                            label="Jira ID"
                            placeholder="PROJ-123"
                            defaultValue={currentEntry?.jiraId}
                            isDark={isDarkMode}
                            required
                        />
                    </div>

                    {/* Project Name */}
                    <GlassInput
                        name="projectName"
                        label="Project"
                        placeholder="Web App..."
                        defaultValue={currentEntry?.projectName}
                        isDark={isDarkMode}
                        required
                    />

                    {/* Time and Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <GlassInput
                            name="timeLogged"
                            label="Time (e.g. 2h 30m)"
                            placeholder="2h 30m"
                            defaultValue={currentEntry?.timeLogged}
                            isDark={isDarkMode}
                            required
                        />
                        <div className="space-y-1">
                            <label
                                className={`text-xs font-semibold uppercase ${
                                    isDarkMode
                                        ? "text-white/50"
                                        : "text-gray-500"
                                }`}>
                                Status
                            </label>
                            <select
                                name="status"
                                defaultValue={
                                    currentEntry?.status || "In Progress"
                                }
                                className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all ${
                                    isDarkMode
                                        ? "bg-black/20 border border-white/10 text-white focus:border-white/30 focus:ring-white/20"
                                        : "bg-gray-50 border border-gray-200 text-gray-900 focus:border-orange-500 focus:ring-orange-200"
                                }`}>
                                {STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <label
                            className={`text-xs font-semibold uppercase ${
                                isDarkMode ? "text-white/50" : "text-gray-500"
                            }`}>
                            Description
                        </label>
                        <textarea
                            name="description"
                            rows="3"
                            defaultValue={currentEntry?.description}
                            required
                            className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all resize-none ${
                                isDarkMode
                                    ? "bg-black/20 border border-white/10 text-white focus:border-white/30 focus:ring-white/20"
                                    : "bg-gray-50 border border-gray-200 text-gray-900 focus:border-orange-500 focus:ring-orange-200"
                            }`}></textarea>
                    </div>

                    {/* Remarks */}
                    <GlassInput
                        name="remarks"
                        label="Remarks (Optional)"
                        defaultValue={currentEntry?.remarks}
                        isDark={isDarkMode}
                    />

                    {/* Form Actions */}
                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                isDarkMode
                                    ? "hover:bg-white/5 text-white/70"
                                    : "hover:bg-gray-100 text-gray-600"
                            }`}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-orange-500/20 bg-gradient-to-r ${THEME.gradient} hover:scale-105 active:scale-95 transition-all`}>
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Modal;
