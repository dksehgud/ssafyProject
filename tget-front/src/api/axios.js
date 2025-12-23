import axios from 'axios'
import { toast } from 'vue-sonner'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
})

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        // Handle global errors here
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    // Unauthorized: Clear token and redirect to login
                    localStorage.removeItem('accessToken')
                    localStorage.removeItem('refreshToken')
                    window.location.href = '/login'
                    toast.error('로그인이 만료되었습니다. 다시 로그인해주세요.')
                    break
                case 403:
                    toast.error('접근 권한이 없습니다.')
                    break
                case 404:
                    // toast.error('요청한 리소스를 찾을 수 없습니다.') // Optional: might be handled in component
                    break
                case 500:
                    toast.error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
                    break
                default:
                    toast.error('알 수 없는 오류가 발생했습니다.')
            }
        } else if (error.request) {
            // The request was made but no response was received
            toast.error('서버와 통신할 수 없습니다. 네트워크 연결을 확인해주세요.')
        } else {
            // Something happened in setting up the request that triggered an Error
            toast.error('요청 중 오류가 발생했습니다.')
        }
        return Promise.reject(error)
    }
)

export default api
