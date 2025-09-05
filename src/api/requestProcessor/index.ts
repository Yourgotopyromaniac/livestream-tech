import { Routes } from "@/router";
import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

// Create axios instances
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_API_BASE_URL,
});

export const axiosInstanceUnauth = axios.create({
  baseURL: import.meta.env.VITE_APP_API_BASE_URL,
});

// Authenticated requests: attach access token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = Cookies.get("cvAdminAccess");
    if (accessToken && config.headers) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Basic response interceptor (no refresh retry)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && window.location.pathname !== "/") {
      Cookies.remove("cvAdminAccess");
      window.location.assign(Routes.login);
    }
    return Promise.reject(error);
  }
);

// API Request Functions
interface ApiRequestProps {
  url: string;
  config?: AxiosRequestConfig;
  data?: unknown;
}

export async function getRequest(request: ApiRequestProps) {
  return await axiosInstance.get(request.url, request.config);
}
export async function postRequest(request: ApiRequestProps) {
  return await axiosInstance.post(request.url, request.data, request.config);
}
export async function putRequest(request: ApiRequestProps) {
  return await axiosInstance.put(request.url, request.data, request.config);
}
export async function patchRequest(request: ApiRequestProps) {
  return await axiosInstance.patch(request.url, request.data, request.config);
}
export async function deleteRequest(request: ApiRequestProps) {
  return await axiosInstance.delete(request.url, request.config);
}
