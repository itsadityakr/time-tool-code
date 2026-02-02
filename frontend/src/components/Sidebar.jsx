import React from "react";
import {
    LayoutDashboard,
    Menu,
    Filter,
    Layers,
    BarChart3,
    CalendarDays,
    FolderKanban,
} from "lucide-react";
import { SidebarItem, GlassSelect } from "./UIComponents";
import { VIEW_MODES, STATUS_OPTIONS } from "../constants";

const Sidebar = ({
    isSidebarOpen,
    setIsSidebarOpen,
    currentView,
    setCurrentView,
    filters,
    setFilters,
    worklogs,
    getUniqueJiraIds,
    clearAllFilters,
    setQuickFilter,
    isDarkMode,
    theme,
}) => {
    return (
        <aside
            className={`${
                isSidebarOpen ? "w-80" : "w-20"
            } transition-all duration-500 ease-in-out h-full border-r ${
                isDarkMode
                    ? "border-white/10 bg-black/20"
                    : "border-orange-900/5 bg-white/40"
            } backdrop-blur-xl flex flex-col justify-between`}>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
                {/* Logo */}
                <div className="h-20 flex items-center justify-center border-b border-white/5">
                    <div
                        className={`flex items-center gap-3 font-bold text-xl tracking-tight ${
                            isSidebarOpen ? "px-6" : "px-0"
                        }`}>
                        <div
                            className={`p-2 rounded-xl bg-gradient-to-tr ${theme.gradient} shadow-lg shadow-orange-500/20`}>
                            <LayoutDashboard className="w-5 h-5 text-white" />
                        </div>
                        {isSidebarOpen && (
                            <span
                                className={`bg-clip-text text-transparent bg-gradient-to-r ${
                                    isDarkMode
                                        ? "from-white to-white/60"
                                        : "from-gray-900 to-gray-600"
                                }`}>
                                WorkLog Pro
                            </span>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-2">
                    <SidebarItem
                        icon={<Layers />}
                        label="Dashboard"
                        active={currentView === VIEW_MODES.DASHBOARD}
                        isOpen={isSidebarOpen}
                        theme={theme}
                        isDark={isDarkMode}
                        onClick={() => setCurrentView(VIEW_MODES.DASHBOARD)}
                    />
                    <SidebarItem
                        icon={<BarChart3 />}
                        label="Analytics"
                        active={currentView === VIEW_MODES.ANALYTICS}
                        isOpen={isSidebarOpen}
                        theme={theme}
                        isDark={isDarkMode}
                        onClick={() => setCurrentView(VIEW_MODES.ANALYTICS)}
                    />
                    <SidebarItem
                        icon={<CalendarDays />}
                        label="Calendar"
                        active={currentView === VIEW_MODES.CALENDAR}
                        isOpen={isSidebarOpen}
                        theme={theme}
                        isDark={isDarkMode}
                        onClick={() => setCurrentView(VIEW_MODES.CALENDAR)}
                    />
                    <SidebarItem
                        icon={<FolderKanban />}
                        label="Projects"
                        active={currentView === VIEW_MODES.PROJECTS}
                        isOpen={isSidebarOpen}
                        theme={theme}
                        isDark={isDarkMode}
                        onClick={() => setCurrentView(VIEW_MODES.PROJECTS)}
                    />
                </nav>

                {/* Filters */}
                {isSidebarOpen && (
                    <div className="px-6 py-6">
                        <div
                            className={`text-xs font-semibold uppercase mb-4 tracking-wider ${
                                isDarkMode
                                    ? "text-white/40"
                                    : "text-gray-500/80"
                            }`}>
                            <Filter className="w-3 h-3 inline mr-2" />
                            Smart Filters
                        </div>

                        {/* Quick Date Filters */}
                        <div className="space-y-2 mb-4">
                            <button
                                onClick={() => setQuickFilter("today")}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                    filters.showToday
                                        ? `bg-gradient-to-r ${theme.gradient} text-white shadow-lg`
                                        : isDarkMode
                                          ? "bg-white/5 hover:bg-white/10 text-white/70"
                                          : "bg-white hover:bg-gray-50 text-gray-600"
                                }`}>
                                📅 Today
                            </button>
                            <button
                                onClick={() => setQuickFilter("week")}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                    filters.showThisWeek
                                        ? `bg-gradient-to-r ${theme.gradient} text-white shadow-lg`
                                        : isDarkMode
                                          ? "bg-white/5 hover:bg-white/10 text-white/70"
                                          : "bg-white hover:bg-gray-50 text-gray-600"
                                }`}>
                                📆 This Week
                            </button>
                            <button
                                onClick={() => setQuickFilter("month")}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                    filters.showThisMonth
                                        ? `bg-gradient-to-r ${theme.gradient} text-white shadow-lg`
                                        : isDarkMode
                                          ? "bg-white/5 hover:bg-white/10 text-white/70"
                                          : "bg-white hover:bg-gray-50 text-gray-600"
                                }`}>
                                🗓️ This Month
                            </button>
                        </div>

                        {/* Filter Dropdowns */}
                        <div className="space-y-4">
                            <GlassSelect
                                label="Project"
                                value={filters.project}
                                onChange={(v) =>
                                    setFilters({
                                        ...filters,
                                        project: v,
                                    })
                                }
                                options={[
                                    ...new Set(
                                        worklogs.map((w) => w.projectName)
                                    ),
                                ]}
                                isDark={isDarkMode}
                            />
                            <GlassSelect
                                label="Status"
                                value={filters.status}
                                onChange={(v) =>
                                    setFilters({
                                        ...filters,
                                        status: v,
                                    })
                                }
                                options={STATUS_OPTIONS}
                                isDark={isDarkMode}
                            />
                            <GlassSelect
                                label="JIRA ID"
                                value={filters.jiraId}
                                onChange={(v) =>
                                    setFilters({
                                        ...filters,
                                        jiraId: v,
                                    })
                                }
                                options={getUniqueJiraIds()}
                                isDark={isDarkMode}
                            />

                            {/* Custom Date Range */}
                            <div className="space-y-2">
                                <label
                                    className={`text-[10px] font-bold uppercase tracking-wider ${
                                        isDarkMode
                                            ? "text-white/30"
                                            : "text-gray-400"
                                    }`}>
                                    Custom Range
                                </label>
                                <input
                                    type="date"
                                    value={filters.dateRange.start}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            dateRange: {
                                                ...filters.dateRange,
                                                start: e.target.value,
                                            },
                                            showToday: false,
                                            showThisWeek: false,
                                            showThisMonth: false,
                                        })
                                    }
                                    className={`w-full appearance-none border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 transition-all ${
                                        isDarkMode
                                            ? "bg-white/5 border-white/10 hover:border-white/20 text-white/80 focus:ring-white/20"
                                            : "bg-white border-gray-200 hover:border-orange-300 text-gray-700 focus:ring-orange-200"
                                    }`}
                                />
                                <input
                                    type="date"
                                    value={filters.dateRange.end}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            dateRange: {
                                                ...filters.dateRange,
                                                end: e.target.value,
                                            },
                                            showToday: false,
                                            showThisWeek: false,
                                            showThisMonth: false,
                                        })
                                    }
                                    className={`w-full appearance-none border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 transition-all ${
                                        isDarkMode
                                            ? "bg-white/5 border-white/10 hover:border-white/20 text-white/80 focus:ring-white/20"
                                            : "bg-white border-gray-200 hover:border-orange-300 text-gray-700 focus:ring-orange-200"
                                    }`}
                                />
                            </div>

                            {/* Clear Filters */}
                            <button
                                onClick={clearAllFilters}
                                className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                    isDarkMode
                                        ? "bg-red-500/20 hover:bg-red-500/30 text-red-300"
                                        : "bg-red-50 hover:bg-red-100 text-red-600"
                                }`}>
                                Clear All Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar Toggle */}
            <div className="p-4 border-t border-white/5">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`w-full p-3 rounded-xl transition-colors flex items-center justify-center ${
                        isDarkMode
                            ? "hover:bg-white/5 text-white/60 hover:text-white"
                            : "hover:bg-orange-500/5 text-gray-500 hover:text-gray-900"
                    }`}>
                    <Menu className="w-5 h-5" />
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
