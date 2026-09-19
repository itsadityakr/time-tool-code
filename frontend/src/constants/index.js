// API Configuration
export const API_URL = "http://localhost:5000/api";

// Theme Configuration
export const THEME = {
    gradient: "from-red-600 via-orange-500 to-amber-500",
    glass: "bg-orange-500/10 border-orange-200/20",
    text: "text-orange-400",
    accent: "bg-orange-500",
};

// Column Definitions
export const ALL_COLUMNS = [
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

// View Modes
export const VIEW_MODES = {
    DASHBOARD: "dashboard",
    ANALYTICS: "analytics",
    CALENDAR: "calendar",
    PROJECTS: "projects",
};

// Default Column Widths
export const DEFAULT_COLUMN_WIDTHS = {
    date: 140,
    jiraId: 140,
    description: 300,
    timeLogged: 120,
    status: 130,
    projectName: 180,
    remarks: 200,
};

// Status Options
export const STATUS_OPTIONS = ["Done", "In Progress", "Pending", "Blocked"];

// Status Color Configuration
export const STATUS_CONFIG = {
    Done: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
    "In Progress": "bg-blue-500/20 text-blue-600 border-blue-500/30",
    Pending: "bg-amber-500/20 text-amber-600 border-amber-500/30",
    Blocked: "bg-rose-500/20 text-rose-600 border-rose-500/30",
};
