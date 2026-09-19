// Import required packages
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");

// Create Express app
const app = express();
const PORT = 5000;

// Middleware - these help process requests
app.use(cors()); // Allows frontend to talk to backend
app.use(express.json()); // Allows us to read JSON data

// Store worklogs in memory (simple approach for beginners)
// In a real app, you'd use a database like MongoDB or PostgreSQL
let worklogs = [];

// Configure file upload
// Files will be temporarily stored in 'uploads/' folder
const upload = multer({ dest: "uploads/" });

// ============= API ROUTES =============

// 1. Get all worklogs
// This sends all worklogs to the frontend
app.get("/api/worklogs", (req, res) => {
    res.json(worklogs);
});

// 2. Add a new worklog entry
// This receives data from the form and adds it to our worklogs array
app.post("/api/worklogs", (req, res) => {
    const newLog = {
        id: Date.now(), // Create a unique ID using current timestamp
        ...req.body, // Copy all data from the form
        createdAt: new Date(), // Add creation timestamp
    };
    worklogs.push(newLog); // Add to our array
    res.json(newLog); // Send back the created log
});

// 3. Filter worklogs by date
// Example: /api/worklogs/filter/date/2025-01-20
app.get("/api/worklogs/filter/date/:date", (req, res) => {
    const { date } = req.params; // Get date from URL

    // Filter worklogs that match this date
    const filtered = worklogs.filter((log) => {
        // Convert dates to YYYY-MM-DD format for comparison
        const logDate = new Date(log.date).toISOString().split("T")[0];
        const filterDate = new Date(date).toISOString().split("T")[0];
        return logDate === filterDate;
    });

    res.json(filtered);
});

// 4. Filter worklogs by project
// Example: /api/worklogs/filter/project/Standing%20Waves
app.get("/api/worklogs/filter/project/:projectName", (req, res) => {
    const { projectName } = req.params;

    // Find worklogs where project name contains the search term
    const filtered = worklogs.filter((log) =>
        log.projectName.toLowerCase().includes(projectName.toLowerCase()),
    );

    res.json(filtered);
});

