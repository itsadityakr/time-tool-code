import React, { useState, useEffect } from "react";
import { Clock, Zap, Briefcase, Target } from "lucide-react";

// Components
import CursorFollower from "./components/CursorFollower";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Modal from "./components/Modal";
import { GlassStatCard } from "./components/UIComponents";

// Views
import DashboardView from "./views/DashboardView";
import AnalyticsView from "./views/AnalyticsView";
import CalendarView from "./views/CalendarView";
import ProjectsView from "./views/ProjectsView";

// Hooks & Utils
import { useWorklogData } from "./hooks/useWorklogData";
import { formatDate, parseTime, formatTime, getJiraUrl } from "./utils/helpers";
import { exportToCSV, exportToXLSX } from "./utils/exportUtils";
import {
    fetchWorklogs,
    fetchStats,
    createWorklog,
    updateWorklog,
    deleteWorklog,
    uploadFile,
    clearWorklogs,
} from "./utils/apiService";

// Constants
import {
    THEME,
    VIEW_MODES,
    ALL_COLUMNS,
    DEFAULT_COLUMN_WIDTHS,
} from "./constants";

export default function App() {
    // State Management
    const [worklogs, setWorklogs] = useState([]);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isMerged, setIsMerged] = useState(false);
    const [expandedRows, setExpandedRows] = useState({});
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showColumnMenu, setShowColumnMenu] = useState(false);
    const [currentView, setCurrentView] = useState(VIEW_MODES.DASHBOARD);
    const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
    const [showOriginal, setShowOriginal] = useState(false);

    // Column visibility and widths
    const [visibleColumns, setVisibleColumns] = useState(() => {
        const saved = localStorage.getItem("visibleColumns");
        return saved
            ? JSON.parse(saved)
            : ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key);
    });

    const [columnWidths, setColumnWidths] = useState(() => {
        const saved = localStorage.getItem("columnWidths");
        return saved ? JSON.parse(saved) : DEFAULT_COLUMN_WIDTHS;
    });

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add");
    const [currentEntry, setCurrentEntry] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        project: "",
        status: "",
        jiraId: "",
        dateRange: { start: "", end: "" },
        showToday: false,
        showThisWeek: false,
        showThisMonth: false,
    });

    // Stats
    const [stats, setStats] = useState({
        totalLogs: 0,
        projects: [],
        totalProjects: 0,
    });

    // Save column preferences
    useEffect(() => {
        localStorage.setItem("visibleColumns", JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    useEffect(() => {
        localStorage.setItem("columnWidths", JSON.stringify(columnWidths));
    }, [columnWidths]);

    // Data fetching - clear worklogs on page load to start fresh
    useEffect(() => {
        const initializeApp = async () => {
            try {
                // Clear all worklogs on page load/reload
                await clearWorklogs();
                // Then load fresh (which will be empty)
                loadWorklogs();
                loadStats();
            } catch (error) {
                console.error("Error initializing app:", error);
            }
        };
        initializeApp();
    }, []);

    const loadWorklogs = async () => {
        try {
            const data = await fetchWorklogs();
            setWorklogs(data);
        } catch (error) {
            console.error("Error fetching worklogs:", error);
        }
    };

    const loadStats = async () => {
        try {
            const data = await fetchStats();
            setStats(data);
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    // Use custom hook for data processing
    const {
        mergedData,
        mergedDataFull,
        filteredData,
        calculatedStats,
        analyticsData,
        calendarData,
    } = useWorklogData(worklogs, isMerged, filters, searchQuery);

    // CRUD Operations
    const handleSave = async (entry) => {
        try {
            if (modalMode === "add") {
                await createWorklog(entry);
            } else {
                await updateWorklog(entry.id, entry);
            }
            loadWorklogs();
            loadStats();
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving worklog:", error);
            alert("Failed to save worklog");
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this entry?")) {
            try {
                await deleteWorklog(id);
                loadWorklogs();
                loadStats();
            } catch (error) {
                console.error("Error deleting worklog:", error);
            }
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            await uploadFile(file);
            loadWorklogs();
            loadStats();
            alert("Uploaded successfully!");
        } catch (error) {
            alert("Upload failed");
        }
    };

    // Column management
    const startResize = (e, columnKey) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = columnWidths[columnKey];

        const onMouseMove = (moveEvent) => {
            const newWidth = startWidth + (moveEvent.clientX - startX);
            setColumnWidths((prev) => ({
                ...prev,
                [columnKey]: Math.max(80, newWidth),
            }));
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };

    const toggleColumnVisibility = (columnKey) => {
        setVisibleColumns((prev) => {
            if (prev.includes(columnKey)) {
                return prev.filter((k) => k !== columnKey);
            } else {
                return [...prev, columnKey];
            }
        });
    };

    const getVisibleColumns = () => {
        return ALL_COLUMNS.filter((col) => visibleColumns.includes(col.key));
    };

    // Filter helpers
    const clearAllFilters = () => {
        setFilters({
            project: "",
            status: "",
            jiraId: "",
            dateRange: { start: "", end: "" },
            showToday: false,
            showThisWeek: false,
            showThisMonth: false,
        });
    };

    const setQuickFilter = (type) => {
        setFilters((prev) => ({
            ...prev,
            showToday: type === "today",
            showThisWeek: type === "week",
            showThisMonth: type === "month",
            dateRange: { start: "", end: "" },
        }));
    };

    const getUniqueJiraIds = () => {
        return [...new Set(worklogs.map((w) => w.jiraId))].sort();
    };

    // Export handlers
    const handleExportCSV = () => {
        const dataToExport = isMerged ? mergedData : filteredData;
        exportToCSV(dataToExport, isMerged);
    };

    const handleExportXLSX = () => {
        const dataToExport = isMerged ? mergedData : filteredData;
        exportToXLSX(dataToExport, isMerged);
    };

    return (
        <div
            className={`min-h-screen font-sans selection:bg-orange-500/30 selection:text-white transition-colors duration-500 ${
                isDarkMode
                    ? "bg-[#0a0a0a] text-white"
                    : "bg-orange-50/50 text-gray-900"
            }`}>
            <CursorFollower />

            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div
                    className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-blob ${
                        isDarkMode ? "bg-red-800" : "bg-red-400"
                    }`}></div>
                <div
                    className={`absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-blob animation-delay-2000 ${
                        isDarkMode ? "bg-orange-800" : "bg-orange-400"
                    }`}></div>
                <div
                    className={`absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-blob animation-delay-4000 ${
                        isDarkMode ? "bg-amber-800" : "bg-amber-400"
                    }`}></div>
                <div
                    className={`absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150`}></div>
            </div>

            <div className="relative z-10 flex h-screen overflow-hidden">
                {/* Sidebar */}
                <Sidebar
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    currentView={currentView}
                    setCurrentView={setCurrentView}
                    filters={filters}
                    setFilters={setFilters}
                    worklogs={worklogs}
                    getUniqueJiraIds={getUniqueJiraIds}
                    clearAllFilters={clearAllFilters}
                    setQuickFilter={setQuickFilter}
                    isDarkMode={isDarkMode}
                    theme={THEME}
                />

                {/* Main Content */}
                <main className="flex-1 h-full overflow-hidden flex flex-col relative">
                    {/* Header */}
                    <Header
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        isDarkMode={isDarkMode}
                        setIsDarkMode={setIsDarkMode}
                        handleFileUpload={handleFileUpload}
                        setCurrentEntry={setCurrentEntry}
                        setModalMode={setModalMode}
                        setIsModalOpen={setIsModalOpen}
                    />

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                        {/* Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <GlassStatCard
                                title="Total Time"
                                value={calculatedStats.totalTime}
                                subtitle={
                                    filters.dateRange.start ||
                                    filters.showToday ||
                                    filters.showThisWeek ||
                                    filters.showThisMonth
                                        ? "(Filtered)"
                                        : "(All Time)"
                                }
                                icon={<Clock />}
                                theme={THEME}
                                delay={0}
                                isDark={isDarkMode}
                            />
                            <GlassStatCard
                                title="Entries"
                                value={calculatedStats.entries}
                                icon={<Zap />}
                                theme={THEME}
                                delay={100}
                                isDark={isDarkMode}
                            />
                            <GlassStatCard
                                title="Projects"
                                value={calculatedStats.projects}
                                icon={<Briefcase />}
                                theme={THEME}
                                delay={200}
                                isDark={isDarkMode}
                            />
                            <GlassStatCard
                                title="Tickets"
                                value={calculatedStats.tickets}
                                icon={<Target />}
                                theme={THEME}
                                delay={300}
                                isDark={isDarkMode}
                            />
                        </div>

                        {/* Conditional View Rendering */}
                        {currentView === VIEW_MODES.DASHBOARD && (
                            <DashboardView
                                filteredData={filteredData}
                                mergedDataFull={mergedDataFull}
                                isMerged={isMerged}
                                setIsMerged={setIsMerged}
                                showOriginal={showOriginal}
                                setShowOriginal={setShowOriginal}
                                expandedRows={expandedRows}
                                setExpandedRows={setExpandedRows}
                                showColumnMenu={showColumnMenu}
                                setShowColumnMenu={setShowColumnMenu}
                                visibleColumns={visibleColumns}
                                toggleColumnVisibility={toggleColumnVisibility}
                                getVisibleColumns={getVisibleColumns}
                                columnWidths={columnWidths}
                                startResize={startResize}
                                formatDate={formatDate}
                                getJiraUrl={getJiraUrl}
                                setCurrentEntry={setCurrentEntry}
                                setModalMode={setModalMode}
                                setIsModalOpen={setIsModalOpen}
                                handleDelete={handleDelete}
                                exportToCSV={handleExportCSV}
                                exportToXLSX={handleExportXLSX}
                                isDarkMode={isDarkMode}
                                theme={THEME}
                                calculatedStats={calculatedStats}
                            />
                        )}

                        {currentView === VIEW_MODES.ANALYTICS && (
                            <AnalyticsView
                                analyticsData={analyticsData}
                                calculatedStats={calculatedStats}
                                isDarkMode={isDarkMode}
                                theme={THEME}
                            />
                        )}

                        {currentView === VIEW_MODES.CALENDAR && (
                            <CalendarView
                                calendarData={calendarData}
                                selectedCalendarDate={selectedCalendarDate}
                                setSelectedCalendarDate={
                                    setSelectedCalendarDate
                                }
                                formatDate={formatDate}
                                formatTime={formatTime}
                                parseTime={parseTime}
                                getJiraUrl={getJiraUrl}
                                isDarkMode={isDarkMode}
                                theme={THEME}
                            />
                        )}

                        {currentView === VIEW_MODES.PROJECTS && (
                            <ProjectsView
                                analyticsData={analyticsData}
                                worklogs={worklogs}
                                filteredData={filteredData}
                                formatTime={formatTime}
                                parseTime={parseTime}
                                isDarkMode={isDarkMode}
                                theme={THEME}
                            />
                        )}
                    </div>
                </main>
            </div>

            {/* Modal */}
            <Modal
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                modalMode={modalMode}
                currentEntry={currentEntry}
                handleSave={handleSave}
                isDarkMode={isDarkMode}
            />

            {/* Animations */}
            <style>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob { animation: blob 10s infinite; }
                .animation-delay-2000 { animation-delay: 2s; }
                .animation-delay-4000 { animation-delay: 4s; }

                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; opacity: 0; }

                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-scale-in { animation: scaleIn 0.3s ease-out forwards; }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }

                .scrollbar-thin::-webkit-scrollbar {
                    width: 6px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: transparent;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                }
                .scrollbar-thin:hover::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
