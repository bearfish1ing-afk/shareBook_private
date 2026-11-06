import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar.js";
import api from "./api";
import "./ProfileEdit.css";

const ProfileEdit=()=>{
    const navigate=useNavigate();
    const fileInputRef=useRef(null);
    const [name, setName] = useState("");
    const [currentImage, setCurrentImage] = useState(null); // 서버에서 온 기존 이미지
    const [selectedFile, setSelectedFile] = useState(null); // 새로 고른 파일
    const [previewUrl, setPreviewUrl] = useState(null); //파일 미리보기
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(()=>{
        const fetchProfile=async ()=>{
            try{
                const res=await api.get("/api/v1/user/me");
                setName(res.data.name || "");
                setCurrentImage(res.data.profileImage || null);
            }catch(err){
                console.error("프로필 로딩 실패:", err);
                setError("프로필을 불러오지 못했습니다.");
            }finally {
                setLoading(false);
            }
        };
        fetchProfile();
    },[]);

    // 이미지를 최대 maxSize(px) 안으로 줄이고 JPEG로 압축해서 File로 반환
    const resizeImage = (file, maxSize = 800, quality = 0.85) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(url);

                // 비율 유지하면서 축소 (원본이 작으면 그대로)
                const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
                const w = Math.round(img.width * scale);
                const h = Math.round(img.height * scale);

                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                canvas.getContext("2d").drawImage(img, 0, 0, w, h);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) return reject(new Error("이미지 변환 실패"));
                        resolve(new File([blob], "profile.jpg", { type: "image/jpeg" }));
                    },
                    "image/jpeg",
                    quality
                );
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error("이미지를 읽을 수 없습니다"));
            };
            img.src = url;
        });
    };

    const handleFileChange=async(e)=>{
        const file=e.target.files[0];
        if(!file)return;

        if(!file.type.startsWith("image/")){
            setError("이미지 파일만 업로드할 수 있습니다.");
            return;
        }

        try{
            setError("");
            const resized = await resizeImage(file);
            setSelectedFile(resized);
            setPreviewUrl(URL.createObjectURL(resized));
        }catch (err) {
            console.error(err);
            setError("이미지 처리에 실패했습니다.");
        }
    };

    //미리보기 url 메모리 해제
    useEffect(() => {
        return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
    }, [previewUrl]);


    const handleSave=async()=>{
        if(!name.trim()){
            setError("이름 입력해주세요.");
            return;
        }
        setSaving(true);
        setError("");

        try{
            const formData=new FormData();
            formData.append("name", name.trim());
            if (selectedFile) {
                formData.append("profileImage", selectedFile);
            }
            await api.patch("/api/v1/user/update", formData);
            navigate(-1);//프로필 페이지로 복귀
        }catch(err){
            console.error("프로필 수정 실패:", err);
            setError("저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setSaving(false);
        }
    };
    const displayImage = previewUrl || currentImage;

    if (loading) {
        return (
            <div className="profile-layout">
                <Sidebar />
                <div className="edit-page"><div className="edit-loading">불러오는 중...</div></div>
            </div>
        );
    }
    return (
        <div className="profile-layout">
            <Sidebar />
            <div className="edit-page">
                <div className="edit-card">
                    {/* 다크 사선 배너 (프로필 카드와 동일한 무드) */}
                    <div className="edit-banner">
                        <span className="edit-banner-title">프로필 수정</span>
                    </div>

                    <div className="edit-body">
                        {/* 아바타 + 사진 변경 */}
                        <div className="edit-avatar-wrap">
                            <div
                                className="edit-avatar"
                                onClick={() => fileInputRef.current.click()}
                                title="사진 변경"
                            >
                                {displayImage ? (
                                    <img src={displayImage} alt="profile" />
                                ) : (
                                    <div className="edit-avatar-placeholder">
                                        {name ? name.charAt(0) : "?"}
                                    </div>
                                )}
                                <div className="edit-avatar-overlay">📷 변경</div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={handleFileChange}
                            />
                        </div>

                        {/* 이름 입력 */}
                        <div className="edit-field">
                            <label className="edit-label">이름</label>
                            <input
                                className="edit-input"
                                type="text"
                                value={name}
                                maxLength={20}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="이름을 입력하세요"
                            />
                        </div>

                        {error && <p className="edit-error">{error}</p>}

                        {/* 버튼 */}
                        <div className="edit-actions">
                            <button className="edit-btn-cancel" onClick={() => navigate(-1)} disabled={saving}>
                                취소
                            </button>
                            <button className="edit-btn-save" onClick={handleSave} disabled={saving}>
                                {saving ? "저장 중..." : "저장"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileEdit;