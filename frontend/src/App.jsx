import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import {
    LayoutDashboard,
    Plus,
    Download,
    Search,
    Moon,
    Sun,
    X,
    Calendar,
    Clock,
    Trash2,
    Edit2,
    Menu,
    ChevronDown,
    Merge,
    Split,
    ChevronRight,
    Zap,
    Activity,
    Layers,
    Briefcase,
    AlertCircle,
    Upload,
    Eye,
    EyeOff,
    ExternalLink,
    BarChart3,
    PieChart,
    TrendingUp,
    Filter,
    CalendarDays,
    FolderKanban,
    Timer,
    Target,
    Award,
} from "lucide-react";

// Base URL for API calls
const API_URL = "http://localhost:5000/api";

// ==========================================
// 🎨 THEME CONFIG (RED & ORANGE)
// ==========================================

const THEME = {
    gradient: "from-red-600 via-orange-500 to-amber-500",
    glass: "bg-orange-500/10 border-orange-200/20",
    text: "text-orange-400",
    accent: "bg-orange-500",
};

// Column definitions
const ALL_COLUMNS = [
    { key: "date", label: "Date", sortable: true, defaultVisible: true },
    { key: "jiraId", label: "Jira ID", sortable: true, defaultVisible: true },
    {
        key: "description",
        label: "Description",
        sortable: false,
        defaultVisible: true,
    },
    { key: "timeLogged", label: "Time", sortable: true, defaultVisible: true },
    { key: "status", label: "Status", sortable: true, defaultVisible: true },
    {
        key: "projectName",
        label: "Project",
        sortable: true,
        defaultVisible: true,
    },
    { key: "remarks", label: "Remarks", sortable: false, defaultVisible: true },
];

// View modes
const VIEW_MODES = {
    DASHBOARD: "dashboard",
    ANALYTICS: "analytics",
    CALENDAR: "calendar",
    PROJECTS: "projects",
};

// ==========================================
// 🖱️ CUSTOM CURSOR COMPONENT
// ==========================================
const CursorFollower = () => {
    const cursorRef = useRef(null);
    const followerRef = useRef(null);

    useEffect(() => {
        const moveCursor = (e) => {
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
            }
            if (followerRef.current) {
                setTimeout(() => {
                    if (followerRef.current)
                        followerRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
                }, 80);
            }
        };

        window.addEventListener("mousemove", moveCursor);
        return () => window.removeEventListener("mousemove", moveCursor);
    }, []);

    return (
        <>
            <div
                ref={cursorRef}
                className="fixed top-0 left-0 w-3 h-3 bg-white rounded-full mix-blend-difference pointer-events-none z-[9999] -mt-1.5 -ml-1.5 transition-transform duration-75 ease-out will-change-transform hidden md:block"
            />
            <div
                ref={followerRef}
                className="fixed top-0 left-0 w-8 h-8 border border-white/50 rounded-full mix-blend-difference pointer-events-none z-[9998] -mt-4 -ml-4 transition-transform duration-300 ease-out will-change-transform hidden md:block"
            />
        </>
    );
};

