import React from "react";
import {
    BarChart3,
    FolderKanban,
    Activity,
    TrendingUp,
} from "lucide-react";
import { StatusPill } from "../components/UIComponents";

const AnalyticsView = ({
    analyticsData,
    calculatedStats,
    isDarkMode,
    theme,
}) => {
    return (
        <div className="space-y-6">
            <h2
                className={`text-2xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                <BarChart3 className="w-6 h-6 inline mr-2" />
                Analytics Dashboard
            </h2>

            {/* Project Breakdown */}
            <div
                className={`rounded-3xl border overflow-hidden backdrop-blur-xl ${
                    isDarkMode
                        ? "bg-black/40 border-white/10"
                        : "bg-white/60 border-white/40 shadow-xl"
                }`}>
                <div className="p-6 border-b border-white/5">
                    <h3
                        className={`text-lg font-bold ${
                            isDarkMode ? "text-white" : "text-gray-900"
                        }`}>
                        <FolderKanban className="w-5 h-5 inline mr-2" />
                        Time by Project
                    </h3>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        {analyticsData.projectBreakdown.map((project, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span
                                        className={`font-medium ${
                                            isDarkMode
                                                ? "text-white/90"
                                                : "text-gray-800"
                                        }`}>
                                        {project.name}
                                    </span>
                                    <div className="flex items-center gap-4">
                                        <span
                                            className={`text-sm ${
                                                isDarkMode
                                                    ? "text-white/60"
                                                    : "text-gray-600"
                                            }`}>
                                            {project.tickets} tickets •{" "}
                                            {project.entries} entries
                                        </span>
                                        <span
                                            className={`font-mono font-bold ${
                                                isDarkMode
                                                    ? "text-white"
                                                    : "text-gray-900"
                                            }`}>
                                            {project.formattedTime}
                                        </span>
                                        <span
                                            className={`text-xs ${
                                                isDarkMode
                                                    ? "text-white/40"
                                                    : "text-gray-400"
                                            }`}>
                                            {project.percentage}%
                                        </span>
                                    </div>
                                </div>
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
                        ))}
                    </div>
                </div>
            </div>

            {/* Status Breakdown & Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Breakdown */}
                <div
                    className={`rounded-3xl border overflow-hidden backdrop-blur-xl ${
                        isDarkMode
                            ? "bg-black/40 border-white/10"
                            : "bg-white/60 border-white/40 shadow-xl"
                    }`}>
                    <div className="p-6 border-b border-white/5">
                        <h3
                            className={`text-lg font-bold ${
                                isDarkMode ? "text-white" : "text-gray-900"
                            }`}>
                            <Activity className="w-5 h-5 inline mr-2" />
                            Status Breakdown
                        </h3>
                    </div>
                    <div className="p-6 space-y-3">
                        {analyticsData.statusBreakdown.map((status, idx) => (
                            <div
                                key={idx}
                                className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <StatusPill status={status.status} />
                                </div>
                                <div className="text-right">
                                    <div
                                        className={`font-mono font-bold ${
                                            isDarkMode
                                                ? "text-white"
                                                : "text-gray-900"
                                        }`}>
                                        {status.formattedTime}
                                    </div>
                                    <div
                                        className={`text-xs ${
                                            isDarkMode
                                                ? "text-white/40"
                                                : "text-gray-400"
                                        }`}>
                                        {status.count} entries
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div
                    className={`rounded-3xl border overflow-hidden backdrop-blur-xl ${
                        isDarkMode
                            ? "bg-black/40 border-white/10"
                            : "bg-white/60 border-white/40 shadow-xl"
                    }`}>
                    <div className="p-6 border-b border-white/5">
                        <h3
                            className={`text-lg font-bold ${
                                isDarkMode ? "text-white" : "text-gray-900"
                            }`}>
                            <TrendingUp className="w-5 h-5 inline mr-2" />
                            Recent Activity
                        </h3>
                    </div>
                    <div className="p-6 space-y-3">
                        {analyticsData.dailyBreakdown.map((day, idx) => (
                            <div
                                key={idx}
                                className="flex justify-between items-center">
                                <span
                                    className={`text-sm ${
                                        isDarkMode
                                            ? "text-white/70"
                                            : "text-gray-600"
                                    }`}>
                                    {day.date}
                                </span>
                                <span
                                    className={`font-mono font-bold ${
                                        isDarkMode
                                            ? "text-white"
                                            : "text-gray-900"
                                    }`}>
                                    {day.formattedTime}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsView;
