// 이메일 인증과 관련하여 api를 설정을 하여 버튼 클릭시 이메일 인증 코드를 발송하고 인증 코드를 입력하여 인증을 하는 기능을 구현을 하기 위함

import API from "./axiosApi"

export const sendEmailCode = async (email: string) => {
    const response = await API.post('/api/send-email-code', { email })
    return response.data;
}

export const verifyEmailCode = async (email: string, code: number) => {
    const response = await API.post('/api/verify-email-code', { email, code })
    return response.data;
}

export const sendEmailResetCode = async (email: string) => {
    const response = await API.post('/api/reset/send-code', { email })
    return response.data;
}

export const verifyEmailResetCode = async (email: string, code: number) => {
    const response = await API.post('/api/reset/verify-code', { email, code })
    return response.data;
}

