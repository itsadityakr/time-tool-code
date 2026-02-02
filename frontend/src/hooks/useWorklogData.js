import { useState, useEffect, useMemo } from "react";
import { parseTime, formatTime } from "../utils/helpers";

/**
 * Custom hook for managing worklog data, filters, and calculations
 */
export const useWorklogData = (worklogs, isMerged, filters, searchQuery) => {
    // Pre-filtered data (filters applied before merge)
    const preFilteredData = useMemo(() => {
        let data = [...worklogs];

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
        if (filters.status) {
            data = data.filter((item) => item.status === filters.status);
        }

        // JIRA ID filter
        if (filters.jiraId) {
            data = data.filter((item) => item.jiraId === filters.jiraId);
        }

        // Date filters
        if (filters.showToday) {
            const today = new Date().toISOString().split("T")[0];
            data = data.filter((item) => {
                const itemDate = new Date(item.date)
                    .toISOString()
                    .split("T")[0];
                return itemDate === today;
            });
        } else if (filters.showThisWeek) {
            const today = new Date();
            const day = today.getDay();
            const diff = today.getDate() - day + (day === 0 ? -6 : 1);
            const weekStart = new Date(today.setDate(diff))
                .toISOString()
                .split("T")[0];
            data = data.filter((item) => {
                return new Date(item.date) >= new Date(weekStart);
            });
        } else if (filters.showThisMonth) {
            const today = new Date();
            const monthStart = new Date(
                today.getFullYear(),
                today.getMonth(),
                1,
            )
                .toISOString()
                .split("T")[0];
            data = data.filter((item) => {
                return new Date(item.date) >= new Date(monthStart);
            });
        }

        // Custom date range
        if (filters.dateRange.start) {
            data = data.filter((item) => {
                return new Date(item.date) >= new Date(filters.dateRange.start);
            });
        }

        if (filters.dateRange.end) {
            data = data.filter((item) => {
                return new Date(item.date) <= new Date(filters.dateRange.end);
            });
        }

        return data;
    }, [worklogs, searchQuery, filters]);

    // Merged data calculation (works on pre-filtered data)
    const mergedData = useMemo(() => {
        if (!isMerged) return [];
        const grouped = {};

        const sortedRaw = [...preFilteredData].sort(
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
    }, [preFilteredData, isMerged]);

    // Full merged data (merges ALL worklogs, not filtered - for "Show Original" feature)
    const mergedDataFull = useMemo(() => {
        if (!isMerged) return [];
        const grouped = {};

        // Get all worklogs sorted by date
        const sortedRaw = [...worklogs].sort(
            (a, b) => new Date(a.date) - new Date(b.date),
        );

        sortedRaw.forEach((log) => {
            const key = `${log.jiraId}_${log.projectName}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(log);
        });

        // Only include groups that have at least one entry in the filtered data
        const filteredKeys = new Set(
            preFilteredData.map((log) => `${log.jiraId}_${log.projectName}`),
        );

        return Object.entries(grouped)
            .filter(([key]) => filteredKeys.has(key))
            .map(([key, group], idx) => {
                const totalMinutes = group.reduce(
                    (acc, curr) => acc + parseTime(curr.timeLogged),
                    0,
                );
                return {
                    id: `merged_full_${idx}`,
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
    }, [worklogs, preFilteredData, isMerged]);

    // Filtered data - now simply returns either merged or pre-filtered data
    const filteredData = useMemo(() => {
        return isMerged ? mergedData : preFilteredData;
    }, [preFilteredData, mergedData, isMerged]);

    // Calculated statistics
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
            const date = new Date(item.date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
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

    return {
        mergedData,
        mergedDataFull,
        filteredData,
        calculatedStats,
        analyticsData,
        calendarData,
    };
};