// 5. Filter worklogs by date range
// Example: /api/worklogs/filter/range?start=2025-01-01&end=2025-01-31
app.get("/api/worklogs/filter/range", (req, res) => {
    const { start, end } = req.query; // Get dates from query parameters

    if (!start || !end) {
        return res
            .status(400)
            .json({ error: "Please provide both start and end dates" });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    // Filter worklogs within the date range
    const filtered = worklogs.filter((log) => {
        const logDate = new Date(log.date);
        return logDate >= startDate && logDate <= endDate;
    });

    res.json(filtered);
});

const excelDateToJSDate = (serial) => {
    if (typeof serial === "number") {
        const utc_days = Math.floor(serial - 25569);
        const utc_value = utc_days * 86400;
        return new Date(utc_value * 1000);
    }
    return new Date(serial);
};

// 6. Upload Excel/CSV file
// This reads an Excel or CSV file and adds all rows as worklogs
app.post("/api/upload", upload.single("file"), (req, res) => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                error: "No file uploaded",
                details: "Please select a file to upload.",
            });
        }

        // Read the uploaded file using xlsx library
        let workbook;
        try {
            workbook = xlsx.readFile(req.file.path);
        } catch (parseError) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                error: "Cannot read file",
                details: `The file appears to be corrupted or is not a valid Excel/CSV file.\n\nTechnical details: ${parseError.message}`,
            });
        }

        const sheetName = workbook.SheetNames[0]; // Get first sheet
        if (!sheetName) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                error: "Empty workbook",
                details:
                    "The uploaded file has no sheets. Please ensure your Excel file contains at least one sheet with data.",
            });
        }

        const worksheet = workbook.Sheets[sheetName];

        // Convert Excel sheet to JSON (array of objects)
        const data = xlsx.utils.sheet_to_json(worksheet);

        // Check if data is empty
        if (!data || data.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                error: "No data found",
                details: `The sheet "${sheetName}" is empty or has no readable data.\n\nPlease ensure your file has:\n• A header row with column names\n• At least one row of data below the headers`,
            });
        }

        // Check for required columns (at least one identifier)
        const firstRow = data[0];
        const columns = Object.keys(firstRow);

        const requiredColumns = {
            date: ["Date", "date", "DATE"],
            jiraId: [
                "JIRA ID",
                "jiraId",
                "Jira ID",
                "JIRA_ID",
                "jira_id",
                "Ticket",
                "ticket",
            ],
            description: [
                "Description",
                "description",
                "DESCRIPTION",
                "Task",
                "task",
            ],
            timeLogged: [
                "Time Logged",
                "timeLogged",
                "Time",
                "time",
                "Hours",
                "hours",
                "Duration",
                "duration",
            ],
        };

        const missingColumns = [];
        const foundColumns = {};

        for (const [key, aliases] of Object.entries(requiredColumns)) {
            const found = aliases.find((alias) => columns.includes(alias));
            if (found) {
                foundColumns[key] = found;
            } else {
                missingColumns.push(key);
            }
        }

        // Require at least Date and either JIRA ID or Description
        if (!foundColumns.date) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                error: "Missing required column: Date",
                details: `Could not find a "Date" column in your file.\n\nFound columns: ${columns.join(", ")}\n\nExpected column names:\n• Date, date, or DATE\n\nPlease rename your column and try again.`,
            });
        }

        if (!foundColumns.jiraId && !foundColumns.description) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                error: "Missing required columns",
                details: `Your file must have at least a "JIRA ID" or "Description" column.\n\nFound columns: ${columns.join(", ")}\n\nExpected column names:\n• JIRA ID, Jira ID, Ticket\n• Description, Task\n\nPlease add the required columns and try again.`,
            });
        }

        // Validate each row and collect errors
        const rowErrors = [];
        const validLogs = [];

        data.forEach((row, index) => {
            const rowNum = index + 2; // +2 because of header row and 0-indexing
            const errors = [];

            // Check date
            const dateValue = row.Date || row.date;
            if (!dateValue) {
                errors.push("Missing date");
            }

            // Check time logged format if present
            const timeValue =
                row["Time Logged"] || row.timeLogged || row.Time || row.time;
            if (timeValue && typeof timeValue === "string") {
                // Simple validation - should contain h or m or be a number
                if (!/\d/.test(timeValue)) {
                    errors.push(`Invalid time format: "${timeValue}"`);
                }
            }

            if (errors.length > 0) {
                rowErrors.push({ row: rowNum, errors });
            }

            // Create the log entry
            validLogs.push({
                id: Date.now() + Math.random(),
                date: dateValue ? excelDateToJSDate(dateValue) : "",
                jiraId:
                    row["JIRA ID"] ||
                    row.jiraId ||
                    row["Jira ID"] ||
                    row.Ticket ||
                    "N/A",
                description:
                    row.Description || row.description || row.Task || "",
                timeLogged:
                    row["Time Logged"] ||
                    row.timeLogged ||
                    row.Time ||
                    row.time ||
                    "",
                status: row["Remarks/Status"] || row.status || row.Status || "",
                projectName:
                    row["Project Name"] || row.projectName || row.Project || "",
                remarks: row.Remarks || row.remarks || "",
                createdAt: new Date(),
            });
        });

        // If there are row errors, report them but still try to import valid data
        if (rowErrors.length > 0 && rowErrors.length === data.length) {
            // All rows have errors
            fs.unlinkSync(req.file.path);
            const errorDetails = rowErrors
                .slice(0, 5)
                .map((e) => `Row ${e.row}: ${e.errors.join(", ")}`)
                .join("\n");

            return res.status(400).json({
                error: "All rows have validation errors",
                details: `Every row in your file has issues:\n\n${errorDetails}${rowErrors.length > 5 ? `\n\n...and ${rowErrors.length - 5} more rows with errors` : ""}\n\nPlease fix these issues and try again.`,
            });
        }

        // Add all valid logs to our worklogs array
        worklogs = validLogs.map((l, i) => ({
            ...l,
            id: Date.now() + i,
        }));

        // Delete the temporary uploaded file to save space
        fs.unlinkSync(req.file.path);

        // Include warnings if some rows had issues
        const response = {
            message: "File uploaded successfully",
            count: validLogs.length,
        };

        if (rowErrors.length > 0) {
            response.warnings = `${rowErrors.length} row(s) had minor issues but were imported with defaults.`;
        }

        res.json(response);
    } catch (error) {
        console.error("Upload error:", error);
        // Clean up file if it exists
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            error: "Failed to process file",
            details: `An unexpected error occurred while processing your file.\n\nError: ${error.message}\n\nPlease ensure your file is a valid Excel (.xlsx) or CSV (.csv) file and try again.`,
        });
    }
});

