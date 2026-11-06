export const getCurrentUserId = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.userId ?? null;
    } catch (e) {
        console.error('토큰 디코딩 실패:', e);
        return null;
    }
};