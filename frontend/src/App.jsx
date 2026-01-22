import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import {
    LayoutDashboard,
    Plus,
    Upload,
    Download,
    Search,
    Moon,
    Sun,
    Filter,
    X,
    Calendar,
    Clock,
    CheckCircle2,
    AlertCircle,
    MoreVertical,
    Trash2,
    Edit2,
    FileSpreadsheet,
    Menu,
    ChevronDown,
    ChevronUp,
    Briefcase,
    Hash,
    ListFilter,
    Merge,
    Split,
    ChevronRight,
} from "lucide-react";

// Base URL for API calls
const API_URL = "http://localhost:5000/api";

// Theme Configuration
const THEMES = {
    blue: {
        primary: "bg-blue-600",
        hover: "hover:bg-blue-700",
        text: "text-blue-600",
        ring: "ring-blue-500",
        light: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-800",
    },
    violet: {
        primary: "bg-violet-600",
        hover: "hover:bg-violet-700",
        text: "text-violet-600",
        ring: "ring-violet-500",
        light: "bg-violet-50 dark:bg-violet-900/20",
        border: "border-violet-200 dark:border-violet-800",
    },
    emerald: {
        primary: "bg-emerald-600",
        hover: "hover:bg-emerald-700",
        text: "text-emerald-600",
        ring: "ring-emerald-500",
        light: "bg-emerald-50 dark:bg-emerald-900/20",
        border: "border-emerald-200 dark:border-emerald-800",
    },
    rose: {
        primary: "bg-rose-600",
        hover: "hover:bg-rose-700",
        text: "text-rose-600",
        ring: "ring-rose-500",
        light: "bg-rose-50 dark:bg-rose-900/20",
        border: "border-rose-200 dark:border-rose-800",
    },
    amber: {
        primary: "bg-amber-600",
        hover: "hover:bg-amber-700",
        text: "text-amber-600",
        ring: "ring-amber-500",
        light: "bg-amber-50 dark:bg-amber-900/20",
        border: "border-amber-200 dark:border-amber-800",
    },
};

