import React, { memo, useCallback, useState } from "react";
import {
    Download,
    Eye,
    EyeOff,
    Merge,
    Split,
    ChevronDown,
    ChevronRight,
    Edit2,
    Trash2,
    ExternalLink,
    AlertCircle,
    List,
    ListTree,
} from "lucide-react";
import { StatusPill } from "../components/UIComponents";
import { ALL_COLUMNS } from "../constants";

const DashboardView = ({
    filteredData,
    mergedDataFull,
    isMerged,
    setIsMerged,
    showOriginal,
    setShowOriginal,
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
}) => {
    // Use full merged data when showOriginal is true, otherwise use filtered data
    const displayData =
        isMerged && showOriginal ? mergedDataFull : filteredData;

    // Calculate stats for the displayed data
    const displayStats =
        isMerged && showOriginal
            ? {
                  ...calculatedStats,
                  totalTime: mergedDataFull.reduce((acc, item) => {
                      const timeStr = item.totalTime || "0h";
                      const h = timeStr.match(/(\d+)h/);
                      const m = timeStr.match(/(\d+)m/);
                      let mins = 0;
                      if (h) mins += parseInt(h[1]) * 60;
                      if (m) mins += parseInt(m[1]);
                      return acc + mins;
                  }, 0),
                  entries: mergedDataFull.length,
              }
            : calculatedStats;

    // Format total time for display
    const formatTimeFromMins = (mins) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m > 0 ? `${m}m` : ""}`.trim();
    };

    const displayTotalTime =
        isMerged && showOriginal
            ? formatTimeFromMins(displayStats.totalTime)
            : calculatedStats.totalTime;

    return (
        <div
            className={`rounded-3xl border overflow-hidden backdrop-blur-xl transition-colors duration-500 ${
                isDarkMode
                    ? "bg-black/40 border-white/10"
                    : "bg-white/60 border-white/40 shadow-xl shadow-orange-500/5"
            }`}>
            {/* Table Header */}
            <div className="p-6 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h2
                        className={`text-xl font-bold tracking-tight ${
                            isDarkMode ? "text-white" : "text-gray-900"
                        }`}>
                        Recent Worklogs
                    </h2>
                    <span
                        className={`px-3 py-1 rounded-full border text-xs font-mono ${
                            isDarkMode
                                ? "bg-white/5 border-white/10 text-white/60"
                                : "bg-orange-50 border-orange-100 text-orange-600"
                        }`}>
                        {displayData.length} records • Time: {displayTotalTime}
                        {showOriginal && isMerged && (
                            <span className="ml-1 text-blue-400">
                                (Original)
                            </span>
                        )}
                    </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    {/* Column Toggle */}
                    <div className="relative">
                        <button
                            onClick={() => setShowColumnMenu(!showColumnMenu)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-300 ${
                                isDarkMode
                                    ? "bg-white/5 border-white/10 hover:bg-white/10"
                                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}>
                            {showColumnMenu ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                            Columns
                        </button>

                        {showColumnMenu && (
                            <div
                                className={`absolute right-0 mt-2 w-48 rounded-xl border shadow-xl z-50 ${
                                    isDarkMode
                                        ? "bg-slate-900/95 border-white/10"
                                        : "bg-white border-gray-200"
                                } backdrop-blur-xl`}>
                                <div className="p-2 space-y-1">
                                    {ALL_COLUMNS.map((col) => (
                                        <label
                                            key={col.key}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                                isDarkMode
                                                    ? "hover:bg-white/5"
                                                    : "hover:bg-gray-50"
                                            }`}>
                                            <input
                                                type="checkbox"
                                                checked={visibleColumns.includes(
                                                    col.key,
                                                )}
                                                onChange={() =>
                                                    toggleColumnVisibility(
                                                        col.key,
                                                    )
                                                }
                                                className="rounded"
                                            />
                                            <span
                                                className={`text-sm ${
                                                    isDarkMode
                                                        ? "text-white/80"
                                                        : "text-gray-700"
                                                }`}>
                                                {col.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Show Original (only in merged mode) */}
                    {isMerged && (
                        <button
                            onClick={() => setShowOriginal(!showOriginal)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-300 ${
                                showOriginal
                                    ? `bg-blue-500/20 border-blue-500/50 text-blue-400`
                                    : isDarkMode
                                      ? "bg-white/5 border-white/10 hover:bg-white/10"
                                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}>
                            {showOriginal ? (
                                <List className="w-4 h-4" />
                            ) : (
                                <ListTree className="w-4 h-4" />
                            )}
                            {showOriginal ? "Hide Original" : "Show Original"}
                        </button>
                    )}

                    {/* Merge/Unmerge */}
                    <button
                        onClick={() => {
                            setIsMerged(!isMerged);
                            setExpandedRows({});
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-300 ${
                            isMerged
                                ? `bg-orange-500/20 border-orange-500/50 text-orange-500`
                                : isDarkMode
                                  ? "bg-white/5 border-white/10 hover:bg-white/10"
                                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}>
                        {isMerged ? (
                            <Split className="w-4 h-4" />
                        ) : (
                            <Merge className="w-4 h-4" />
                        )}
                        {isMerged ? "Unmerge" : "Merge"}
                    </button>

                    {/* Export CSV */}
                    <button
                        onClick={exportToCSV}
                        className={`p-2 rounded-lg border transition-colors ${
                            isDarkMode
                                ? "bg-white/5 border-white/10 hover:bg-white/10"
                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                        title="CSV">
                        <Download className="w-4 h-4" />
                    </button>

                    {/* Export Excel */}
                    <button
                        onClick={exportToXLSX}
                        className={`p-2 rounded-lg border transition-colors ${
                            isDarkMode
                                ? "bg-white/5 border-white/10 hover:bg-white/10"
                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                        title="Excel">
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table
                    className="w-full text-left text-sm"
                    style={{ tableLayout: "fixed" }}>
                    <thead
                        className={`${
                            isDarkMode
                                ? "bg-white/5 text-white/50"
                                : "bg-orange-50/50 text-gray-500"
                        } text-xs uppercase tracking-wider font-medium sticky top-0 z-20`}>
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
                        className={`divide-y ${
                            isDarkMode ? "divide-white/5" : "divide-gray-100"
                        }`}>
                        {displayData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={getVisibleColumns().length + 2}
                                    className={`p-12 text-center ${
                                        isDarkMode
                                            ? "text-white/30"
                                            : "text-gray-400"
                                    }`}>
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <AlertCircle className="w-10 h-10" />
                                        <p>No logs found</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            displayData.map((item, idx) => (
                                <React.Fragment key={item.id}>
                                    <tr
                                        className={`group transition-all duration-200 cursor-default ${idx < 20 ? "animate-fade-in-up" : ""} ${
                                            isDarkMode
                                                ? "hover:bg-white/5"
                                                : "hover:bg-orange-50/30"
                                        }`}>
                                        {isMerged && (
                                            <td className="p-4">
                                                <button
                                                    onClick={() =>
                                                        setExpandedRows(
                                                            (prev) => ({
                                                                ...prev,
                                                                [item.id]:
                                                                    !prev[
                                                                        item.id
                                                                    ],
                                                            }),
                                                        )
                                                    }
                                                    className={`p-1 rounded-md transition-colors ${
                                                        isDarkMode
                                                            ? "hover:bg-white/10 text-white/60"
                                                            : "hover:bg-gray-100 text-gray-400"
                                                    }`}>
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
                                                className={`p-4 font-medium truncate ${
                                                    isDarkMode
                                                        ? "text-white/90"
                                                        : "text-gray-900"
                                                }`}
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
                                                        className={`text-[10px] ${
                                                            isDarkMode
                                                                ? "text-white/40"
                                                                : "text-gray-400"
                                                        }`}>
                                                        to{" "}
                                                        {formatDate(
                                                            item.endDate,
                                                        )}
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
                                                    href={getJiraUrl(
                                                        item.jiraId,
                                                    )}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded font-mono text-xs transition-colors ${
                                                        isDarkMode
                                                            ? "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-orange-400"
                                                            : "bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-600"
                                                    }`}>
                                                    {item.jiraId}
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </td>
                                        )}

                                        {visibleColumns.includes(
                                            "description",
                                        ) && (
                                            <td
                                                className={`p-4 truncate ${
                                                    isDarkMode
                                                        ? "text-white/80"
                                                        : "text-gray-600"
                                                }`}
                                                style={{
                                                    width: columnWidths.description,
                                                }}
                                                title={item.description}>
                                                {item.description}
                                                {isMerged && (
                                                    <span
                                                        className={`ml-2 text-xs ${
                                                            isDarkMode
                                                                ? "text-white/40"
                                                                : "text-gray-400"
                                                        }`}>
                                                        ({item.entryCount}{" "}
                                                        entries)
                                                    </span>
                                                )}
                                            </td>
                                        )}

                                        {visibleColumns.includes(
                                            "timeLogged",
                                        ) && (
                                            <td
                                                className={`p-4 font-mono truncate ${
                                                    isDarkMode
                                                        ? "text-white/90"
                                                        : "text-gray-800"
                                                }`}
                                                style={{
                                                    width: columnWidths.timeLogged,
                                                }}>
                                                {isMerged
                                                    ? item.totalTime
                                                    : item.timeLogged}
                                            </td>
                                        )}

                                        {!isMerged &&
                                            visibleColumns.includes(
                                                "status",
                                            ) && (
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

                                        {visibleColumns.includes(
                                            "projectName",
                                        ) && (
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
                                            visibleColumns.includes(
                                                "remarks",
                                            ) && (
                                                <td
                                                    className={`p-4 text-xs truncate ${
                                                        isDarkMode
                                                            ? "text-white/60"
                                                            : "text-gray-500"
                                                    }`}
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
                                                            setCurrentEntry(
                                                                item,
                                                            );
                                                            setModalMode(
                                                                "edit",
                                                            );
                                                            setIsModalOpen(
                                                                true,
                                                            );
                                                        }}
                                                        className={`p-2 rounded-lg transition-colors ${
                                                            isDarkMode
                                                                ? "hover:bg-blue-500/20 text-blue-300"
                                                                : "hover:bg-blue-50 text-blue-600"
                                                        }`}>
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() =>
                                                        handleDelete(item.id)
                                                    }
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        isDarkMode
                                                            ? "hover:bg-red-500/20 text-red-300"
                                                            : "hover:bg-red-50 text-red-600"
                                                    }`}>
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Expanded Merged Row */}
                                    {isMerged && expandedRows[item.id] && (
                                        <tr
                                            className={`${
                                                isDarkMode
                                                    ? "bg-white/5"
                                                    : "bg-gray-50"
                                            } animate-fade-in`}>
                                            <td
                                                colSpan={
                                                    getVisibleColumns().length +
                                                    2
                                                }
                                                className="p-0">
                                                <div className="p-4 pl-16 grid gap-2">
                                                    {item.originalEntries.map(
                                                        (sub, i) => (
                                                            <div
                                                                key={i}
                                                                className={`flex items-center justify-between p-3 rounded-lg border text-sm ${
                                                                    isDarkMode
                                                                        ? "bg-black/20 border-white/5"
                                                                        : "bg-white border-gray-200"
                                                                }`}>
                                                                <div className="flex gap-4 flex-1">
                                                                    <span
                                                                        className={`w-24 font-mono text-xs ${
                                                                            isDarkMode
                                                                                ? "text-white/40"
                                                                                : "text-gray-400"
                                                                        }`}>
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
                                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-xs transition-colors ${
                                                                            isDarkMode
                                                                                ? "bg-white/5 border border-white/10 text-white/70 hover:text-orange-400"
                                                                                : "bg-gray-100 text-gray-600 hover:text-orange-600"
                                                                        }`}>
                                                                        {
                                                                            sub.jiraId
                                                                        }
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
                                                                        className={`font-mono text-xs ${
                                                                            isDarkMode
                                                                                ? "text-white/60"
                                                                                : "text-gray-500"
                                                                        }`}>
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
};

export default memo(DashboardView);
