// 기본적으로 axios를 사용하여 API 호출을 관리하는 파일 json 형식으로 Content-Type 설정을 매번 요청을 방지하고 여기서 세팅을 하여 모든 요청에 적용을 하도록 하기 위함
import axios from "axios"

// Zustand store에서 토큰을 가져오기 위한 함수
const getTokenFromStore = () => {
  if (typeof window !== 'undefined') {
    try {
      const authStore = localStorage.getItem('auth-store')
      if (authStore) {
        const parsed = JSON.parse(authStore)
        return {
          accessToken: parsed.state?.accessToken || null,
          refreshToken: parsed.state?.refreshToken || null,
        }
      }
    } catch (error) {
      console.error('Error reading token from store:', error)
    }
  }
  return { accessToken: null, refreshToken: null }
}

// Zustand store에 새 accessToken 저장하는 함수
const updateAccessTokenInStore = (newAccessToken: string) => {
  if (typeof window !== 'undefined') {
    try {
      const authStore = localStorage.getItem('auth-store')
      if (authStore) {
        const parsed = JSON.parse(authStore)
        parsed.state.accessToken = newAccessToken
        localStorage.setItem('auth-store', JSON.stringify(parsed))
      }
    } catch (error) {
      console.error('Error updating token in store:', error)
    }
  }
}

// JWT 토큰 디코딩 (만료 시간 확인용)
const decodeJWT = (token: string): { exp: number; iat: number } | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

// Access Token이 곧 만료되는지 확인 (1분 이내 만료)
const isTokenExpiringSoon = (token: string | null): boolean => {
  if (!token) return true;
  
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  const expirationTime = decoded.exp * 1000; // 초를 밀리초로 변환
  const currentTime = Date.now();
  const timeUntilExpiry = expirationTime - currentTime;
  
  // 1분 이내 만료되면 true
  return timeUntilExpiry < 60 * 1000;
};

// 토큰 갱신 함수 (외부에서 호출 가능)
export const refreshToken = async (): Promise<boolean> => {
  try {
    const { accessToken, refreshToken: refreshTokenValue } = getTokenFromStore();
    
    // Access Token이 아직 유효하면 갱신하지 않음 (1분 이내 만료될 때만)
    if (accessToken && !isTokenExpiringSoon(accessToken)) {
      return false; // 갱신 불필요
    }
    
    if (!refreshTokenValue) {
      console.log('Refresh Token이 없습니다.');
      return false;
    }

    const response = await axios.post(
      `${baseURL}/user/refresh`,
      { refreshToken: refreshTokenValue },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    const { accessToken: newAccessToken } = response.data;

    if (newAccessToken) {
      updateAccessTokenInStore(newAccessToken);
      console.log('Access Token이 갱신되었습니다.');
      return true;
    }

    return false;
  } catch (error) {
    console.error('토큰 갱신 실패:', error);
    return false;
  }
}

const baseURL =
  process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim().length > 0
    ? process.env.NEXT_PUBLIC_API_URL
    : "http://localhost:8000"

if (process.env.NODE_ENV !== "production") {
  console.log("API baseURL:", baseURL)
}

const API = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
})


// 요청 인터셉터: accessToken 헤더 주입
// API.interceptors.request.use(
//     (config) => {
//         const token = localStorage.getItem("accessToken")
//         if (token) {
//             config.headers.Authorization = `Bearer ${token}`
//         }
//         console.log('API request:', config)
//         return config;

//     },
//     (error) => Promise.reject(error)
// );
API.interceptors.request.use(
    (config) => {
        const { accessToken } = getTokenFromStore()
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`
        }
        return config;
    },
    (error) => Promise.reject(error)
);


// 응답 인터셉터: 401 처리 및 자동 토큰 갱신
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    
    failedQueue = [];
};

API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // 401 에러이고, 이미 재시도한 요청이 아닌 경우
        if (error.response?.status === 401 && !originalRequest._retry) {
            // 이미 토큰 갱신 중이면 대기열에 추가
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return API(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const { refreshToken } = getTokenFromStore();

            if (!refreshToken) {
                // Refresh Token이 없으면 로그아웃 처리
                processQueue(error, null);
                isRefreshing = false;
                // 로그아웃 처리 (선택사항)
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('auth-store');
                    window.location.href = '/user/login';
                }
                return Promise.reject(error);
            }

            try {
                // Refresh Token으로 새 Access Token 요청
                const response = await axios.post(
                    `${baseURL}/user/refresh`,
                    { refreshToken },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    }
                );

                const { accessToken } = response.data;

                if (accessToken) {
                    // 새 Access Token을 store에 저장
                    updateAccessTokenInStore(accessToken);

                    // 원래 요청의 헤더에 새 토큰 설정
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                    // 대기 중인 요청들 처리
                    processQueue(null, accessToken);
                    isRefreshing = false;

                    // 원래 요청 재시도
                    return API(originalRequest);
                } else {
                    throw new Error('No access token in response');
                }
            } catch (refreshError) {
                // Refresh Token도 만료되었거나 유효하지 않은 경우
                processQueue(refreshError, null);
                isRefreshing = false;

                // 로그아웃 처리
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('auth-store');
                    window.location.href = '/user/login';
                }

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);  


export default API;