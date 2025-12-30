

export const EmailVal = (emailValue: string) => {
    const regex = /^[A-Za-z0-9_\.\-]+@[A-Za-z0-9\-]+\.[A-za-z0-9\-]+/;
    return regex.test(emailValue);
}

export const PasswordVal = (passwordValue: string) => {
    const regex = /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{8,15}$/;
    return regex.test(passwordValue)
}

export const PasswodErrorMessage = (passwordValue: string) => {
    if(!passwordValue) return '';
    if (!PasswordVal(passwordValue)) return '비밀번호는 8글자 이상 및 특수문자를 포함해야 합니다.';
    return '';
}

export const NicknameVal = (nicknameValue: string) => {
    const regex = /^.{2,}$/;
    return regex.test(nicknameValue);
}


export const NameVal = (nameValue: string) => {
    const regex = /^[가-힣]{2,5}$/;
    return regex.test(nameValue);
}

export const CodeVal = (codeValue: string) => {
    const regex = /^[0-9]{6}$/;
    return regex.test(codeValue);
}

export const TitleVal = (titleValue: string) => {
    const regex = /^.{3,}$/;
    return regex.test(titleValue);
}

export const ContentVal = (contentValue: string) => {
    const regex = /^.{1, 500}$/;
    return regex.test(contentValue)
}

export const CommentsVal = (commentValue: string) => {
    const regex = /^.{1, 100}$/;
    return regex.test(commentValue);
}