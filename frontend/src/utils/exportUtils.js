import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate, downloadFile } from "./helpers";

/**
 * Export data to CSV format
 */
export const exportToCSV = (data, isMerged, filename = null) => {
    const defaultFilename = isMerged ? "WorkLogs_Merged" : "WorkLogs";
    const finalFilename = filename || defaultFilename;

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
        downloadFile(csvContent, "text/csv", `${finalFilename}.csv`);
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
        downloadFile(csvContent, "text/csv", `${finalFilename}.csv`);
    }
};

/**
 * Export data to Excel format
 */
export const exportToXLSX = (data, isMerged, filename = null) => {
    const defaultFilename = isMerged ? "WorkLogs_Merged" : "WorkLogs";
    const finalFilename = filename || defaultFilename;

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
    XLSX.writeFile(wb, `${finalFilename}.xlsx`);
};

/**
 * Export data to PDF format
 */
export const exportToPDF = (data, isMerged, filename = null) => {
    const defaultFilename = isMerged ? "WorkLogs_Merged" : "WorkLogs";
    const finalFilename = filename || defaultFilename;

    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
    });

    // Title
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text("Work Logs Report", 14, 15);

    // Subtitle with date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 22);

    if (isMerged) {
        const headers = [
            [
                "No.",
                "JIRA ID",
                "Project",
                "Description",
                "Start",
                "End",
                "Time",
                "Entries",
            ],
        ];
        const rows = data.map((item) => [
            item.no,
            item.jiraId,
            item.projectName,
            item.description.length > 40
                ? item.description.substring(0, 40) + "..."
                : item.description,
            formatDate(item.startDate),
            formatDate(item.endDate),
            item.totalTime,
            item.entryCount,
        ]);

        autoTable(doc, {
            head: headers,
            body: rows,
            startY: 28,
            styles: {
                fontSize: 8,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [249, 115, 22],
                textColor: [255, 255, 255],
                fontStyle: "bold",
            },
            alternateRowStyles: {
                fillColor: [250, 250, 250],
            },
            columnStyles: {
                0: { cellWidth: 12 },
                1: { cellWidth: 25 },
                2: { cellWidth: 35 },
                3: { cellWidth: 70 },
                4: { cellWidth: 25 },
                5: { cellWidth: 25 },
                6: { cellWidth: 20 },
                7: { cellWidth: 15 },
            },
        });
    } else {
        const headers = [
            [
                "Date",
                "JIRA ID",
                "Project",
                "Description",
                "Time",
                "Status",
                "Remarks",
            ],
        ];
        const rows = data.map((item) => [
            formatDate(item.date),
            item.jiraId,
            item.projectName,
            item.description.length > 45
                ? item.description.substring(0, 45) + "..."
                : item.description,
            item.timeLogged,
            item.status,
            (item.remarks || "").length > 25
                ? (item.remarks || "").substring(0, 25) + "..."
                : item.remarks || "",
        ]);

        autoTable(doc, {
            head: headers,
            body: rows,
            startY: 28,
            styles: {
                fontSize: 8,
                cellPadding: 3,
            },
            headStyles: {
                fillColor: [249, 115, 22],
                textColor: [255, 255, 255],
                fontStyle: "bold",
            },
            alternateRowStyles: {
                fillColor: [250, 250, 250],
            },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 25 },
                2: { cellWidth: 35 },
                3: { cellWidth: 75 },
                4: { cellWidth: 20 },
                5: { cellWidth: 25 },
                6: { cellWidth: 35 },
            },
        });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Page ${i} of ${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: "center" },
        );
    }

    doc.save(`${finalFilename}.pdf`);
};
