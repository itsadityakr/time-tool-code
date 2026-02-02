import React from "react";
import { ChevronDown } from "lucide-react";
import { STATUS_CONFIG } from "../constants";

/**
 * Sidebar navigation item
 */
export const SidebarItem = ({
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
        className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-300 group ${
            active
                ? `bg-gradient-to-r ${theme.gradient} shadow-lg shadow-orange-500/20`
                : isDark
                  ? "hover:bg-white/5"
                  : "hover:bg-orange-50"
        }`}>
        <div
            className={`${
                active
                    ? "text-white"
                    : isDark
                      ? "text-white/50 group-hover:text-white"
                      : "text-gray-400 group-hover:text-gray-800"
            }`}>
            {React.cloneElement(icon, { size: 20 })}
        </div>
        {isOpen && (
            <span
                className={`font-medium text-sm ${
                    active
                        ? "text-white"
                        : isDark
                          ? "text-white/60 group-hover:text-white"
                          : "text-gray-500 group-hover:text-gray-900"
                }`}>
                {label}
            </span>
        )}
    </div>
);

/**
 * Glass-style statistics card
 */
export const GlassStatCard = ({
    title,
    value,
    subtitle,
    icon,
    theme,
    delay,
    isDark,
}) => (
    <div
        className={`relative overflow-hidden rounded-3xl p-6 border backdrop-blur-md group transition-all duration-300 animate-fade-in-up ${
            isDark
                ? "border-white/10 bg-white/5 hover:bg-white/10"
                : "border-white/40 bg-white/60 hover:bg-white/80 shadow-xl shadow-orange-500/5"
        }`}
        style={{ animationDelay: `${delay}ms` }}>
        <div
            className={`absolute top-0 right-0 p-32 bg-gradient-to-br ${theme.gradient} opacity-5 blur-2xl rounded-full group-hover:opacity-10 transition-opacity`}></div>
        <div className="relative z-10 flex justify-between items-start">
            <div>
                <p
                    className={`text-sm font-medium uppercase tracking-wider ${
                        isDark ? "text-white/40" : "text-gray-500"
                    }`}>
                    {title}
                </p>
                <h4
                    className={`text-3xl font-bold mt-2 ${
                        isDark ? "text-white/90" : "text-gray-800"
                    }`}>
                    {value}
                </h4>
                {subtitle && (
                    <p
                        className={`text-xs mt-1 ${
                            isDark ? "text-white/30" : "text-gray-400"
                        }`}>
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

/**
 * Glass-style input field
 */
export const GlassInput = ({ label, isDark, ...props }) => (
    <div className="space-y-1">
        <label
            className={`text-xs font-semibold uppercase ${
                isDark ? "text-white/50" : "text-gray-500"
            }`}>
            {label}
        </label>
        <input
            className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all ${
                isDark
                    ? "bg-black/20 border border-white/10 text-white placeholder:text-white/20 focus:border-white/30 focus:ring-white/20"
                    : "bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-200"
            }`}
            {...props}
        />
    </div>
);

/**
 * Glass-style select dropdown
 */
export const GlassSelect = ({ label, options, value, onChange, isDark }) => (
    <div className="space-y-1.5">
        <label
            className={`text-[10px] font-bold uppercase tracking-wider ${
                isDark ? "text-white/30" : "text-gray-400"
            }`}>
            {label}
        </label>
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full appearance-none border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 cursor-pointer transition-all ${
                    isDark
                        ? "bg-white/5 border-white/10 hover:border-white/20 text-white/80 focus:ring-white/20"
                        : "bg-white border-gray-200 hover:border-orange-300 text-gray-700 focus:ring-orange-200"
                }`}>
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
                className={`absolute right-3 top-2.5 w-3 h-3 pointer-events-none ${
                    isDark ? "text-white/30" : "text-gray-400"
                }`}
            />
        </div>
    </div>
);

/**
 * Status pill badge
 */
export const StatusPill = ({ status, size = "md" }) => {
    const config =
        STATUS_CONFIG[status] ||
        "bg-gray-500/20 text-gray-500 border-gray-500/30";
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full border ${config} ${
                size === "sm" ? "text-[10px]" : "text-xs"
            } font-medium`}>
            {status}
        </span>
    );
};