// 7. Update/Edit a worklog
// Example: PUT /api/worklogs/1234567890
app.put("/api/worklogs/:id", (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;

    // Find the worklog index
    const index = worklogs.findIndex((log) => log.id == id);

    if (index === -1) {
        return res.status(404).json({ error: "Worklog not found" });
    }

    // Update the worklog while keeping the original ID and createdAt
    worklogs[index] = {
        ...worklogs[index],
        ...updatedData,
        id: worklogs[index].id, // Keep original ID
        createdAt: worklogs[index].createdAt, // Keep original creation time
        updatedAt: new Date(), // Add update timestamp
    };

    res.json({
        message: "Updated successfully",
        worklog: worklogs[index],
    });
});

// 8. Delete a worklog
// Example: DELETE /api/worklogs/1234567890
app.delete("/api/worklogs/:id", (req, res) => {
    const { id } = req.params;

    // Filter out the worklog with this ID (remove it)
    worklogs = worklogs.filter((log) => log.id != id);

    res.json({ message: "Deleted successfully" });
});

// 8.1. Clear all worklogs
// Example: DELETE /api/worklogs
app.delete("/api/worklogs", (req, res) => {
    worklogs = [];
    res.json({ message: "All worklogs cleared successfully" });
});

// 8. Get statistics
// This calculates and returns stats about worklogs
app.get("/api/stats", (req, res) => {
    // Extract unique project names using Set
    const uniqueProjects = [...new Set(worklogs.map((log) => log.projectName))];

    const stats = {
        totalLogs: worklogs.length,
        projects: uniqueProjects,
        totalProjects: uniqueProjects.length,
    };

    res.json(stats);
});

// 9. Get worklogs grouped by date
// This groups all worklogs by their date
app.get("/api/worklogs/grouped/dates", (req, res) => {
    const grouped = {};

    // Go through each worklog and group by date
    worklogs.forEach((log) => {
        const dateKey = log.date
            ? new Date(log.date).toISOString().split("T")[0]
            : "No Date";

        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }

        grouped[dateKey].push(log);
    });

    res.json(grouped);
});

// ============= START SERVER =============
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📝 Backend is ready to accept requests`);
    console.log(`🔧 Available endpoints:`);
    console.log(`   - GET  /api/worklogs - Get all worklogs`);
    console.log(`   - POST /api/worklogs - Add new worklog`);
    console.log(`   - PUT  /api/worklogs/:id - Update/Edit worklog`);
    console.log(`   - GET  /api/worklogs/filter/date/:date - Filter by date`);
    console.log(
        `   - GET  /api/worklogs/filter/project/:name - Filter by project`,
    );
    console.log(`   - GET  /api/worklogs/filter/range - Filter by date range`);
    console.log(`   - POST /api/upload - Upload Excel/CSV file`);
    console.log(`   - DELETE /api/worklogs/:id - Delete worklog`);
    console.log(`   - GET  /api/stats - Get statistics`);
    console.log(
        `   - GET  /api/worklogs/grouped/dates - Get worklogs grouped by date`,
    );
});
