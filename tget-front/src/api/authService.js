import api from './axios'

export const authService = {
    async login(credentials) {
        const response = await api.post('/auth/login', credentials)
        return response.data
    },

    async signup(userData) {
        const response = await api.post('/auth/signup', userData)
        return response.data
    },

    async modify(userData) {
        // userData 형식:
        // {
        //   userEmail: string,
        //   name: string,
        //   phone: string,
        //   currentPassword?: string,  // 비밀번호 변경 시에만 필요
        //   newPassword?: string       // 비밀번호 변경 시에만 필요
        // }
        
        const requestData = {
            email: userData.userEmail,
            name: userData.name,
            phone: userData.phone
        }

        // 비밀번호 변경하는 경우
        if (userData.newPassword) {
            requestData.currentPassword = userData.currentPassword
            requestData.password = userData.newPassword
        }

        const response = await api.post('/auth/modify', requestData)
        return response.data
    },

    async logout() {
        // Optional: Call API to invalidate token on server
        // await api.post('/auth/logout')
    },

    async refreshToken() {
        const response = await api.post('/auth/refresh-token')
        return response.data
    },

    async getProfile() {
        const response = await api.get('/auth/me')
        return response.data
    }
}
