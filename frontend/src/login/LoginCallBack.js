import React, {useEffect, useState} from "react";
import {BrowserRouter as Router, Routes, Route, useNavigate, useSearchParams} from 'react-router-dom';

const LoginCallBack = () => {
    const [searchParams]=useSearchParams();
    const navigate = useNavigate();
    useEffect(()=>{
        const token = searchParams.get("accessToken");
        if (token) {
            localStorage.setItem('accessToken', token)
            console.log('토큰 저장 완료: ');
            console.log(token);
            navigate('/', { replace: true });
        } else {
            console.error('로그인 실패: 토큰 없음');
            navigate('/login');
        }

    }, [searchParams, navigate]);

    return (
        <div style={{display: 'flex', justifyContent: 'center', marginTop: '50px'}}>
            <h2> 로그인 처리 중입니다.. 잠시만 기다려 주세요</h2>
        </div>
    );
}
export default LoginCallBack;