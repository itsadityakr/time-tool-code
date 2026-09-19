import React from "react";
import { FolderKanban, Timer, Target, Zap } from "lucide-react";

const ProjectsView = ({
    analyticsData,
    worklogs,
    filteredData,
    formatTime,
    parseTime,
    isDarkMode,
    theme,
}) => {
    return (
        <div className="space-y-6">
            <h2
                className={`text-2xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                <FolderKanban className="w-6 h-6 inline mr-2" />
                Project Overview
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analyticsData.projectBreakdown.map((project, idx) => (
                    <div
                        key={idx}
                        className={`rounded-3xl border overflow-hidden backdrop-blur-xl transition-all hover:scale-105 ${
                            isDarkMode
                                ? "bg-black/40 border-white/10 hover:bg-black/60"
                                : "bg-white/60 border-white/40 shadow-xl hover:bg-white/80"
                        }`}>
                        <div
                            className={`p-6 bg-gradient-to-r ${theme.gradient} bg-opacity-10`}>
                            <div className="flex items-center justify-between mb-4">
                                <div
                                    className={`p-3 rounded-xl bg-gradient-to-r ${theme.gradient} text-white shadow-lg`}>
                                    <FolderKanban className="w-6 h-6" />
                                </div>
                                <div
                                    className={`text-3xl font-bold ${
                                        isDarkMode
                                            ? "text-white"
                                            : "text-gray-900"
                                    }`}>
                                    {project.percentage}%
                                </div>
                            </div>
                            <h3
                                className={`text-lg font-bold mb-2 ${
                                    isDarkMode ? "text-white" : "text-gray-900"
                                }`}>
                                {project.name}
                            </h3>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <span
                                    className={`text-sm ${
                                        isDarkMode
                                            ? "text-white/60"
                                            : "text-gray-600"
                                    }`}>
                                    <Timer className="w-4 h-4 inline mr-1" />
                                    Total Time
                                </span>
                                <span
                                    className={`font-mono font-bold text-lg ${
                                        isDarkMode
                                            ? "text-white"
                                            : "text-gray-900"
                                    }`}>
                                    {project.formattedTime}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span
                                    className={`text-sm ${
                                        isDarkMode
                                            ? "text-white/60"
                                            : "text-gray-600"
                                    }`}>
                                    <Target className="w-4 h-4 inline mr-1" />
                                    Tickets
                                </span>
                                <span
                                    className={`font-semibold ${
                                        isDarkMode
                                            ? "text-white"
                                            : "text-gray-900"
                                    }`}>
                                    {project.tickets}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span
                                    className={`text-sm ${
                                        isDarkMode
                                            ? "text-white/60"
                                            : "text-gray-600"
                                    }`}>
                                    <Zap className="w-4 h-4 inline mr-1" />
                                    Entries
                                </span>
                                <span
                                    className={`font-semibold ${
                                        isDarkMode
                                            ? "text-white"
                                            : "text-gray-900"
                                    }`}>
                                    {project.entries}
                                </span>
                            </div>

                            <div
                                className={`pt-4 border-t ${
                                    isDarkMode
                                        ? "border-white/10"
                                        : "border-gray-200"
                                }`}>
                                <div
                                    className={`h-2 rounded-full overflow-hidden ${
                                        isDarkMode
                                            ? "bg-white/5"
                                            : "bg-gray-200"
                                    }`}>
                                    <div
                                        className={`h-full bg-gradient-to-r ${theme.gradient}`}
                                        style={{
                                            width: `${project.percentage}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProjectsView;
