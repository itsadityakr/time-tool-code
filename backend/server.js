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
            return res.status(400).json({ error: "No file uploaded" });
        }

        // Read the uploaded file using xlsx library
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0]; // Get first sheet
        const worksheet = workbook.Sheets[sheetName];

        // Convert Excel sheet to JSON (array of objects)
        const data = xlsx.utils.sheet_to_json(worksheet);

        // Transform each row into our worklog format
        const newLogs = data.map((row) => ({
            id: Date.now() + Math.random(), // Ensure unique IDs
            date: row.Date
                ? excelDateToJSDate(row.Date)
                : row.date
                  ? new Date(row.date)
                  : "",

            jiraId: row["JIRA ID"] || row.jiraId || "N/A",
            description: row.Description || row.description || "",
            timeLogged: row["Time Logged"] || row.timeLogged || "",
            status: row["Remarks/Status"] || row.status || "",
            projectName: row["Project Name"] || row.projectName || "",
            remarks: row.Remarks || row.remarks || "",
            createdAt: new Date(),
        }));

        // Add all new logs to our worklogs array
        worklogs = newLogs.map((l, i) => ({
            ...l,
            id: Date.now() + i,
        }));

        // Delete the temporary uploaded file to save space
        fs.unlinkSync(req.file.path);

        res.json({
            message: "File uploaded successfully",
            count: newLogs.length,
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Failed to process file" });
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
