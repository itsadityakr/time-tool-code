import React from "react";
import { CalendarDays, Calendar, ExternalLink } from "lucide-react";
import { StatusPill } from "../components/UIComponents";

export const CalendarView = ({
    calendarData,
    selectedCalendarDate,
    setSelectedCalendarDate,
    formatDate,
    formatTime,
    parseTime,
    getJiraUrl,
    isDarkMode,
    theme,
}) => {
    const dates = Object.keys(calendarData).sort().reverse();

    return (
        <div className="space-y-6">
            <h2
                className={`text-2xl font-bold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                <CalendarDays className="w-6 h-6 inline mr-2" />
                Calendar View
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Date List */}
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
                            Dates
                        </h3>
                    </div>
                    <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
                        {dates.map((date) => {
                            const dayLogs = calendarData[date];
                            const totalTime = dayLogs.reduce(
                                (acc, log) => acc + parseTime(log.timeLogged),
                                0
                            );
                            return (
                                <button
                                    key={date}
                                    onClick={() =>
                                        setSelectedCalendarDate(date)
                                    }
                                    className={`w-full text-left p-4 rounded-xl transition-all ${
                                        selectedCalendarDate === date
                                            ? `bg-gradient-to-r ${theme.gradient} text-white shadow-lg`
                                            : isDarkMode
                                              ? "bg-white/5 hover:bg-white/10 text-white/80"
                                              : "bg-white hover:bg-gray-50 text-gray-700"
                                    }`}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="font-semibold">
                                                {formatDate(date)}
                                            </div>
                                            <div
                                                className={`text-xs mt-1 ${
                                                    selectedCalendarDate ===
                                                    date
                                                        ? "text-white/80"
                                                        : isDarkMode
                                                          ? "text-white/40"
                                                          : "text-gray-400"
                                                }`}>
                                                {dayLogs.length} entries
                                            </div>
                                        </div>
                                        <div
                                            className={`font-mono font-bold ${
                                                selectedCalendarDate === date
                                                    ? "text-white"
                                                    : isDarkMode
                                                      ? "text-orange-400"
                                                      : "text-orange-600"
                                            }`}>
                                            {formatTime(totalTime)}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Day Details */}
                <div
                    className={`lg:col-span-2 rounded-3xl border overflow-hidden backdrop-blur-xl ${
                        isDarkMode
                            ? "bg-black/40 border-white/10"
                            : "bg-white/60 border-white/40 shadow-xl"
                    }`}>
                    <div className="p-6 border-b border-white/5">
                        <h3
                            className={`text-lg font-bold ${
                                isDarkMode ? "text-white" : "text-gray-900"
                            }`}>
                            {selectedCalendarDate
                                ? formatDate(selectedCalendarDate)
                                : "Select a date"}
                        </h3>
                    </div>
                    <div className="p-6">
                        {selectedCalendarDate &&
                        calendarData[selectedCalendarDate] ? (
                            <div className="space-y-3">
                                {calendarData[selectedCalendarDate].map(
                                    (log, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-4 rounded-xl border ${
                                                isDarkMode
                                                    ? "bg-white/5 border-white/10"
                                                    : "bg-white border-gray-200"
                                            }`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <a
                                                    href={getJiraUrl(
                                                        log.jiraId
                                                    )}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded font-mono text-xs transition-colors ${
                                                        isDarkMode
                                                            ? "bg-white/5 border border-white/10 text-white/70 hover:text-orange-400"
                                                            : "bg-gray-100 text-gray-600 hover:text-orange-600"
                                                    }`}>
                                                    {log.jiraId}
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`font-mono font-bold ${
                                                            isDarkMode
                                                                ? "text-white"
                                                                : "text-gray-900"
                                                        }`}>
                                                        {log.timeLogged}
                                                    </span>
                                                    <StatusPill
                                                        status={log.status}
                                                        size="sm"
                                                    />
                                                </div>
                                            </div>
                                            <div
                                                className={`text-sm ${
                                                    isDarkMode
                                                        ? "text-white/80"
                                                        : "text-gray-700"
                                                } mb-2`}>
                                                {log.description}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <div
                                                    className={`w-2 h-2 rounded-full bg-orange-400`}></div>
                                                <span
                                                    className={
                                                        isDarkMode
                                                            ? "text-white/60"
                                                            : "text-gray-600"
                                                    }>
                                                    {log.projectName}
                                                </span>
                                                {log.remarks && (
                                                    <span
                                                        className={
                                                            isDarkMode
                                                                ? "text-white/40"
                                                                : "text-gray-400"
                                                        }>
                                                        • {log.remarks}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        ) : (
                            <div
                                className={`text-center py-12 ${
                                    isDarkMode
                                        ? "text-white/30"
                                        : "text-gray-400"
                                }`}>
                                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>Select a date to view entries</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