// ==========================================
// ⚛️ MAIN APP COMPONENT
// ==========================================
export default function App() {
    // State
    const [worklogs, setWorklogs] = useState([]);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isMerged, setIsMerged] = useState(false);
    const [expandedRows, setExpandedRows] = useState({});
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showColumnMenu, setShowColumnMenu] = useState(false);
    const [currentView, setCurrentView] = useState(VIEW_MODES.DASHBOARD);
    const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

    // Column visibility and widths
    const [visibleColumns, setVisibleColumns] = useState(() => {
        const saved = localStorage.getItem("visibleColumns");
        return saved
            ? JSON.parse(saved)
            : ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key);
    });

    const [columnWidths, setColumnWidths] = useState(() => {
        const saved = localStorage.getItem("columnWidths");
        return saved
            ? JSON.parse(saved)
            : {
                  date: 140,
                  jiraId: 140,
                  description: 300,
                  timeLogged: 120,
                  status: 130,
                  projectName: 180,
                  remarks: 200,
              };
    });

    // Save column preferences
    useEffect(() => {
        localStorage.setItem("visibleColumns", JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    useEffect(() => {
        localStorage.setItem("columnWidths", JSON.stringify(columnWidths));
    }, [columnWidths]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add");
    const [currentEntry, setCurrentEntry] = useState(null);

    // Filters - Enhanced with more options
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

    // ==========================================
    // 🔄 DATA FETCHING
    // ==========================================
    useEffect(() => {
        fetchWorklogs();
        fetchStats();
    }, []);

    const fetchWorklogs = async () => {
        try {
            const response = await axios.get(`${API_URL}/worklogs`);
            setWorklogs(response.data);
        } catch (error) {
            console.error("Error fetching worklogs:", error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_URL}/stats`);
            setStats(response.data);
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    // ==========================================
    // 🧠 LOGIC & UTILS
    // ==========================================

    // Format Helper
    const formatDate = (d) =>
        d
            ? new Date(d).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
              })
            : "N/A";

    // Calculate Time String to Minutes
    const parseTime = (timeStr) => {
        if (!timeStr) return 0;
        let total = 0;
        const h = timeStr.match(/(\d+)h/);
        const m = timeStr.match(/(\d+)m/);
        if (h) total += parseInt(h[1]) * 60;
        if (m) total += parseInt(m[1]);
        return total;
    };

    // Convert Minutes to Time String
    const formatTime = (mins) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m > 0 ? `${m}m` : ""}`.trim();
    };

    // Get date range helpers
    const getToday = () => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    };

    const getWeekStart = () => {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diff));
        return monday.toISOString().split("T")[0];
    };

    const getMonthStart = () => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1)
            .toISOString()
            .split("T")[0];
    };

    // Merge Logic
    const mergedData = useMemo(() => {
        if (!isMerged) return [];
        const grouped = {};

        const sortedRaw = [...worklogs].sort(
            (a, b) => new Date(a.date) - new Date(b.date),
        );

        sortedRaw.forEach((log) => {
            const key = `${log.jiraId}_${log.projectName}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(log);
        });

        return Object.values(grouped).map((group, idx) => {
            const totalMinutes = group.reduce(
                (acc, curr) => acc + parseTime(curr.timeLogged),
                0,
            );
            return {
                id: `merged_${idx}`,
                no: idx + 1,
                jiraId: group[0].jiraId,
                projectName: group[0].projectName,
                description: group[0].description,
                startDate: group[0].date,
                endDate: group[group.length - 1].date,
                totalTime: formatTime(totalMinutes),
                entryCount: group.length,
                originalEntries: group,
            };
        });
    }, [worklogs, isMerged]);

    // Filter Logic - Enhanced
    const filteredData = useMemo(() => {
        let data = isMerged ? mergedData : worklogs;

        // Search filter
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            data = data.filter((item) =>
                Object.values(item).some((val) =>
                    String(val).toLowerCase().includes(lowerQ),
                ),
            );
        }

        // Project filter
        if (filters.project) {
            data = data.filter((item) => item.projectName === filters.project);
        }

        // Status filter
        if (filters.status && !isMerged) {
            data = data.filter((item) => item.status === filters.status);
        }

        // JIRA ID filter
        if (filters.jiraId) {
            data = data.filter((item) => item.jiraId === filters.jiraId);
        }

        // Date filters
        if (filters.showToday) {
            const today = getToday();
            data = data.filter((item) => {
                const itemDate = isMerged ? item.startDate : item.date;
                return new Date(itemDate).toISOString().split("T")[0] === today;
            });
        } else if (filters.showThisWeek) {
            const weekStart = getWeekStart();
            data = data.filter((item) => {
                const itemDate = isMerged ? item.startDate : item.date;
                return new Date(itemDate) >= new Date(weekStart);
            });
        } else if (filters.showThisMonth) {
            const monthStart = getMonthStart();
            data = data.filter((item) => {
                const itemDate = isMerged ? item.startDate : item.date;
                return new Date(itemDate) >= new Date(monthStart);
            });
        }

        // Custom date range
        if (filters.dateRange.start) {
            data = data.filter((item) => {
                const date = isMerged ? item.startDate : item.date;
                return new Date(date) >= new Date(filters.dateRange.start);
            });
        }

        if (filters.dateRange.end) {
            data = data.filter((item) => {
                const date = isMerged ? item.endDate : item.date;
                return new Date(date) <= new Date(filters.dateRange.end);
            });
        }

        return data;
    }, [worklogs, mergedData, isMerged, searchQuery, filters]);

    // Stats calculation for filtered data
    const calculatedStats = useMemo(() => {
        const totalMinutes = filteredData.reduce((acc, curr) => {
            const time = isMerged ? curr.totalTime : curr.timeLogged;
            return acc + parseTime(time);
        }, 0);

        const uniqueProjects = new Set(filteredData.map((w) => w.projectName))
            .size;
        const uniqueJiraIds = new Set(filteredData.map((w) => w.jiraId)).size;

        return {
            totalTime: formatTime(totalMinutes),
            totalMinutes: totalMinutes,
            entries: filteredData.length,
            projects: uniqueProjects,
            tickets: uniqueJiraIds,
        };
    }, [filteredData, isMerged]);

    // Analytics data
    const analyticsData = useMemo(() => {
        // Project-wise breakdown
        const projectBreakdown = {};
        filteredData.forEach((item) => {
            const project = item.projectName;
            const time = isMerged ? item.totalTime : item.timeLogged;
            if (!projectBreakdown[project]) {
                projectBreakdown[project] = {
                    time: 0,
                    entries: 0,
                    tickets: new Set(),
                };
            }
            projectBreakdown[project].time += parseTime(time);
            projectBreakdown[project].entries += isMerged ? item.entryCount : 1;
            projectBreakdown[project].tickets.add(item.jiraId);
        });

        // Status breakdown
        const statusBreakdown = {};
        const dataToUse = isMerged
            ? filteredData.flatMap((item) => item.originalEntries)
            : filteredData;

        dataToUse.forEach((item) => {
            if (!statusBreakdown[item.status]) {
                statusBreakdown[item.status] = { count: 0, time: 0 };
            }
            statusBreakdown[item.status].count++;
            statusBreakdown[item.status].time += parseTime(item.timeLogged);
        });

        // Daily breakdown
        const dailyBreakdown = {};
        dataToUse.forEach((item) => {
            const date = formatDate(item.date);
            if (!dailyBreakdown[date]) {
                dailyBreakdown[date] = 0;
            }
            dailyBreakdown[date] += parseTime(item.timeLogged);
        });

        return {
            projectBreakdown: Object.entries(projectBreakdown)
                .map(([name, data]) => ({
                    name,
                    time: data.time,
                    formattedTime: formatTime(data.time),
                    entries: data.entries,
                    tickets: data.tickets.size,
                    percentage:
                        calculatedStats.totalMinutes > 0
                            ? (
                                  (data.time / calculatedStats.totalMinutes) *
                                  100
                              ).toFixed(1)
                            : 0,
                }))
                .sort((a, b) => b.time - a.time),

            statusBreakdown: Object.entries(statusBreakdown).map(
                ([status, data]) => ({
                    status,
                    count: data.count,
                    time: data.time,
                    formattedTime: formatTime(data.time),
                }),
            ),

            dailyBreakdown: Object.entries(dailyBreakdown)
                .map(([date, time]) => ({
                    date,
                    time,
                    formattedTime: formatTime(time),
                }))
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 7),
        };
    }, [filteredData, calculatedStats, isMerged]);

    // Calendar data
    const calendarData = useMemo(() => {
        const dataToUse = isMerged
            ? filteredData.flatMap((item) => item.originalEntries)
            : filteredData;

        const grouped = {};
        dataToUse.forEach((item) => {
            const date = new Date(item.date).toISOString().split("T")[0];
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(item);
        });

        return grouped;
    }, [filteredData, isMerged]);

    // ==========================================
    // 🔧 CRUD OPERATIONS
    // ==========================================
    const handleSave = async (entry) => {
        try {
            if (modalMode === "add") {
                await axios.post(`${API_URL}/worklogs`, entry);
            } else {
                await axios.put(`${API_URL}/worklogs/${entry.id}`, entry);
            }
            fetchWorklogs();
            fetchStats();
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving worklog:", error);
            alert("Failed to save worklog");
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this entry?")) {
            try {
                await axios.delete(`${API_URL}/worklogs/${id}`);
                fetchWorklogs();
                fetchStats();
            } catch (error) {
                console.error("Error deleting worklog:", error);
            }
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const fd = new FormData();
        fd.append("file", file);
        try {
            await axios.post(`${API_URL}/upload`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            fetchWorklogs();
            fetchStats();
            alert("Uploaded successfully!");
        } catch (error) {
            alert("Upload failed");
        }
    };

    // ==========================================
    // 📊 EXPORT FUNCTIONS
    // ==========================================
    const exportToCSV = () => {
        const dataToExport = isMerged ? mergedData : filteredData;

        if (isMerged) {
            const headers = [
                "No.",
                "JIRA ID",
                "Project",
                "Description",
                "Start Date",
                "End Date",
                "Total Time",
                "Entries",
            ];
            const rows = dataToExport.map((item) => [
                item.no,
                item.jiraId,
                item.projectName,
                `"${item.description.replace(/"/g, '""')}"`,
                formatDate(item.startDate),
                formatDate(item.endDate),
                item.totalTime,
                item.entryCount,
            ]);
            const csvContent = [
                headers.join(","),
                ...rows.map((r) => r.join(",")),
            ].join("\n");
            downloadFile(csvContent, "text/csv", "WorkLogs_Merged.csv");
        } else {
            const headers = [
                "Date",
                "JIRA ID",
                "Project",
                "Description",
                "Time",
                "Status",
                "Remarks",
            ];
            const rows = dataToExport.map((item) => [
                formatDate(item.date),
                item.jiraId,
                item.projectName,
                `"${item.description.replace(/"/g, '""')}"`,
                item.timeLogged,
                item.status,
                `"${(item.remarks || "").replace(/"/g, '""')}"`,
            ]);
            const csvContent = [
                headers.join(","),
                ...rows.map((r) => r.join(",")),
            ].join("\n");
            downloadFile(csvContent, "text/csv", "WorkLogs.csv");
        }
    };

    const exportToXLSX = () => {
        const dataToExport = isMerged ? mergedData : filteredData;

        const worksheetData = dataToExport.map((item) => {
            if (isMerged) {
                return {
                    "No.": item.no,
                    "JIRA ID": item.jiraId,
                    Project: item.projectName,
                    Description: item.description,
                    "Start Date": formatDate(item.startDate),
                    "End Date": formatDate(item.endDate),
                    "Total Time": item.totalTime,
                    Entries: item.entryCount,
                };
            } else {
                return {
                    Date: formatDate(item.date),
                    "JIRA ID": item.jiraId,
                    Project: item.projectName,
                    Description: item.description,
                    Time: item.timeLogged,
                    Status: item.status,
                    Remarks: item.remarks || "",
                };
            }
        });

        const ws = XLSX.utils.json_to_sheet(worksheetData);

        dataToExport.forEach((item, index) => {
            const cellRef = `B${index + 2}`;
            const jiraUrl = `https://www.jira.com/${item.jiraId}`;

            if (!ws[cellRef]) ws[cellRef] = {};
            ws[cellRef].l = {
                Target: jiraUrl,
                Tooltip: `Open ${item.jiraId} in JIRA`,
            };
        });

        ws["!cols"] = [
            { wch: 12 },
            { wch: 15 },
            { wch: 20 },
            { wch: 40 },
            { wch: 12 },
            { wch: 12 },
            { wch: 30 },
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Worklogs");
        XLSX.writeFile(wb, isMerged ? "WorkLogs_Merged.xlsx" : "WorkLogs.xlsx");
    };

    const downloadFile = (content, type, filename) => {
        const blob = new Blob([content], { type: `${type};charset=utf-8;` });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ==========================================
    // 📏 COLUMN RESIZING
    // ==========================================
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

    const getJiraUrl = (jiraId) => {
        return `https://www.jira.com/${jiraId}`;
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

    // Get unique values for filters
    const getUniqueJiraIds = () => {
        return [...new Set(worklogs.map((w) => w.jiraId))].sort();
    };

    // ==========================================
    // 🖼️ RENDER
    // ==========================================
    return (
        <div
            className={`min-h-screen font-sans selection:bg-orange-500/30 selection:text-white transition-colors duration-500 ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-orange-50/50 text-gray-900"}`}>
            <CursorFollower />

            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div
                    className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-blob ${isDarkMode ? "bg-red-800" : "bg-red-400"}`}></div>
                <div
                    className={`absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-blob animation-delay-2000 ${isDarkMode ? "bg-orange-800" : "bg-orange-400"}`}></div>
                <div
                    className={`absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-blob animation-delay-4000 ${isDarkMode ? "bg-amber-800" : "bg-amber-400"}`}></div>
                <div
                    className={`absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150`}></div>
            </div>

            <div className="relative z-10 flex h-screen overflow-hidden">
                {/* ==================== GLASS SIDEBAR ==================== */}
                <aside
                    className={`${isSidebarOpen ? "w-80" : "w-20"} transition-all duration-500 ease-in-out h-full border-r ${isDarkMode ? "border-white/10 bg-black/20" : "border-orange-900/5 bg-white/40"} backdrop-blur-xl flex flex-col justify-between`}>
                    <div className="flex-1 overflow-y-auto scrollbar-thin">
                        <div className="h-20 flex items-center justify-center border-b border-white/5">
                            <div
                                className={`flex items-center gap-3 font-bold text-xl tracking-tight ${isSidebarOpen ? "px-6" : "px-0"}`}>
                                <div
                                    className={`p-2 rounded-xl bg-gradient-to-tr ${THEME.gradient} shadow-lg shadow-orange-500/20`}>
                                    <LayoutDashboard className="w-5 h-5 text-white" />
                                </div>
                                {isSidebarOpen && (
                                    <span
                                        className={`bg-clip-text text-transparent bg-gradient-to-r ${isDarkMode ? "from-white to-white/60" : "from-gray-900 to-gray-600"}`}>
                                        WorkLog Pro
                                    </span>
                                )}
                            </div>
                        </div>

                        <nav className="p-4 space-y-2">
                            <SidebarItem
                                icon={<Layers />}
                                label="Dashboard"
                                active={currentView === VIEW_MODES.DASHBOARD}
                                isOpen={isSidebarOpen}
                                theme={THEME}
                                isDark={isDarkMode}
                                onClick={() =>
                                    setCurrentView(VIEW_MODES.DASHBOARD)
                                }
                            />
                            <SidebarItem
                                icon={<BarChart3 />}
                                label="Analytics"
                                active={currentView === VIEW_MODES.ANALYTICS}
                                isOpen={isSidebarOpen}
                                theme={THEME}
                                isDark={isDarkMode}
                                onClick={() =>
                                    setCurrentView(VIEW_MODES.ANALYTICS)
                                }
                            />
                            <SidebarItem
                                icon={<CalendarDays />}
                                label="Calendar"
                                active={currentView === VIEW_MODES.CALENDAR}
                                isOpen={isSidebarOpen}
                                theme={THEME}
                                isDark={isDarkMode}
                                onClick={() =>
                                    setCurrentView(VIEW_MODES.CALENDAR)
                                }
                            />
                            <SidebarItem
                                icon={<FolderKanban />}
                                label="Projects"
                                active={currentView === VIEW_MODES.PROJECTS}
                                isOpen={isSidebarOpen}
                                theme={THEME}
                                isDark={isDarkMode}
                                onClick={() =>
                                    setCurrentView(VIEW_MODES.PROJECTS)
                                }
                            />
                        </nav>

                        {isSidebarOpen && (
                            <div className="px-6 py-6">
                                <div
                                    className={`text-xs font-semibold uppercase mb-4 tracking-wider ${isDarkMode ? "text-white/40" : "text-gray-500/80"}`}>
                                    <Filter className="w-3 h-3 inline mr-2" />
                                    Smart Filters
                                </div>

                                {/* Quick Date Filters */}
                                <div className="space-y-2 mb-4">
                                    <button
                                        onClick={() => setQuickFilter("today")}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                            filters.showToday
                                                ? `bg-gradient-to-r ${THEME.gradient} text-white shadow-lg`
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
                                                ? `bg-gradient-to-r ${THEME.gradient} text-white shadow-lg`
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
                                                ? `bg-gradient-to-r ${THEME.gradient} text-white shadow-lg`
                                                : isDarkMode
                                                  ? "bg-white/5 hover:bg-white/10 text-white/70"
                                                  : "bg-white hover:bg-gray-50 text-gray-600"
                                        }`}>
                                        🗓️ This Month
                                    </button>
                                </div>

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
                                                worklogs.map(
                                                    (w) => w.projectName,
                                                ),
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
                                        options={[
                                            "Done",
                                            "In Progress",
                                            "Pending",
                                            "Blocked",
                                        ]}
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

                                    <div className="space-y-2">
                                        <label
                                            className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "text-white/30" : "text-gray-400"}`}>
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
                                            className={`w-full appearance-none border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 transition-all ${isDarkMode ? "bg-white/5 border-white/10 hover:border-white/20 text-white/80 focus:ring-white/20" : "bg-white border-gray-200 hover:border-orange-300 text-gray-700 focus:ring-orange-200"}`}
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
                                            className={`w-full appearance-none border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 transition-all ${isDarkMode ? "bg-white/5 border-white/10 hover:border-white/20 text-white/80 focus:ring-white/20" : "bg-white border-gray-200 hover:border-orange-300 text-gray-700 focus:ring-orange-200"}`}
                                        />
                                    </div>

                                    <button
                                        onClick={clearAllFilters}
                                        className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors ${isDarkMode ? "bg-red-500/20 hover:bg-red-500/30 text-red-300" : "bg-red-50 hover:bg-red-100 text-red-600"}`}>
                                        Clear All Filters
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-white/5">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className={`w-full p-3 rounded-xl transition-colors flex items-center justify-center ${isDarkMode ? "hover:bg-white/5 text-white/60 hover:text-white" : "hover:bg-orange-500/5 text-gray-500 hover:text-gray-900"}`}>
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                </aside>

                {/* ==================== MAIN CONTENT ==================== */}
                <main className="flex-1 h-full overflow-hidden flex flex-col relative">
                    {/* Header */}
                    <header
                        className={`h-20 px-8 flex items-center justify-between backdrop-blur-md border-b ${isDarkMode ? "border-white/5 bg-black/10" : "border-orange-900/5 bg-white/30"}`}>
                        <div
                            className={`flex items-center gap-4 border rounded-full px-4 py-2 w-96 transition-all duration-300 ${isDarkMode ? "bg-white/5 border-white/10 focus-within:bg-white/10 focus-within:border-white/20" : "bg-white/40 border-orange-900/5 focus-within:bg-white/60 focus-within:border-orange-900/10 shadow-sm"}`}>
                            <Search
                                className={`w-4 h-4 ${isDarkMode ? "text-white/40" : "text-gray-400"}`}
                            />
                            <input
                                type="text"
                                placeholder="Search logs, tickets, projects..."
                                className={`bg-transparent border-none outline-none text-sm w-full ${isDarkMode ? "placeholder:text-white/30" : "placeholder:text-gray-400 text-gray-800"}`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className={`p-2.5 rounded-full border transition-colors ${isDarkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-gray-200 hover:bg-gray-50 text-gray-600 shadow-sm"}`}>
                                {isDarkMode ? (
                                    <Sun className="w-4 h-4" />
                                ) : (
                                    <Moon className="w-4 h-4" />
                                )}
                            </button>

                            <label
                                className={`p-2.5 rounded-full border transition-colors cursor-pointer ${isDarkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-gray-200 hover:bg-gray-50 text-gray-600 shadow-sm"}`}>
                                <Upload className="w-4 h-4" />
                                <input
                                    type="file"
                                    onChange={handleFileUpload}
                                    accept=".xlsx,.csv"
                                    className="hidden"
                                />
                            </label>

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

                    {/* Dashboard Content */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                        {/* Stats Row - Show filtered time */}
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
                                isMerged={isMerged}
                                setIsMerged={setIsMerged}
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
                                exportToCSV={exportToCSV}
                                exportToXLSX={exportToXLSX}
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

            {/* ==================== GLASS MODAL ==================== */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                        onClick={() => setIsModalOpen(false)}></div>
                    <div
                        className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden animate-scale-in ${isDarkMode ? "bg-[#1a1a1a]/90 border-white/10" : "bg-white/95 border-gray-200"} backdrop-blur-xl`}>
                        <div
                            className={`p-6 border-b flex items-center justify-between bg-gradient-to-r ${THEME.gradient} ${isDarkMode ? "bg-opacity-10 border-white/10" : "bg-opacity-90 border-transparent"}`}>
                            <h3
                                className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-white"}`}>
                                {modalMode === "add" ? (
                                    <Plus className="w-5 h-5" />
                                ) : (
                                    <Edit2 className="w-5 h-5" />
                                )}
                                {modalMode === "add"
                                    ? "New Entry"
                                    : "Edit Entry"}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

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
                                            : new Date()
                                                  .toISOString()
                                                  .split("T")[0]
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

                            <GlassInput
                                name="projectName"
                                label="Project"
                                placeholder="Web App..."
                                defaultValue={currentEntry?.projectName}
                                isDark={isDarkMode}
                                required
                            />

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
                                        className={`text-xs font-semibold uppercase ${isDarkMode ? "text-white/50" : "text-gray-500"}`}>
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        defaultValue={
                                            currentEntry?.status ||
                                            "In Progress"
                                        }
                                        className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all ${isDarkMode ? "bg-black/20 border border-white/10 text-white focus:border-white/30 focus:ring-white/20" : "bg-gray-50 border border-gray-200 text-gray-900 focus:border-orange-500 focus:ring-orange-200"}`}>
                                        <option value="In Progress">
                                            In Progress
                                        </option>
                                        <option value="Done">Done</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Blocked">Blocked</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label
                                    className={`text-xs font-semibold uppercase ${isDarkMode ? "text-white/50" : "text-gray-500"}`}>
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    rows="3"
                                    defaultValue={currentEntry?.description}
                                    required
                                    className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all resize-none ${isDarkMode ? "bg-black/20 border border-white/10 text-white focus:border-white/30 focus:ring-white/20" : "bg-gray-50 border border-gray-200 text-gray-900 focus:border-orange-500 focus:ring-orange-200"}`}></textarea>
                            </div>

                            <GlassInput
                                name="remarks"
                                label="Remarks (Optional)"
                                defaultValue={currentEntry?.remarks}
                                isDark={isDarkMode}
                            />

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${isDarkMode ? "hover:bg-white/5 text-white/70" : "hover:bg-gray-100 text-gray-600"}`}>
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
            )}

            {/* Styles for animation */}
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

// ==========================================
// 🧱 SUB-COMPONENTS
// ==========================================

const SidebarItem = ({
    icon,
    label,
    active,
    isOpen,
    theme,
    isDark,
    onClick,
}) => (
    <div
        onClick={onClick}
        className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-300 group ${active ? `bg-gradient-to-r ${theme.gradient} shadow-lg shadow-orange-500/20` : isDark ? "hover:bg-white/5" : "hover:bg-orange-50"}`}>
        <div
            className={`${active ? "text-white" : isDark ? "text-white/50 group-hover:text-white" : "text-gray-400 group-hover:text-gray-800"}`}>
            {React.cloneElement(icon, { size: 20 })}
        </div>
        {isOpen && (
            <span
                className={`font-medium text-sm ${active ? "text-white" : isDark ? "text-white/60 group-hover:text-white" : "text-gray-500 group-hover:text-gray-900"}`}>
                {label}
            </span>
        )}
    </div>
);

