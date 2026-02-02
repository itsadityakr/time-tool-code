import axios from "axios";
import { API_URL } from "../constants";

/**
 * Fetch all worklogs
 */
export const fetchWorklogs = async () => {
    const response = await axios.get(`${API_URL}/worklogs`);
    return response.data;
};

/**
 * Fetch statistics
 */
export const fetchStats = async () => {
    const response = await axios.get(`${API_URL}/stats`);
    return response.data;
};

/**
 * Create a new worklog
 */
export const createWorklog = async (data) => {
    const response = await axios.post(`${API_URL}/worklogs`, data);
    return response.data;
};

/**
 * Update an existing worklog
 */
export const updateWorklog = async (id, data) => {
    const response = await axios.put(`${API_URL}/worklogs/${id}`, data);
    return response.data;
};

/**
 * Delete a worklog
 */
export const deleteWorklog = async (id) => {
    const response = await axios.delete(`${API_URL}/worklogs/${id}`);
    return response.data;
};

/**
 * Upload a file (Excel/CSV)
 */
export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

/**
 * Clear all worklogs
 */
export const clearWorklogs = async () => {
    const response = await axios.delete(`${API_URL}/worklogs`);
    return response.data;
};
