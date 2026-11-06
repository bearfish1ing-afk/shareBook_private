import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import "./Sidebar.css";
import SidebarBackground from "./SidebarBackground";

const HomeIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
        <polyline points="9 21 9 12 15 12 15 21"/>
    </svg>
);

const MyPageIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
);


const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('home');

    useEffect(() => {
        if (location.pathname === '/myprofile') {
            setActiveTab('mypage');
        } else {
            setActiveTab('home');
        }
    }, [location.pathname]);

    return (
        <div className="side-box">
            <div className="sidebar-logo">
                <img src="/plyead-logo.png" alt="logo" className="logo-img"/>
            </div>

            <div className="sidebar-nav">
                <div className="figma-slider-container">

                    <SidebarBackground/>

                    <div
                        className="slide-bg"
                        style={{ transform: activeTab === 'mypage' ? 'translateY(48px)' : 'translateY(0px)' }}
                    ></div>

                    {/* 버튼 오버레이 레이어 */}
                    <div className="button-overlay">
                        <button
                            className={`slide-btn ${activeTab === 'home' ? 'active' : ''}`}
                            onClick={() => navigate('/')}
                            title="홈"
                        >
                            <HomeIcon />
                        </button>

                        <button
                            className={`slide-btn ${activeTab === 'mypage' ? 'active' : ''}`}
                            onClick={() => navigate('/myprofile')}
                            title="마이페이지"
                        >
                            <MyPageIcon />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Sidebar;