const GlassStatCard = ({
    title,
    value,
    subtitle,
    icon,
    theme,
    delay,
    isDark,
}) => (
    <div
        className={`relative overflow-hidden rounded-3xl p-6 border backdrop-blur-md group transition-all duration-300 animate-fade-in-up ${isDark ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-white/40 bg-white/60 hover:bg-white/80 shadow-xl shadow-orange-500/5"}`}
        style={{ animationDelay: `${delay}ms` }}>
        <div
            className={`absolute top-0 right-0 p-32 bg-gradient-to-br ${theme.gradient} opacity-5 blur-2xl rounded-full group-hover:opacity-10 transition-opacity`}></div>
        <div className="relative z-10 flex justify-between items-start">
            <div>
                <p
                    className={`text-sm font-medium uppercase tracking-wider ${isDark ? "text-white/40" : "text-gray-500"}`}>
                    {title}
                </p>
                <h4
                    className={`text-3xl font-bold mt-2 ${isDark ? "text-white/90" : "text-gray-800"}`}>
                    {value}
                </h4>
                {subtitle && (
                    <p
                        className={`text-xs mt-1 ${isDark ? "text-white/30" : "text-gray-400"}`}>
                        {subtitle}
                    </p>
                )}
            </div>
            <div
                className={`p-3 rounded-2xl bg-gradient-to-br ${theme.gradient} text-white shadow-lg`}>
                {icon}
            </div>
        </div>
    </div>
);

