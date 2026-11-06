import React, {useState, useEffect} from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {TwitterPicker} from "react-color";
import api from './api';

import axios from "axios";

const ColorChange = () => {
    const{roomId}=useParams();
    const navigate = useNavigate();
    const location=useLocation();

    const[roomInfo,setRoomInfo]=useState(location.state?.roomInfo||null);//이전 페이지에서 전달할 내용가져오기
    const [penColor, setPenColor] = useState();

    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                const response = await fetch(
                    `http://localhost:8080/api/v1/rooms/${roomId}`
                );

                if (!response.ok) {
                    throw new Error("방 정보가 없습니다.");
                }

                const json = await response.json();
                setRoomInfo(json.data);
            } catch (error) {
                console.error(error);
            }
        };

        fetchRoomData();
    }, [roomId]);

    const handleChangeColorComplete = (color) => {
        setPenColor(color.hex);
    }

    const colorChoice=async()=>{
         try{
            const token = localStorage.getItem('accessToken');
            const response = await axios.patch(`http://localhost:8080/api/v1/rooms/${roomId}/color`, {
                penColor:penColor,
            },
            {
                headers: {
                    'Content-Type':'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            setRoomInfo(response.data.data);
            alert("색상이 변경되었습니다.");
            navigate(`/room/${roomId}`);
        }catch(error){
            if(error.response.status==500){
                alert("이미 사용하고 있는 색상입니다");
            }
            else{
                alert("색상을 변경하지 못했습니다");
            }
            console.error(error);
        }
    };


    const hostMember = roomInfo?.memberInfo?.find(m => m.userId === roomInfo.ownerId);//user과 ower아이디 같은 걸 찾기
    const memberCount = roomInfo?.memberInfo?.length || 0;
    return (
        <div>
            <h1>{roomInfo?.name}</h1>
            <div>
                <div>자신의 색 변경</div>
                <span>HOST : {hostMember ? hostMember.nickname : "알 수 없음"}</span>
                <span> / </span>
                <span>현재 멤버 {memberCount}명</span>
            </div>
            <TwitterPicker
                color={penColor}
                onChangeComplete={handleChangeColorComplete}
            />
            <button onClick={()=>navigate(`/room/${roomId}`)}>
                취소
            </button>
            <button onClick={colorChoice}>
                색상 변경
            </button>
        </div>
    );
}


export default ColorChange;