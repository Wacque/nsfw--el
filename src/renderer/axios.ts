// http.js

import axios from 'axios';
import { API_BASE_URL, TOKEN, TOKEN_KEY } from '../../constants';

const http = axios.create({
    baseURL: API_BASE_URL
});

// 请求拦截器
http.interceptors.request.use(
    config => {
        config.headers[TOKEN_KEY] = TOKEN;
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// 响应拦截器
http.interceptors.response.use(
    response => {
        return response.data;
    },
    error => {
        return Promise.reject(error);
    }
);

export default http;
