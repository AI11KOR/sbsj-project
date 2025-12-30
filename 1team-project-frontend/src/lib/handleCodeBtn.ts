// emailApi 로 설정했던 api를 이용하여 인증관련 버튼 클릭시 해당 api로 요청을 보내고 응답을 처리하는 함수


import { sendEmailCode, verifyEmailCode, sendEmailResetCode, verifyEmailResetCode } from "@/src/api/emailApi"
import { EmailVal, CodeVal } from "@/src/lib/validation"; // 유효성 검사에 대한 모든 함수를 가져옴

export const handleEmailBtn = ({ email, onSuccess }: { email:string, onSuccess:() => void }) => {
    const handleSendClick = async () => {
        if(!email) {
            alert('이메일을 입력하세요');
            return;
        }

        if(!EmailVal(email)) {
            alert('이메일 형식이 올바르지 않습니다');
            return;
        }

        try {
            const response = await sendEmailCode(email);
            // 실제 이메일 전송 성공
            if (response?.code && !response?.devMode) {
                alert('이메일 전송에 성공했습니다. 이메일을 확인하고 3분내 입력해 주세요');
            } 
            // 개발 모드: 이메일 전송 실패했지만 코드는 생성됨
            else if (response?.devMode && response?.code) {
                console.log('🔐 개발 모드 - 인증 코드:', response.code);
                alert(`이메일 전송에 실패했습니다.\n\n인증 코드: ${response.code}\n(콘솔에서도 확인 가능)\n\n⚠️ 실제 이메일을 받으려면 네이버 앱 비밀번호를 설정해주세요.`);
            } 
            // 일반 성공
            else {
                alert('이메일 전송에 성공했습니다. 3분내 입력해 주세요');
            }
            onSuccess();
        } catch (error: any) {
            if(error.response?.data?.message?.includes('이미 회원가입')) {
                alert('이미 회원가입 된 이메일입니다.');
                return;
            } else {
                alert('이메일 전송에 실패했습니다.');
                return;
            }
        }
    }

    return handleSendClick;
}


export const handleVerifyBtn = ({ email, code, onSuccess }: { email:string, code:number, onSuccess:() => void}) => {
    const handleVerifyClick = async () => {
        if(!email) {
            alert('이메일을 입력하세요');
            return;
        }

        if(!CodeVal(code.toString().trim())) {
            alert('코드 형식이 올바르지 않습니다');
            return;
        }

        try {
            await verifyEmailCode(email, code);
            alert('인증 코드가 일치합니다.');
            onSuccess();
        } catch (error: any) {
            if(error.response?.data?.message === '인증 코드가 일치하지 않습니다.') {
                alert('인증 코드가 일치하지 않습니다.');
                return;
            } else {
                alert('인증 코드 확인에 실패했습니다.');
                return;
            }
        }
    }
    return handleVerifyClick;
}

export const handleSendResetBtn = ({ email, onSuccess }: { email:string, onSuccess:() => void }) => {
    const handleSendResetClick = async () => {

        if(!email) {
            alert('이메일을 입력하세요');
            return;
        }

        if(!EmailVal(email)) {
            alert('이메일 형식이 올바르지 않습니다');
            return;
        }

        try {
            const response = await sendEmailResetCode(email);
            // 실제 이메일 전송 성공
            if (response?.code && !response?.devMode) {
                alert('이메일 전송에 성공했습니다. 이메일을 확인하고 3분내 입력해 주세요');
            } 
            // 개발 모드: 이메일 전송 실패했지만 코드는 생성됨
            else if (response?.devMode && response?.code) {
                console.log('🔐 개발 모드 - 인증 코드:', response.code);
                alert(`이메일 전송에 실패했습니다.\n\n인증 코드: ${response.code}\n(콘솔에서도 확인 가능)\n\n⚠️ 실제 이메일을 받으려면 네이버 앱 비밀번호를 설정해주세요.`);
            } 
            // 일반 성공
            else {
                alert('이메일 전송에 성공했습니다. 3분내 입력해 주세요');
            }
            onSuccess();
        } catch (error: any) {
            if(error.response?.data?.message?.includes('가입되지 않은')) {
                alert('가입되지 않은 이메일입니다.');
                return;
            } else {
                alert('이메일 전송에 실패했습니다.');
                return;
            }
        }
    }
    return handleSendResetClick;
}

export const handleVerifyResetBtn = ({ email, code, onSuccess }: { email:string, code:number, onSuccess:() => void }) => {
    const handleVerifyResetClick = async () => {
        if(!email) {
            alert('이메일을 입력하세요');
            return;
        }

        if(!CodeVal(code.toString())) {
            alert('코드 형식이 올바르지 않습니다');
            return;
        }

        try {
            await verifyEmailResetCode(email, code);
            alert('비밀번호 재설정에 성공했습니다.');
            onSuccess();
        } catch (error: any) {
            if(error.response?.data?.message === '인증 코드가 일치하지 않습니다.') {
                alert('인증 코드가 일치하지 않습니다.');
                return;
            } else {
                alert('인증 코드 확인에 실패했습니다.');
                return;
            }
        }
    }
    return handleVerifyResetClick;
}