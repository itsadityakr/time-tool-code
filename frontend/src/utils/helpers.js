/**
 * Format a date to a readable string
 */
export const formatDate = (d) =>
    d
        ? new Date(d).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
          })
        : "N/A";

/**
 * Parse time string (e.g., "2h 30m") to minutes
 */
export const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    let total = 0;
    const h = timeStr.match(/(\d+)h/);
    const m = timeStr.match(/(\d+)m/);
    if (h) total += parseInt(h[1]) * 60;
    if (m) total += parseInt(m[1]);
    return total;
};

/**
 * Convert minutes to time string (e.g., "2h 30m")
 */
export const formatTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m > 0 ? `${m}m` : ""}`.trim();
};

/**
 * Get today's date in ISO format
 */
export const getToday = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
};

/**
 * Get the start of the current week (Monday)
 */
export const getWeekStart = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split("T")[0];
};

/**
 * Get the start of the current month
 */
export const getMonthStart = () => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split("T")[0];
};

/**
 * Generate JIRA URL from JIRA ID
 */
export const getJiraUrl = (jiraId) => {
    return `https://www.jira.com/${jiraId}`;
};

/**
 * Download a file to the user's device
 */
export const downloadFile = (content, type, filename) => {
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
