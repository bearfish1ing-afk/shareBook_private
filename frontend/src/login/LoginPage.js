import React from "react";
import {HashRouter as Router, Routes, Route} from 'react-router-dom';
// import Home from './Home';
import './LoginPage.css';
// import { RedirectHandler } from "undici-types";
/*
    홈 .. 에 뭐뭐 필요하지?
    메뉴버튼
    검색창
    퍼블릭에 로고 저장
    
*/

const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
}

const handleNaverLogin = () => {
    window.location.href = "http://localhost:8080/oauth2/authorization/naver";
}
const handleKakaoLogin = () => {
    window.location.href = "http://localhost:8080/oauth2/authorization/kakao";
}
const LoginPage = () => {
    return (
        <div className="login-container">
            <div className="login-curved-background"></div>
            <div className="login-content">
                <h1 className="login-title">로그인 하세요</h1>

                <div className="login-button-group">
                    <button className="login-button google" onClick={handleGoogleLogin}>
                        <img src="/login_button/google.png" alt="Google logo" />
                    </button>

                    <button className="login-button naver" onClick={handleNaverLogin}>
                        <img src="/login_button/naver.png" alt="Naver logo" />            
                    </button>

                    <button className="login-button kakao" onClick={handleKakaoLogin}>                    
                        <img src="/login_button/kakao.png" alt="Kakao logo" />
                    </button>
                </div>
            </div>
        </div>
    );
}
export default LoginPage;