// Column definitions for normal view
const ALL_COLUMNS = [
    { key: "date", label: "Date", sortable: true },
    { key: "jiraId", label: "Jira ID", sortable: true },
    { key: "description", label: "Description" },
    { key: "timeLogged", label: "Time", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { key: "projectName", label: "Project", sortable: true },
    { key: "remarks", label: "Remarks" },
];

// Column definitions for merged view
const MERGED_COLUMNS = [
    { key: "no", label: "No.", sortable: false },
    { key: "jiraId", label: "JIRA ID", sortable: true },
    { key: "description", label: "Description" },
    { key: "startDate", label: "Start Date", sortable: true },
    { key: "endDate", label: "End Date", sortable: true },
    { key: "totalTime", label: "Total Time", sortable: true },
    { key: "projectName", label: "Project", sortable: true },
];

// Search column options
const SEARCH_COLUMNS = [
    { key: "all", label: "All Columns" },
    { key: "jiraId", label: "JIRA ID" },
    { key: "description", label: "Description" },
    { key: "projectName", label: "Project" },
    { key: "status", label: "Status" },
];

function App() {
    // ============= UI STATE =============
    const [isDarkMode, setIsDarkMode] = useState(
        () => localStorage.getItem("theme") === "dark",
    );
    const [columnWidths, setColumnWidths] = useState({
        date: 140,
        jiraId: 120,
        description: 280,
        timeLogged: 130,
        status: 120,
        projectName: 180,
        remarks: 200,
        startDate: 140,
        endDate: 140,
        totalTime: 140,
    });

    const [accentColor, setAccentColor] = useState(
        () => localStorage.getItem("accent") || "blue",
    );
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("add");
    const [isMerged, setIsMerged] = useState(false);
    const [expandedRows, setExpandedRows] = useState({}); // NEW: Track which merged rows are expanded

    // ============= DATA STATE =============
    const [worklogs, setWorklogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [mergedLogs, setMergedLogs] = useState([]);
    const [stats, setStats] = useState({
        totalLogs: 0,
        projects: [],
        totalProjects: 0,
    });

    const [visibleColumns, setVisibleColumns] = useState(() => {
        const saved = localStorage.getItem("visibleColumns");
        return saved ? JSON.parse(saved) : ALL_COLUMNS.map((c) => c.key);
    });

    const [columnMenu, setColumnMenu] = useState({
        open: false,
        x: 0,
        y: 0,
    });

    useEffect(() => {
        localStorage.setItem("visibleColumns", JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    // Editing & Forms
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        date: "",
        jiraId: "",
        description: "",
        timeLogged: "",
        status: "",
        projectName: "",
        remarks: "",
    });

    // Filters
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: "asc",
    });

    const startResize = (e, key) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = columnWidths[key];

        const onMouseMove = (moveEvent) => {
            const newWidth = startWidth + (moveEvent.clientX - startX);
            setColumnWidths((prev) => ({
                ...prev,
                [key]: Math.max(80, newWidth),
            }));
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    };

    const [searchColumn, setSearchColumn] = useState("all");

    const [sidebarFilters, setSidebarFilters] = useState({
        selectedProject: null,
        selectedStatus: null,
        selectedJiraId: null,
        selectedDate: null,
        dateRange: { start: "", end: "" },
        searchText: "",
        showToday: false,
    });

    // Lists
    const [projectList, setProjectList] = useState([]);
    const [jiraIdList, setJiraIdList] = useState([]);

    // Calculate total time for current view
    const calculateTotalTime = () => {
        let totalMinutes = 0;
        const dataToUse = isMerged ? mergedLogs : filteredLogs;

        dataToUse.forEach((l) => {
            const timeField = isMerged ? l.totalTime : l.timeLogged;
            if (!timeField) return;
            const h = timeField.match(/(\d+)h/);
            const m = timeField.match(/(\d+)m/);
            if (h) totalMinutes += parseInt(h[1]) * 60;
            if (m) totalMinutes += parseInt(m[1]);
        });

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h ${minutes}m`;
    };

    // ============= MERGE LOGIC =============
    // This function combines entries with same JIRA ID + Project
    const mergeWorklogs = (logs) => {
        const grouped = {};

        // Group logs by JIRA ID + Project Name
        logs.forEach((log) => {
            const key = `${log.jiraId}_${log.projectName}`;

            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(log);
        });

        // Convert grouped data to merged format
        const merged = Object.entries(grouped).map(([key, entries], index) => {
            // Sort entries by date to get start and end dates
            const sortedEntries = entries.sort(
                (a, b) => new Date(a.date) - new Date(b.date),
            );

            // Calculate total time
            let totalMinutes = 0;
            entries.forEach((entry) => {
                if (entry.timeLogged) {
                    const h = entry.timeLogged.match(/(\d+)h/);
                    const m = entry.timeLogged.match(/(\d+)m/);
                    if (h) totalMinutes += parseInt(h[1]) * 60;
                    if (m) totalMinutes += parseInt(m[1]);
                }
            });

            const totalHours = Math.floor(totalMinutes / 60);
            const totalMins = totalMinutes % 60;
            const totalTime = `${totalHours}h ${totalMins}m`;

            return {
                id: key, // Unique identifier for this merged group
                no: index + 1,
                jiraId: sortedEntries[0].jiraId,
                description: sortedEntries[0].description,
                startDate: sortedEntries[0].date,
                endDate: sortedEntries[sortedEntries.length - 1].date,
                totalTime: totalTime,
                projectName: sortedEntries[0].projectName,
                entryCount: entries.length,
                originalEntries: sortedEntries, // NEW: Store original entries for expansion
            };
        });

        return merged;
    };

    // NEW: Toggle row expansion
    const toggleRowExpansion = (rowId) => {
        setExpandedRows((prev) => ({
            ...prev,
            [rowId]: !prev[rowId],
        }));
    };

    // ============= EFFECTS =============
    useEffect(() => {
        applyAllFilters();
    }, [worklogs, sidebarFilters, sortConfig, searchColumn]);

    // Theme Effect
    useEffect(() => {
        const root = window.document.documentElement;
        if (isDarkMode) {
            root.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            root.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [isDarkMode]);

    // Color Persistence
    useEffect(() => {
        localStorage.setItem("accent", accentColor);
    }, [accentColor]);

    // Data Loading
    useEffect(() => {
        fetchWorklogs();
        fetchStats();
        loadProjectList();
        loadJiraIdList();
    }, []);

    // Update merged logs when filtered logs change
    useEffect(() => {
        if (isMerged) {
            setMergedLogs(mergeWorklogs(filteredLogs));
        }
    }, [filteredLogs, isMerged]);

    // ============= FETCH FUNCTIONS =============
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

    // ============= LIST LOADERS =============
    const loadProjectList = () => {
        setProjectList([
            "Standing Waves",
            "Mobile App Development",
            "Web Dashboard",
            "API Integration",
            "Database Migration",
            "Bug Fixes",
            "Testing",
            "Documentation",
            "Code Review",
            "DevOps",
            "UI/UX Design",
        ]);
    };

    const loadJiraIdList = () => {
        setJiraIdList([
            "PROJ-101",
            "PROJ-102",
            "BUG-201",
            "BUG-202",
            "FEAT-301",
            "TASK-401",
            "DOC-501",
            "TEST-601",
        ]);
    };

    // ============= FILTER LOGIC =============
    const getBaseFilteredLogs = () => {
        let filtered = [...worklogs];

        // 1️⃣ TODAY (highest priority)
        if (sidebarFilters.showToday) {
            const today = new Date().toISOString().split("T")[0];
            return filtered.filter(
                (l) => new Date(l.date).toISOString().split("T")[0] === today,
            );
        }

        // 2️⃣ DATE RANGE (From – To)
        if (sidebarFilters.dateRange.start && sidebarFilters.dateRange.end) {
            const start = new Date(sidebarFilters.dateRange.start);
            const end = new Date(sidebarFilters.dateRange.end);
            filtered = filtered.filter((l) => {
                const d = new Date(l.date);
                return d >= start && d <= end;
            });
        }

        // 3️⃣ OTHER FILTERS
        if (sidebarFilters.selectedProject)
            filtered = filtered.filter(
                (l) => l.projectName === sidebarFilters.selectedProject,
            );

        if (sidebarFilters.selectedStatus)
            filtered = filtered.filter(
                (l) => l.status === sidebarFilters.selectedStatus,
            );

        if (sidebarFilters.selectedJiraId)
            filtered = filtered.filter(
                (l) => l.jiraId === sidebarFilters.selectedJiraId,
            );

        // 4️⃣ SEARCH TEXT (with column filter)
        if (sidebarFilters.searchText) {
            const lower = sidebarFilters.searchText.toLowerCase();

            if (searchColumn === "all") {
                // Search in all columns
                filtered = filtered.filter((l) =>
                    Object.values(l).some((val) =>
                        String(val).toLowerCase().includes(lower),
                    ),
                );
            } else {
                // Search in specific column
                filtered = filtered.filter((l) =>
                    String(l[searchColumn]).toLowerCase().includes(lower),
                );
            }
        }

        return filtered;
    };

    const applyAllFilters = () => {
        let data = getBaseFilteredLogs();

        if (sortConfig.key) {
            data = [...data].sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                if (
                    sortConfig.key === "date" ||
                    sortConfig.key === "startDate" ||
                    sortConfig.key === "endDate"
                ) {
                    aVal = new Date(aVal);
                    bVal = new Date(bVal);
                }

                if (typeof aVal === "string") {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }

                if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            });
        }

        setFilteredLogs(data);
    };

    const updateFilter = (name, value) => {
        // NEW: When date range changes, turn off Today's filter
        if (name === "dateRange" && (value.start || value.end)) {
            setSidebarFilters({
                ...sidebarFilters,
                [name]: value,
                showToday: false,
            });
        } else {
            setSidebarFilters({ ...sidebarFilters, [name]: value });
        }
    };

    // NEW: Updated toggleToday function to clear date range
    const toggleToday = () => {
        setSidebarFilters({
            ...sidebarFilters,
            showToday: !sidebarFilters.showToday,
            dateRange: { start: "", end: "" }, // Clear date range when Today is toggled
        });
    };

    const clearAllFilters = () => {
        setSidebarFilters({
            selectedProject: null,
            selectedStatus: null,
            selectedJiraId: null,
            selectedDate: null,
            dateRange: { start: "", end: "" },
            searchText: "",
            showToday: false,
        });

        setSortConfig({ key: null, direction: "asc" });
        setSearchColumn("all");
    };

    // ============= SORTING =============
    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    // ============= CRUD OPERATIONS =============
    const openAddModal = () => {
        setModalMode("add");
        setFormData({
            date: "",
            jiraId: "",
            description: "",
            timeLogged: "",
            status: "",
            projectName: "",
            remarks: "",
        });
        setIsModalOpen(true);
    };

    const openEditModal = (log) => {
        setModalMode("edit");
        setEditingId(log.id);
        setFormData({
            date: log.date
                ? new Date(log.date).toISOString().split("T")[0]
                : "",
            jiraId: log.jiraId || "",
            description: log.description || "",
            timeLogged: log.timeLogged || "",
            status: log.status || "",
            projectName: log.projectName || "",
            remarks: log.remarks || "",
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modalMode === "add") {
                await axios.post(`${API_URL}/worklogs`, formData);
            } else {
                await axios.put(`${API_URL}/worklogs/${editingId}`, formData);
            }
            fetchWorklogs();
            fetchStats();
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving worklog:", error);
            alert("Operation failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this entry?")) return;
        try {
            await axios.delete(`${API_URL}/worklogs/${id}`);
            fetchWorklogs();
            fetchStats();
        } catch (error) {
            console.error("Delete failed", error);
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

    // ============= EXPORT =============
    const exportToCSV = () => {
        const dataToExport = isMerged ? mergedLogs : filteredLogs;

        if (isMerged) {
            const headers = [
                "No.",
                "JIRA ID",
                "Description",
                "Start Date",
                "End Date",
                "Total Time",
                "Project",
            ];
            const rows = dataToExport.map((l) => [
                l.no,
                l.jiraId,
                `"${l.description}"`,
                formatDate(l.startDate),
                formatDate(l.endDate),
                l.totalTime,
                l.projectName,
            ]);
            const csvContent = [
                headers.join(","),
                ...rows.map((r) => r.join(",")),
            ].join("\n");
            const link = document.createElement("a");
            link.href = URL.createObjectURL(
                new Blob([csvContent], { type: "text/csv" }),
            );
            link.download = "worklogs_merged.csv";
            link.click();
        } else {
            const headers = [
                "Date",
                "JIRA ID",
                "Description",
                "Time",
                "Status",
                "Project",
                "Remarks",
            ];
            const rows = dataToExport.map((l) => [
                formatDate(l.date),
                l.jiraId,
                `"${l.description}"`,
                l.timeLogged,
                l.status,
                l.projectName,
                `"${l.remarks}"`,
            ]);
            const csvContent = [
                headers.join(","),
                ...rows.map((r) => r.join(",")),
            ].join("\n");
            const link = document.createElement("a");
            link.href = URL.createObjectURL(
                new Blob([csvContent], { type: "text/csv" }),
            );
            link.download = "worklogs.csv";
            link.click();
        }
    };

    const exportToXLSX = () => {
        const dataToExport = isMerged ? mergedLogs : filteredLogs;
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Worklogs");
        XLSX.writeFile(wb, isMerged ? "worklogs_merged.xlsx" : "worklogs.xlsx");
    };

    // Helpers
    const formatDate = (d) =>
        d
            ? new Date(d).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
              })
            : "N/A";
    const getTheme = () => THEMES[accentColor];

    // Lists for dropdowns
    const getAvailableList = (key) =>
        [...new Set(filteredLogs.map((l) => l[key]).filter(Boolean))].sort();

    // Get current columns based on merge state
    const getCurrentColumns = () => (isMerged ? MERGED_COLUMNS : ALL_COLUMNS);
    const getCurrentData = () => (isMerged ? mergedLogs : filteredLogs);

    // ============= RENDER =============
    return (
        <div
            className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-gray-50 text-gray-900"} font-sans`}>
            {/* ============= SIDEBAR ============= */}
            <aside
                className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 border-r ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"} ${isSidebarOpen ? "w-72" : "w-20"}`}>
                {/* Logo */}
                <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-slate-800">
                    <div
                        className={`flex items-center gap-2 font-bold text-xl ${getTheme().text}`}>
                        <LayoutDashboard className="w-8 h-8" />
                        {isSidebarOpen && <span>WorkLog Pro</span>}
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="p-4 overflow-y-auto h-[calc(100vh-4rem)] scrollbar-hide">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`mb-6 w-full flex items-center justify-center p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-slate-800" : "hover:bg-gray-100"}`}>
                        <Menu className="w-5 h-5" />
                    </button>

                    {isSidebarOpen ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                            {/* Search with Column Selector */}
                            <div className="space-y-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={sidebarFilters.searchText}
                                        onChange={(e) =>
                                            updateFilter(
                                                "searchText",
                                                e.target.value,
                                            )
                                        }
                                        className={`w-full pl-9 pr-4 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 ${isDarkMode ? "bg-slate-800 border-slate-700 text-white focus:ring-slate-600" : "bg-white border-gray-200 focus:ring-blue-100"}`}
                                    />
                                </div>

                                {/* Search Column Selector */}
                                <select
                                    value={searchColumn}
                                    onChange={(e) =>
                                        setSearchColumn(e.target.value)
                                    }
                                    className={`w-full px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-2 ${isDarkMode ? "bg-slate-800 border-slate-700 text-white focus:ring-slate-600" : "bg-white border-gray-200 focus:ring-blue-100"}`}>
                                    {SEARCH_COLUMNS.map((col) => (
                                        <option key={col.key} value={col.key}>
                                            Search in: {col.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Filters Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-xs font-semibold uppercase text-gray-500 tracking-wider">
                                    <span>Smart Filters</span>
                                    <Filter className="w-3 h-3" />
                                </div>

                                {/* Project Filter */}
                                <FilterDropdown
                                    label="Project"
                                    icon={<Briefcase className="w-4 h-4" />}
                                    value={sidebarFilters.selectedProject}
                                    onChange={(val) =>
                                        updateFilter("selectedProject", val)
                                    }
                                    options={getAvailableList("projectName")}
                                    theme={getTheme()}
                                    isDark={isDarkMode}
                                />

                                {/* Status Filter */}
                                <FilterDropdown
                                    label="Status"
                                    icon={<CheckCircle2 className="w-4 h-4" />}
                                    value={sidebarFilters.selectedStatus}
                                    onChange={(val) =>
                                        updateFilter("selectedStatus", val)
                                    }
                                    options={[
                                        "Done",
                                        "In Progress",
                                        "Pending",
                                        "Blocked",
                                    ]}
                                    theme={getTheme()}
                                    isDark={isDarkMode}
                                />

                                {/* Jira Filter */}
                                <FilterDropdown
                                    label="Jira ID"
                                    icon={<Hash className="w-4 h-4" />}
                                    value={sidebarFilters.selectedJiraId}
                                    onChange={(val) =>
                                        updateFilter("selectedJiraId", val)
                                    }
                                    options={getAvailableList("jiraId")}
                                    theme={getTheme()}
                                    isDark={isDarkMode}
                                />

                                {/* Date Range (simplified - no month/year) */}
                                <div
                                    className={`rounded-lg border p-3 ${
                                        isDarkMode
                                            ? "bg-slate-800/50 border-slate-700"
                                            : "bg-gray-50 border-gray-200"
                                    }`}>
                                    <label className="text-xs font-medium mb-2 block items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Date Range
                                    </label>
                                    <div className="space-y-2">
                                        <input
                                            type="date"
                                            value={
                                                sidebarFilters.dateRange.start
                                            }
                                            onChange={(e) =>
                                                updateFilter("dateRange", {
                                                    ...sidebarFilters.dateRange,
                                                    start: e.target.value,
                                                })
                                            }
                                            placeholder="From"
                                            className={`w-full text-xs p-1.5 rounded border ${isDarkMode ? "bg-slate-900 border-slate-600" : "bg-white border-gray-300"}`}
                                        />
                                        <input
                                            type="date"
                                            value={sidebarFilters.dateRange.end}
                                            onChange={(e) =>
                                                updateFilter("dateRange", {
                                                    ...sidebarFilters.dateRange,
                                                    end: e.target.value,
                                                })
                                            }
                                            placeholder="To"
                                            className={`w-full text-xs p-1.5 rounded border ${isDarkMode ? "bg-slate-900 border-slate-600" : "bg-white border-gray-300"}`}
                                        />
                                    </div>
                                </div>

                                {/* Today Button */}
                                <button
                                    onClick={toggleToday}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                                        sidebarFilters.showToday
                                            ? "bg-blue-600 text-white"
                                            : isDarkMode
                                              ? "bg-slate-800 hover:bg-slate-700"
                                              : "bg-gray-100 hover:bg-gray-200"
                                    }`}>
                                    <span>Today's Worklogs</span>
                                    <Calendar className="w-4 h-4" />
                                </button>

                                <button
                                    onClick={clearAllFilters}
                                    className={`w-full py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors`}>
                                    Reset Filters
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <Search className="w-5 h-5 text-gray-400" />
                            <Briefcase className="w-5 h-5 text-gray-400" />
                            <CheckCircle2 className="w-5 h-5 text-gray-400" />
                        </div>
                    )}
                </div>
            </aside>

            {/* ============= MAIN CONTENT ============= */}
            <div
                className={`transition-all duration-300 ${isSidebarOpen ? "ml-72" : "ml-20"}`}>
                {/* Header */}
                <header
                    className={`z-30 h-16 px-8 flex items-center justify-between backdrop-blur-md border-b ${isDarkMode ? "bg-slate-950/80 border-slate-800" : "bg-white/80 border-gray-200"}`}>
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold">Dashboard</h2>
                        <div
                            className={`text-xs px-2 py-1 rounded-full ${getTheme().light} ${getTheme().text} font-medium border ${getTheme().border}`}>
                            {getCurrentData().length} Entries{" "}
                            {isMerged ? "(Merged)" : ""}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Color Picker */}
                        <div className="flex items-center gap-1 p-1 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                            {Object.keys(THEMES).map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setAccentColor(color)}
                                    className={`w-4 h-4 rounded-full transition-transform hover:scale-110 ${THEMES[color].primary} ${accentColor === color ? "ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-950 " + THEMES[color].ring : ""}`}
                                />
                            ))}
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className={`p-2 rounded-full transition-colors ${isDarkMode ? "hover:bg-slate-800 text-yellow-400" : "hover:bg-gray-100 text-slate-600"}`}>
                            {isDarkMode ? (
                                <Sun className="w-5 h-5" />
                            ) : (
                                <Moon className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </header>

                {/* Content Area */}
                <main className="p-8">
                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div className="flex gap-2">
                            {/* Merge/Unmerge Button */}
                            <button
                                onClick={() => {
                                    setIsMerged(!isMerged);
                                    setExpandedRows({}); // Reset expanded rows when toggling merge
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-lg transition-all active:scale-95 ${
                                    isMerged
                                        ? "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/20"
                                        : `${getTheme().primary} ${getTheme().hover} text-white shadow-blue-500/20`
                                }`}>
                                {isMerged ? (
                                    <>
                                        <Split className="w-4 h-4" /> Unmerge
                                    </>
                                ) : (
                                    <>
                                        <Merge className="w-4 h-4" /> Merge
                                    </>
                                )}
                            </button>

                            <button
                                onClick={openAddModal}
                                disabled={isMerged}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium shadow-lg shadow-blue-500/20 transition-all active:scale-95 ${
                                    isMerged
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : `${getTheme().primary} ${getTheme().hover}`
                                }`}>
                                <Plus className="w-4 h-4" /> Add Entry
                            </button>

                            <label
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                                    isMerged
                                        ? "opacity-50 cursor-not-allowed"
                                        : `cursor-pointer ${isDarkMode ? "border-slate-700 hover:bg-slate-800" : "border-gray-300 hover:bg-gray-50"}`
                                }`}>
                                <Upload className="w-4 h-4" /> Import CSV
                                <input
                                    type="file"
                                    onChange={handleFileUpload}
                                    accept=".xlsx,.csv"
                                    disabled={isMerged}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={exportToCSV}
                                className={`p-2 rounded-lg border transition-colors ${isDarkMode ? "border-slate-700 hover:bg-slate-800" : "border-gray-300 hover:bg-gray-50"}`}
                                title="Export CSV">
                                <Download className="w-4 h-4" />
                            </button>
                            <button
                                onClick={exportToXLSX}
                                className={`p-2 rounded-lg border transition-colors ${isDarkMode ? "border-slate-700 hover:bg-slate-800" : "border-gray-300 hover:bg-gray-50"}`}
                                title="Export Excel">
                                <FileSpreadsheet className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div
                        className={`rounded-xl border shadow-sm ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
                        <div className="overflow-x-auto">
                            <table
                                className="text-sm text-left table-fixed"
                                style={{
                                    minWidth:
                                        Object.values(columnWidths).reduce(
                                            (a, b) => a + b,
                                            0,
                                        ) + 120,
                                }}>
                                <thead
                                    className={`sticky top-0 z-999 text-xs uppercase font-semibold ${
                                        isDarkMode
                                            ? "bg-slate-950 text-slate-400"
                                            : "bg-gray-50 text-gray-500"
                                    }`}>
                                    <tr>
                                        {isMerged && (
                                            <th className="px-6 py-4 w-12"></th>
                                        )}
                                        {getCurrentColumns().map((col) => {
                                            // 🔹 TIME COLUMN WITH TOTAL
                                            if (col.key === "timeLogged") {
                                                return (
                                                    <th
                                                        key={col.key}
                                                        style={{
                                                            width: columnWidths[
                                                                col.key
                                                            ],
                                                        }}
                                                        className="relative px-6 py-4 select-none">
                                                        <div className="flex justify-between items-center">
                                                            <span>
                                                                Time
                                                                <span className="ml-1 text-xs text-gray-400">
                                                                    [
                                                                    {calculateTotalTime()}
                                                                    ]
                                                                </span>
                                                            </span>

                                                            <div
                                                                onMouseDown={(
                                                                    e,
                                                                ) =>
                                                                    startResize(
                                                                        e,
                                                                        col.key,
                                                                    )
                                                                }
                                                                className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500"
                                                            />
                                                        </div>
                                                    </th>
                                                );
                                            }

                                            // 🔹 SORTABLE COLUMNS
                                            if (col.sortable) {
                                                return (
                                                    <SortableHeader
                                                        key={col.key}
                                                        label={col.label}
                                                        fKey={col.key}
                                                        sortConfig={sortConfig}
                                                        onSort={handleSort}
                                                        width={
                                                            columnWidths[
                                                                col.key
                                                            ]
                                                        }
                                                        onResize={startResize}
                                                    />
                                                );
                                            }

                                            // 🔹 NORMAL RESIZABLE COLUMNS
                                            return (
                                                <th
                                                    key={col.key}
                                                    style={{
                                                        width: columnWidths[
                                                            col.key
                                                        ],
                                                    }}
                                                    className="relative px-6 py-4 select-none">
                                                    <div className="flex justify-between items-center">
                                                        {col.label}
                                                        <div
                                                            onMouseDown={(e) =>
                                                                startResize(
                                                                    e,
                                                                    col.key,
                                                                )
                                                            }
                                                            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500"
                                                        />
                                                    </div>
                                                </th>
                                            );
                                        })}

                                        {!isMerged && (
                                            <th className="px-6 py-4 text-right">
                                                Actions
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                                    {getCurrentData().length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={isMerged ? "8" : "8"}
                                                className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <AlertCircle className="w-8 h-8 opacity-20" />
                                                    <p>No records found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : isMerged ? (
                                        // MERGED VIEW WITH EXPANSION
                                        <>
                                            {mergedLogs.map((log) => (
                                                <React.Fragment key={log.id}>
                                                    {/* Main Merged Row */}
                                                    <tr
                                                        className={`group transition-colors cursor-pointer ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-gray-50"}`}
                                                        onClick={() =>
                                                            toggleRowExpansion(
                                                                log.id,
                                                            )
                                                        }>
                                                        <td className="px-6 py-4">
                                                            <button className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded">
                                                                {expandedRows[
                                                                    log.id
                                                                ] ? (
                                                                    <ChevronDown className="w-4 h-4" />
                                                                ) : (
                                                                    <ChevronRight className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                        </td>
                                                        <td
                                                            className="px-6 py-4 font-medium"
                                                            style={{
                                                                width: columnWidths.no,
                                                            }}>
                                                            {log.no}
                                                        </td>
                                                        <td
                                                            className="px-6 py-4"
                                                            style={{
                                                                width: columnWidths.jiraId,
                                                            }}>
                                                            <span className="px-2 py-1 rounded text-xs font-mono bg-gray-100 dark:bg-slate-800">
                                                                {log.jiraId}
                                                            </span>
                                                        </td>
                                                        <td
                                                            className="px-6 py-4 max-w-xs truncate"
                                                            style={{
                                                                width: columnWidths.description,
                                                            }}>
                                                            <Tooltip
                                                                text={
                                                                    log.description
                                                                }>
                                                                <span className="block truncate">
                                                                    {
                                                                        log.description
                                                                    }
                                                                </span>
                                                            </Tooltip>
                                                            {log.entryCount >
                                                                1 && (
                                                                <span className="ml-2 text-xs text-gray-500">
                                                                    (
                                                                    {
                                                                        log.entryCount
                                                                    }{" "}
                                                                    entries)
                                                                </span>
                                                            )}
                                                        </td>

                                                        <td
                                                            className="px-6 py-4 font-medium"
                                                            style={{
                                                                width: columnWidths.startDate,
                                                            }}>
                                                            {formatDate(
                                                                log.startDate,
                                                            )}
                                                        </td>
                                                        <td
                                                            className="px-6 py-4 font-medium"
                                                            style={{
                                                                width: columnWidths.endDate,
                                                            }}>
                                                            {formatDate(
                                                                log.endDate,
                                                            )}
                                                        </td>
                                                        <td
                                                            className="px-6 py-4 font-mono text-xs font-bold"
                                                            style={{
                                                                width: columnWidths.totalTime,
                                                            }}>
                                                            Time [
                                                            {log.totalTime}]
                                                        </td>

                                                        <td
                                                            className="px-6 py-4"
                                                            style={{
                                                                width: columnWidths.projectName,
                                                            }}>
                                                            <Tooltip
                                                                text={
                                                                    log.projectName
                                                                }>
                                                                <span className="block truncate">
                                                                    {
                                                                        log.projectName
                                                                    }
                                                                </span>
                                                            </Tooltip>
                                                        </td>
                                                    </tr>

                                                    {/* Expanded Details */}
                                                    {expandedRows[log.id] && (
                                                        <tr
                                                            className={
                                                                isDarkMode
                                                                    ? "bg-slate-950/50"
                                                                    : "bg-blue-50/30"
                                                            }>
                                                            <td
                                                                colSpan="8"
                                                                className="px-6 py-4">
                                                                <div className="ml-8 space-y-2">
                                                                    <div className="font-semibold text-xs uppercase text-gray-500 mb-3">
                                                                        Merged
                                                                        Entries
                                                                        Detail:
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        {log.originalEntries.map(
                                                                            (
                                                                                entry,
                                                                                idx,
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        entry.id
                                                                                    }
                                                                                    className={`p-3 rounded-lg border text-sm ${isDarkMode ? "bg-slate-900 border-slate-700" : "bg-white border-gray-200"}`}>
                                                                                    <div className="grid grid-cols-6 gap-4">
                                                                                        <div>
                                                                                            <span className="text-xs text-gray-500">
                                                                                                Entry
                                                                                                #
                                                                                                {idx +
                                                                                                    1}
                                                                                            </span>
                                                                                        </div>
                                                                                        <div>
                                                                                            <span className="text-xs text-gray-500">
                                                                                                Date:
                                                                                            </span>
                                                                                            <div className="font-medium">
                                                                                                {formatDate(
                                                                                                    entry.date,
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                        <div>
                                                                                            <span className="text-xs text-gray-500">
                                                                                                Time:
                                                                                            </span>
                                                                                            <div className="font-mono text-xs">
                                                                                                {
                                                                                                    entry.timeLogged
                                                                                                }
                                                                                            </div>
                                                                                        </div>
                                                                                        <div>
                                                                                            <span className="text-xs text-gray-500">
                                                                                                Status:
                                                                                            </span>
                                                                                            <div>
                                                                                                <StatusBadge
                                                                                                    status={
                                                                                                        entry.status
                                                                                                    }
                                                                                                />
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="col-span-2">
                                                                                            <span className="text-xs text-gray-500">
                                                                                                Remarks:
                                                                                            </span>
                                                                                            <div className="text-xs">
                                                                                                {entry.remarks ||
                                                                                                    "—"}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </>
                                    ) : (
                                        // NORMAL VIEW
                                        filteredLogs.map((log) => (
                                            <tr
                                                key={log.id}
                                                className={`group transition-colors ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-gray-50"}`}>
                                                <td
                                                    style={{
                                                        width: columnWidths.date,
                                                    }}
                                                    className="px-6 py-4 font-medium truncate">
                                                    {formatDate(log.date)}
                                                </td>
                                                <td
                                                    className="px-6 py-4 "
                                                    style={{
                                                        width: columnWidths.jiraId,
                                                    }}>
                                                    <span className="px-2 py-1 rounded text-xs font-mono bg-gray-100 dark:bg-slate-800">
                                                        {log.jiraId}
                                                    </span>
                                                </td>
                                                <td
                                                    className="px-6 py-4 max-w-xs truncate"
                                                    style={{
                                                        width: columnWidths.description,
                                                    }}>
                                                    <Tooltip
                                                        text={log.description}>
                                                        <span className="block truncate">
                                                            {log.description}
                                                        </span>
                                                    </Tooltip>
                                                </td>

                                                <td
                                                    className="px-6 py-4 font-mono text-xs"
                                                    style={{
                                                        width: columnWidths.timeLogged,
                                                    }}>
                                                    {log.timeLogged}
                                                </td>
                                                <td
                                                    className="px-6 py-4"
                                                    style={{
                                                        width: columnWidths.status,
                                                    }}>
                                                    <StatusBadge
                                                        status={log.status}
                                                    />
                                                </td>
                                                <td
                                                    className="px-6 py-4"
                                                    style={{
                                                        width: columnWidths.projectName,
                                                    }}>
                                                    <Tooltip
                                                        text={log.projectName}>
                                                        <span className="block truncate">
                                                            {log.projectName}
                                                        </span>
                                                    </Tooltip>
                                                </td>

                                                <td
                                                    style={{
                                                        width: columnWidths.remarks,
                                                    }}
                                                    className="px-6 py-4 text-xs opacity-80 truncate">
                                                    {log.remarks || "—"}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() =>
                                                                openEditModal(
                                                                    log,
                                                                )
                                                            }
                                                            className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors"
                                                            title="Edit">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(
                                                                    log.id,
                                                                )
                                                            }
                                                            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                                                            title="Delete">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {/* ============= MODAL ============= */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden ${isDarkMode ? "bg-slate-900 border border-slate-800" : "bg-white"}`}>
                        <div
                            className={`px-6 py-4 border-b flex items-center justify-between ${isDarkMode ? "border-slate-800" : "border-gray-100"}`}>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                {modalMode === "add" ? (
                                    <Plus
                                        className={`w-5 h-5 ${getTheme().text}`}
                                    />
                                ) : (
                                    <Edit2
                                        className={`w-5 h-5 ${getTheme().text}`}
                                    />
                                )}
                                {modalMode === "add"
                                    ? "New Entry"
                                    : "Edit Entry"}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup
                                    label="Date"
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            date: e.target.value,
                                        })
                                    }
                                    isDark={isDarkMode}
                                    required
                                />
                                <SelectGroup
                                    label="Jira ID"
                                    value={formData.jiraId}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            jiraId: e.target.value,
                                        })
                                    }
                                    options={jiraIdList}
                                    isDark={isDarkMode}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <SelectGroup
                                    label="Project"
                                    value={formData.projectName}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            projectName: e.target.value,
                                        })
                                    }
                                    options={projectList}
                                    isDark={isDarkMode}
                                    required
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <InputGroup
                                        label="Time"
                                        placeholder="e.g. 2h 30m"
                                        value={formData.timeLogged}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                timeLogged: e.target.value,
                                            })
                                        }
                                        isDark={isDarkMode}
                                        required
                                    />
                                    <SelectGroup
                                        label="Status"
                                        value={formData.status}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                status: e.target.value,
                                            })
                                        }
                                        options={[
                                            "Done",
                                            "In Progress",
                                            "Pending",
                                            "Blocked",
                                        ]}
                                        isDark={isDarkMode}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium mb-1.5 opacity-70">
                                    Description
                                </label>
                                <textarea
                                    rows="3"
                                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-opacity-50 outline-none transition-all ${isDarkMode ? "bg-slate-950 border-slate-700 focus:ring-blue-500" : "bg-white border-gray-300 focus:ring-blue-500"}`}
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            description: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>

                            <InputGroup
                                label="Remarks (Optional)"
                                value={formData.remarks}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        remarks: e.target.value,
                                    })
                                }
                                isDark={isDarkMode}
                            />

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? "hover:bg-slate-800" : "hover:bg-gray-100"}`}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`px-6 py-2 rounded-lg text-sm font-medium text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all ${getTheme().primary} ${getTheme().hover}`}>
                                    Save Entry
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============= SUB COMPONENTS =============

const StatCard = ({ title, value, icon, color, bg }) => (
    <div
        className={`p-5 rounded-xl border flex items-center justify-between dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all`}>
        <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {title}
            </p>
            <h4 className="text-2xl font-bold mt-1">{value}</h4>
        </div>
        <div className={`p-3 rounded-lg ${bg} ${color}`}>
            {React.cloneElement(icon, { className: "w-6 h-6" })}
        </div>
    </div>
);

const FilterDropdown = ({
    label,
    icon,
    value,
    onChange,
    options,
    theme,
    isDark,
}) => (
    <div
        className={`p-3 rounded-lg border transition-colors ${value ? `${theme.light} ${theme.border}` : isDark ? "bg-slate-800/50 border-slate-700" : "bg-gray-50 border-gray-200"}`}>
        <label className="flex items-center gap-2 text-xs font-semibold mb-2 opacity-70">
            {icon} {label}
        </label>
        <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value || null)}
            className={`w-full bg-transparent text-sm font-medium outline-none cursor-pointer ${value ? theme.text : ""}`}>
            <option value="">All {label}s</option>
            {options.map((opt) => (
                <option
                    key={opt}
                    value={opt}
                    className={isDark ? "bg-slate-900" : ""}>
                    {opt}
                </option>
            ))}
        </select>
    </div>
);

const SortableHeader = ({
    label,
    fKey,
    sortConfig,
    onSort,
    width,
    onResize,
}) => (
    <th
        style={{ width }}
        className="relative px-6 py-4 cursor-pointer select-none"
        onClick={() => onSort(fKey)}>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
                {label}
                <div className="flex flex-col">
                    <ChevronUp
                        className={`w-3 h-3 -mb-1 ${
                            sortConfig.key === fKey &&
                            sortConfig.direction === "asc"
                                ? "text-blue-500"
                                : "text-gray-300 dark:text-slate-600"
                        }`}
                    />
                    <ChevronDown
                        className={`w-3 h-3 ${
                            sortConfig.key === fKey &&
                            sortConfig.direction === "desc"
                                ? "text-blue-500"
                                : "text-gray-300 dark:text-slate-600"
                        }`}
                    />
                </div>
            </div>

            <div
                onMouseDown={(e) => {
                    e.stopPropagation();
                    onResize(e, fKey);
                }}
                className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500"
            />
        </div>
    </th>
);

const StatusBadge = ({ status }) => {
    const styles = {
        Done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
        "In Progress":
            "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
        Pending:
            "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
        Blocked:
            "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
    };
    return (
        <span
            className={`px-2.5 py-1 rounded-md text-xs font-semibold ${styles[status] || "bg-gray-100 text-gray-600"}`}>
            {status}
        </span>
    );
};

const Tooltip = ({ text, children }) => {
    const [pos, setPos] = React.useState({ x: 0, y: 0 });
    const [show, setShow] = React.useState(false);

    return (
        <>
            <span
                onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setPos({
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                    });
                    setShow(true);
                }}
                onMouseLeave={() => setShow(false)}
                className="inline-block max-w-full truncate">
                {children}
            </span>

            {show && (
                <div
                    style={{
                        left: pos.x,
                        top: pos.y,
                        transform: "translate(-50%, -8px)",
                    }}
                    className="
                        fixed z-9999
                        bg-black text-white text-xs
                        px-3 py-2 rounded-md shadow-lg
                        max-w-xs whitespace-normal
                        pointer-events-none
                    ">
                    {text}
                </div>
            )}
        </>
    );
};

const InputGroup = ({ label, isDark, ...props }) => (
    <div>
        <label className="block text-xs font-medium mb-1.5 opacity-70">
            {label}
        </label>
        <input
            className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-opacity-50 outline-none transition-all ${isDark ? "bg-slate-950 border-slate-700 focus:ring-blue-500" : "bg-white border-gray-300 focus:ring-blue-500"}`}
            {...props}
        />
    </div>
);

const SelectGroup = ({ label, options, isDark, ...props }) => (
    <div>
        <label className="block text-xs font-medium mb-1.5 opacity-70">
            {label}
        </label>
        <select
            className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-opacity-50 outline-none transition-all ${isDark ? "bg-slate-950 border-slate-700 focus:ring-blue-500" : "bg-white border-gray-300 focus:ring-blue-500"}`}
            {...props}>
            <option value="">Select...</option>
            {options.map((o) => (
                <option key={o} value={o}>
                    {o}
                </option>
            ))}
        </select>
    </div>
);

export default App;
