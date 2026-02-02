import * as XLSX from "xlsx";
import { formatDate, downloadFile } from "./helpers";

/**
 * Export data to CSV format
 */
export const exportToCSV = (data, isMerged) => {
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
        const rows = data.map((item) => [
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
        const rows = data.map((item) => [
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

/**
 * Export data to Excel format
 */
export const exportToXLSX = (data, isMerged) => {
    const worksheetData = data.map((item) => {
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

    // Add hyperlinks to JIRA IDs
    data.forEach((item, index) => {
        const cellRef = `B${index + 2}`;
        const jiraUrl = `https://www.jira.com/${item.jiraId}`;

        if (!ws[cellRef]) ws[cellRef] = {};
        ws[cellRef].l = {
            Target: jiraUrl,
            Tooltip: `Open ${item.jiraId} in JIRA`,
        };
    });

    // Set column widths
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
