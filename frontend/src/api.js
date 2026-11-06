import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080',
    timeout: 5000,
    withCredentials: true, // refreshToken 쿠키를 위해 기본 요청에도 필요
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

// [요청 인터셉터]
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// [응답 인터셉터]
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response && error.response.status === 401 && !originalRequest._retry) {

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                .then(token => {
                    originalRequest.headers['Authorization'] = `Bearer ${token}`;
                    return api(originalRequest);
                })
                .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                console.log('Access Token 만료 감지: 새 토큰 재발급 API 요청 중...');

                const response = await axios.post(
                    'http://localhost:8080/auth/refresh',
                    {},
                    { withCredentials: true }
                );

                const authHeader = response.headers['authorization'] || response.headers['Authorization'];

                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    // 헤더가 없으면 실패로 취급 -> catch로 떨어뜨림
                    throw new Error('No valid Authorization header in refresh response');
                }

                const pureToken = authHeader.substring(7);
                localStorage.setItem('accessToken', pureToken);
                console.log('요청 성공: Access Token 자동 갱신 완료');

                processQueue(null, pureToken);
                isRefreshing = false;

                originalRequest.headers['Authorization'] = `Bearer ${pureToken}`;
                return api(originalRequest);

            } catch (refreshError) {
                processQueue(refreshError, null);
                isRefreshing = false;

                console.error('인증이 만료되었습니다. 다시 로그인해주세요.');
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;