const GlassInput = ({ label, isDark, ...props }) => (
    <div className="space-y-1">
        <label
            className={`text-xs font-semibold uppercase ${isDark ? "text-white/50" : "text-gray-500"}`}>
            {label}
        </label>
        <input
            className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all ${isDark ? "bg-black/20 border border-white/10 text-white placeholder:text-white/20 focus:border-white/30 focus:ring-white/20" : "bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-200"}`}
            {...props}
        />
    </div>
);

const GlassSelect = ({ label, options, value, onChange, isDark }) => (
    <div className="space-y-1.5">
        <label
            className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-white/30" : "text-gray-400"}`}>
            {label}
        </label>
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full appearance-none border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 cursor-pointer transition-all ${isDark ? "bg-white/5 border-white/10 hover:border-white/20 text-white/80 focus:ring-white/20" : "bg-white border-gray-200 hover:border-orange-300 text-gray-700 focus:ring-orange-200"}`}>
                <option
                    value=""
                    className={isDark ? "bg-gray-900" : "bg-white"}>
                    All {label}s
                </option>
                {options.map((opt) => (
                    <option
                        key={opt}
                        value={opt}
                        className={isDark ? "bg-gray-900" : "bg-white"}>
                        {opt}
                    </option>
                ))}
            </select>
            <ChevronDown
                className={`absolute right-3 top-2.5 w-3 h-3 pointer-events-none ${isDark ? "text-white/30" : "text-gray-400"}`}
            />
        </div>
    </div>
);

const StatusPill = ({ status, size = "md" }) => {
    const config = {
        Done: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
        "In Progress": "bg-blue-500/20 text-blue-600 border-blue-500/30",
        Pending: "bg-amber-500/20 text-amber-600 border-amber-500/30",
        Blocked: "bg-rose-500/20 text-rose-600 border-rose-500/30",
    };
    const c =
        config[status] || "bg-gray-500/20 text-gray-500 border-gray-500/30";
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full border ${c} ${size === "sm" ? "text-[10px]" : "text-xs"} font-medium`}>
            {status}
        </span>
    );
};

