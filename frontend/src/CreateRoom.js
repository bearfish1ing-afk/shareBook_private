import React, {useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import {CirclePicker} from "react-color";

import axios from "axios";
/* 
    요청 : 헤더에 Authorization, name, penColor 
    생성 후 리다이렉트 경로 : 초대링크 안내 url
*/

const CreateRoom = () => {

    const navigate = useNavigate();
    const [data, setData] = useState({name: '', penColor: ''});
    const [isColorPickerClicked, setIsColorPickerClicked] = useState(false);
    const handleChange = (e) => {
        setData({...data, [e.target.name] : e.target.value});
    }

    const handleChangeColorComplete = (color) => {
        setData({...data, penColor: color.hex});
    }

    const customColors = [
        "#f78da7", "#ff8b94", "#ffaaa6", "#ffd3b6", "#dcedc1", "#a8e6cf", "#b8e994",
        "#fab1a0", "#fdcb6e", "#ffeaa7", "#74b9ff", "#a29bfe", "#dfe6e9", "#b2bec3"
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("전송할 데이터:", data);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.post('http://localhost:8080/api/v1/rooms', data, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                const newRoomId = response.data.data.roomId;
                alert("방 생성에 성공하였습니다.");
                navigate(`/room/${newRoomId}`)
                console.log("요청 성공", response.data);
            }

        } catch (error) {
            console.error("에러", error);
        }
    };

    const getRecommendName = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.get('http://localhost:8080/api/v1/rooms/recommend-name');
            console.log("요청 성공", response.data);
            const recommended = response.data;
            setData(prev => ({...prev, name: recommended}));
        } catch (error) {
            console.error("에러", error);
        }

    }


    return (
        <form onSubmit={handleSubmit}>
            <div className="form-container">
                <div className="form-section">
                    <label className="form-label">방 이름을 적어주세요</label>
                    <div className="text-input-container">
                        <input className="text-holder" name="name" value={data.name} onChange={handleChange} placeholder="ex) 경제 스터디" />
                        <button className="emoji-btn" type="button" onClick={getRecommendName}>🔄</button>
                    </div>
                </div>
                
                <div className="form-section">
                    <label className="form-label">이 방에서 사용할 색상을 선택해주세요</label>
                    <div className="color-picker">
                        <CirclePicker
                            width="380px"
                            circleSize={30}
                            circleSpacing={20}
                            colors={customColors}
                            color={data.penColor}
                            onChangeComplete={handleChangeColorComplete} 
                        />
                    </div>  
                </div>
                <div className="form-submit-container">
                    <button className="submit-btn" type="submit">생성</button>
                </div>
            </div>
        </form>
    );
}

export default CreateRoom;