// Dashboard View Component
const DashboardView = ({
    filteredData,
    isMerged,
    setIsMerged,
    expandedRows,
    setExpandedRows,
    showColumnMenu,
    setShowColumnMenu,
    visibleColumns,
    toggleColumnVisibility,
    getVisibleColumns,
    columnWidths,
    startResize,
    formatDate,
    getJiraUrl,
    setCurrentEntry,
    setModalMode,
    setIsModalOpen,
    handleDelete,
    exportToCSV,
    exportToXLSX,
    isDarkMode,
    theme,
    calculatedStats,
}) => (
    <div
        className={`rounded-3xl border overflow-hidden backdrop-blur-xl transition-colors duration-500 ${isDarkMode ? "bg-black/40 border-white/10" : "bg-white/60 border-white/40 shadow-xl shadow-orange-500/5"}`}>
        <div className="p-6 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <h2
                    className={`text-xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Recent Worklogs
                </h2>
                <span
                    className={`px-3 py-1 rounded-full border text-xs font-mono ${isDarkMode ? "bg-white/5 border-white/10 text-white/60" : "bg-orange-50 border-orange-100 text-orange-600"}`}>
                    {filteredData.length} records • Time:{" "}
                    {calculatedStats.totalTime}
                </span>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative">
                    <button
                        onClick={() => setShowColumnMenu(!showColumnMenu)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-300 ${isDarkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                        {showColumnMenu ? (
                            <EyeOff className="w-4 h-4" />
                        ) : (
                            <Eye className="w-4 h-4" />
                        )}
                        Columns
                    </button>

                    {showColumnMenu && (
                        <div
                            className={`absolute right-0 mt-2 w-48 rounded-xl border shadow-xl z-50 ${isDarkMode ? "bg-slate-900/95 border-white/10" : "bg-white border-gray-200"} backdrop-blur-xl`}>
                            <div className="p-2 space-y-1">
                                {ALL_COLUMNS.map((col) => (
                                    <label
                                        key={col.key}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
                                        <input
                                            type="checkbox"
                                            checked={visibleColumns.includes(
                                                col.key,
                                            )}
                                            onChange={() =>
                                                toggleColumnVisibility(col.key)
                                            }
                                            className="rounded"
                                        />
                                        <span
                                            className={`text-sm ${isDarkMode ? "text-white/80" : "text-gray-700"}`}>
                                            {col.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => {
                        setIsMerged(!isMerged);
                        setExpandedRows({});
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-300 ${isMerged ? `bg-orange-500/20 border-orange-500/50 text-orange-500` : isDarkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    {isMerged ? (
                        <Split className="w-4 h-4" />
                    ) : (
                        <Merge className="w-4 h-4" />
                    )}
                    {isMerged ? "Unmerge" : "Merge"}
                </button>
                <button
                    onClick={exportToCSV}
                    className={`p-2 rounded-lg border transition-colors ${isDarkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    title="CSV">
                    <Download className="w-4 h-4" />
                </button>
                <button
                    onClick={exportToXLSX}
                    className={`p-2 rounded-lg border transition-colors ${isDarkMode ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    title="Excel">
                    <Download className="w-4 h-4" />
                </button>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table
                className="w-full text-left text-sm"
                style={{ tableLayout: "fixed" }}>
                <thead
                    className={`${isDarkMode ? "bg-white/5 text-white/50" : "bg-orange-50/50 text-gray-500"} text-xs uppercase tracking-wider font-medium sticky top-0 z-20`}>
                    <tr>
                        {isMerged && <th className="p-4 w-12"></th>}
                        {getVisibleColumns().map((col) => (
                            <th
                                key={col.key}
                                className="p-4 relative group"
                                style={{ width: columnWidths[col.key] }}>
                                <div className="flex items-center justify-between">
                                    <span>{col.label}</span>
                                    <div
                                        onMouseDown={(e) =>
                                            startResize(e, col.key)
                                        }
                                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-orange-500 transition-colors"
                                    />
                                </div>
                            </th>
                        ))}
                        <th className="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody
                    className={`divide-y ${isDarkMode ? "divide-white/5" : "divide-gray-100"}`}>
                    {filteredData.length === 0 ? (
                        <tr>
                            <td
                                colSpan={getVisibleColumns().length + 2}
                                className={`p-12 text-center ${isDarkMode ? "text-white/30" : "text-gray-400"}`}>
                                <div className="flex flex-col items-center justify-center gap-3">
                                    <AlertCircle className="w-10 h-10" />
                                    <p>No logs found</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        filteredData.map((item, idx) => (
                            <React.Fragment key={item.id}>
                                <tr
                                    className={`group transition-all duration-200 cursor-default animate-fade-in-up ${isDarkMode ? "hover:bg-white/5" : "hover:bg-orange-50/30"}`}
                                    style={{ animationDelay: `${idx * 50}ms` }}>
                                    {isMerged && (
                                        <td className="p-4">
                                            <button
                                                onClick={() =>
                                                    setExpandedRows((prev) => ({
                                                        ...prev,
                                                        [item.id]:
                                                            !prev[item.id],
                                                    }))
                                                }
                                                className={`p-1 rounded-md transition-colors ${isDarkMode ? "hover:bg-white/10 text-white/60" : "hover:bg-gray-100 text-gray-400"}`}>
                                                {expandedRows[item.id] ? (
                                                    <ChevronDown className="w-4 h-4" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4" />
                                                )}
                                            </button>
                                        </td>
                                    )}

                                    {visibleColumns.includes("date") && (
                                        <td
                                            className={`p-4 font-medium truncate ${isDarkMode ? "text-white/90" : "text-gray-900"}`}
                                            style={{
                                                width: columnWidths.date,
                                            }}>
                                            {formatDate(
                                                isMerged
                                                    ? item.startDate
                                                    : item.date,
                                            )}
                                            {isMerged && (
                                                <div
                                                    className={`text-[10px] ${isDarkMode ? "text-white/40" : "text-gray-400"}`}>
                                                    to{" "}
                                                    {formatDate(item.endDate)}
                                                </div>
                                            )}
                                        </td>
                                    )}

                                    {visibleColumns.includes("jiraId") && (
                                        <td
                                            className="p-4"
                                            style={{
                                                width: columnWidths.jiraId,
                                            }}>
                                            <a
                                                href={getJiraUrl(item.jiraId)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded font-mono text-xs transition-colors ${isDarkMode ? "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-orange-400" : "bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-600"}`}>
                                                {item.jiraId}
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </td>
                                    )}

                                    {visibleColumns.includes("description") && (
                                        <td
                                            className={`p-4 truncate ${isDarkMode ? "text-white/80" : "text-gray-600"}`}
                                            style={{
                                                width: columnWidths.description,
                                            }}
                                            title={item.description}>
                                            {item.description}
                                            {isMerged && (
                                                <span
                                                    className={`ml-2 text-xs ${isDarkMode ? "text-white/40" : "text-gray-400"}`}>
                                                    ({item.entryCount} entries)
                                                </span>
                                            )}
                                        </td>
                                    )}

                                    {visibleColumns.includes("timeLogged") && (
                                        <td
                                            className={`p-4 font-mono truncate ${isDarkMode ? "text-white/90" : "text-gray-800"}`}
                                            style={{
                                                width: columnWidths.timeLogged,
                                            }}>
                                            {isMerged
                                                ? item.totalTime
                                                : item.timeLogged}
                                        </td>
                                    )}

                                    {!isMerged &&
                                        visibleColumns.includes("status") && (
                                            <td
                                                className="p-4"
                                                style={{
                                                    width: columnWidths.status,
                                                }}>
                                                <StatusPill
                                                    status={item.status}
                                                />
                                            </td>
                                        )}

                                    {visibleColumns.includes("projectName") && (
                                        <td
                                            className="p-4 truncate"
                                            style={{
                                                width: columnWidths.projectName,
                                            }}
                                            title={item.projectName}>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.5)]`}></div>
                                                <span
                                                    className={
                                                        isDarkMode
                                                            ? ""
                                                            : "text-gray-700"
                                                    }>
                                                    {item.projectName}
                                                </span>
                                            </div>
                                        </td>
                                    )}

                                    {!isMerged &&
                                        visibleColumns.includes("remarks") && (
                                            <td
                                                className={`p-4 text-xs truncate ${isDarkMode ? "text-white/60" : "text-gray-500"}`}
                                                style={{
                                                    width: columnWidths.remarks,
                                                }}
                                                title={item.remarks}>
                                                {item.remarks || "—"}
                                            </td>
                                        )}

                                    <td className="p-4 text-right w-24">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!isMerged && (
                                                <button
                                                    onClick={() => {
                                                        setCurrentEntry(item);
                                                        setModalMode("edit");
                                                        setIsModalOpen(true);
                                                    }}
                                                    className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-blue-500/20 text-blue-300" : "hover:bg-blue-50 text-blue-600"}`}>
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() =>
                                                    handleDelete(item.id)
                                                }
                                                className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-red-500/20 text-red-300" : "hover:bg-red-50 text-red-600"}`}>
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                {isMerged && expandedRows[item.id] && (
                                    <tr
                                        className={`${isDarkMode ? "bg-white/5" : "bg-gray-50"} animate-fade-in`}>
                                        <td
                                            colSpan={
                                                getVisibleColumns().length + 2
                                            }
                                            className="p-0">
                                            <div className="p-4 pl-16 grid gap-2">
                                                {item.originalEntries.map(
                                                    (sub, i) => (
                                                        <div
                                                            key={i}
                                                            className={`flex items-center justify-between p-3 rounded-lg border text-sm ${isDarkMode ? "bg-black/20 border-white/5" : "bg-white border-gray-200"}`}>
                                                            <div className="flex gap-4 flex-1">
                                                                <span
                                                                    className={`w-24 font-mono text-xs ${isDarkMode ? "text-white/40" : "text-gray-400"}`}>
                                                                    {formatDate(
                                                                        sub.date,
                                                                    )}
                                                                </span>
                                                                <a
                                                                    href={getJiraUrl(
                                                                        sub.jiraId,
                                                                    )}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-xs transition-colors ${isDarkMode ? "bg-white/5 border border-white/10 text-white/70 hover:text-orange-400" : "bg-gray-100 text-gray-600 hover:text-orange-600"}`}>
                                                                    {sub.jiraId}
                                                                    <ExternalLink className="w-2.5 h-2.5" />
                                                                </a>
                                                                <span
                                                                    className={
                                                                        isDarkMode
                                                                            ? "text-white/80"
                                                                            : "text-gray-700"
                                                                    }>
                                                                    {
                                                                        sub.description
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="flex gap-4 items-center">
                                                                <span
                                                                    className={`font-mono text-xs ${isDarkMode ? "text-white/60" : "text-gray-500"}`}>
                                                                    {
                                                                        sub.timeLogged
                                                                    }
                                                                </span>
                                                                <StatusPill
                                                                    status={
                                                                        sub.status
                                                                    }
                                                                    size="sm"
                                                                />
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

// Analytics View Component
const AnalyticsView = ({
    analyticsData,
    calculatedStats,
    isDarkMode,
    theme,
}) => (
    <div className="space-y-6">
        <h2
            className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            <BarChart3 className="w-6 h-6 inline mr-2" />
            Analytics Dashboard
        </h2>

        {/* Project Breakdown */}
        <div
            className={`rounded-3xl border overflow-hidden backdrop-blur-xl ${isDarkMode ? "bg-black/40 border-white/10" : "bg-white/60 border-white/40 shadow-xl"}`}>
            <div className="p-6 border-b border-white/5">
                <h3
                    className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
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
                                    className={`font-medium ${isDarkMode ? "text-white/90" : "text-gray-800"}`}>
                                    {project.name}
                                </span>
                                <div className="flex items-center gap-4">
                                    <span
                                        className={`text-sm ${isDarkMode ? "text-white/60" : "text-gray-600"}`}>
                                        {project.tickets} tickets •{" "}
                                        {project.entries} entries
                                    </span>
                                    <span
                                        className={`font-mono font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                        {project.formattedTime}
                                    </span>
                                    <span
                                        className={`text-xs ${isDarkMode ? "text-white/40" : "text-gray-400"}`}>
                                        {project.percentage}%
                                    </span>
                                </div>
                            </div>
                            <div
                                className={`h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-white/5" : "bg-gray-200"}`}>
                                <div
                                    className={`h-full bg-gradient-to-r ${theme.gradient}`}
                                    style={{ width: `${project.percentage}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
                className={`rounded-3xl border overflow-hidden backdrop-blur-xl ${isDarkMode ? "bg-black/40 border-white/10" : "bg-white/60 border-white/40 shadow-xl"}`}>
                <div className="p-6 border-b border-white/5">
                    <h3
                        className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
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
                                    className={`font-mono font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    {status.formattedTime}
                                </div>
                                <div
                                    className={`text-xs ${isDarkMode ? "text-white/40" : "text-gray-400"}`}>
                                    {status.count} entries
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div
                className={`rounded-3xl border overflow-hidden backdrop-blur-xl ${isDarkMode ? "bg-black/40 border-white/10" : "bg-white/60 border-white/40 shadow-xl"}`}>
                <div className="p-6 border-b border-white/5">
                    <h3
                        className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
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
                                className={`text-sm ${isDarkMode ? "text-white/70" : "text-gray-600"}`}>
                                {day.date}
                            </span>
                            <span
                                className={`font-mono font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                {day.formattedTime}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// Calendar View Component
const CalendarView = ({
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
                className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                <CalendarDays className="w-6 h-6 inline mr-2" />
                Calendar View
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Date List */}
                <div
                    className={`rounded-3xl border overflow-hidden backdrop-blur-xl ${isDarkMode ? "bg-black/40 border-white/10" : "bg-white/60 border-white/40 shadow-xl"}`}>
                    <div className="p-6 border-b border-white/5">
                        <h3
                            className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            Dates
                        </h3>
                    </div>
                    <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
                        {dates.map((date) => {
                            const dayLogs = calendarData[date];
                            const totalTime = dayLogs.reduce(
                                (acc, log) => acc + parseTime(log.timeLogged),
                                0,
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
                                                className={`text-xs mt-1 ${selectedCalendarDate === date ? "text-white/80" : isDarkMode ? "text-white/40" : "text-gray-400"}`}>
                                                {dayLogs.length} entries
                                            </div>
                                        </div>
                                        <div
                                            className={`font-mono font-bold ${selectedCalendarDate === date ? "text-white" : isDarkMode ? "text-orange-400" : "text-orange-600"}`}>
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
                    className={`lg:col-span-2 rounded-3xl border overflow-hidden backdrop-blur-xl ${isDarkMode ? "bg-black/40 border-white/10" : "bg-white/60 border-white/40 shadow-xl"}`}>
                    <div className="p-6 border-b border-white/5">
                        <h3
                            className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
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
                                            className={`p-4 rounded-xl border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <a
                                                    href={getJiraUrl(
                                                        log.jiraId,
                                                    )}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded font-mono text-xs transition-colors ${isDarkMode ? "bg-white/5 border border-white/10 text-white/70 hover:text-orange-400" : "bg-gray-100 text-gray-600 hover:text-orange-600"}`}>
                                                    {log.jiraId}
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`font-mono font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                                        {log.timeLogged}
                                                    </span>
                                                    <StatusPill
                                                        status={log.status}
                                                        size="sm"
                                                    />
                                                </div>
                                            </div>
                                            <div
                                                className={`text-sm ${isDarkMode ? "text-white/80" : "text-gray-700"} mb-2`}>
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
                                    ),
                                )}
                            </div>
                        ) : (
                            <div
                                className={`text-center py-12 ${isDarkMode ? "text-white/30" : "text-gray-400"}`}>
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

// Projects View Component
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
                className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                <FolderKanban className="w-6 h-6 inline mr-2" />
                Project Overview
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analyticsData.projectBreakdown.map((project, idx) => (
                    <div
                        key={idx}
                        className={`rounded-3xl border overflow-hidden backdrop-blur-xl transition-all hover:scale-105 ${isDarkMode ? "bg-black/40 border-white/10 hover:bg-black/60" : "bg-white/60 border-white/40 shadow-xl hover:bg-white/80"}`}>
                        <div
                            className={`p-6 bg-gradient-to-r ${theme.gradient} bg-opacity-10`}>
                            <div className="flex items-center justify-between mb-4">
                                <div
                                    className={`p-3 rounded-xl bg-gradient-to-r ${theme.gradient} text-white shadow-lg`}>
                                    <FolderKanban className="w-6 h-6" />
                                </div>
                                <div
                                    className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    {project.percentage}%
                                </div>
                            </div>
                            <h3
                                className={`text-lg font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                {project.name}
                            </h3>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <span
                                    className={`text-sm ${isDarkMode ? "text-white/60" : "text-gray-600"}`}>
                                    <Timer className="w-4 h-4 inline mr-1" />
                                    Total Time
                                </span>
                                <span
                                    className={`font-mono font-bold text-lg ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    {project.formattedTime}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span
                                    className={`text-sm ${isDarkMode ? "text-white/60" : "text-gray-600"}`}>
                                    <Target className="w-4 h-4 inline mr-1" />
                                    Tickets
                                </span>
                                <span
                                    className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    {project.tickets}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span
                                    className={`text-sm ${isDarkMode ? "text-white/60" : "text-gray-600"}`}>
                                    <Zap className="w-4 h-4 inline mr-1" />
                                    Entries
                                </span>
                                <span
                                    className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    {project.entries}
                                </span>
                            </div>

                            <div
                                className={`pt-4 border-t ${isDarkMode ? "border-white/10" : "border-gray-200"}`}>
                                <div
                                    className={`h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-white/5" : "bg-gray-200"}`}>
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
