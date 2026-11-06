import React, {useState, useEffect} from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {CirclePicker} from "react-color";
import './JoinColorRoom.css';
import axios from "axios";

const JoinColorRoom = ( {roomData} ) => {
    const roomId= roomData?.data?.id;
    const navigate = useNavigate();
    const location=useLocation();

    const [currentUserId] = useState(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split(" ")[1] || token.split(".")[1]));
            return payload.userId;
        } catch (error) {
            console.error("토큰 파싱 실패:", error);
            return null;
        }
    });

    const[roomInfo,setRoomInfo]=useState(null);
    const [penColor, setPenColor] = useState();
    const customColors = [
        "#f78da7", "#ff8b94", "#ffaaa6", "#ffd3b6", "#dcedc1", "#a8e6cf", "#b8e994",
        "#fab1a0", "#fdcb6e", "#ffeaa7", "#74b9ff", "#a29bfe", "#dfe6e9", "#b2bec3"
    ];

    useEffect(()=>{
        // if (roomInfo) return;
        const fetchRoomData=async()=>{
            try{
                const response=await fetch(`http://localhost:8080/api/v1/rooms/${roomId}`, {method: 'GET'});

                if(!response.ok){
                    throw new Error("방 정보가 없습니다.");
                }


                const json=await response.json();
                setRoomInfo(json.data);
            }catch(error){
                console.error(error);
            }
        };

        fetchRoomData();

    },[roomId]);

    const takenColors = roomInfo?.memberInfo
    ? roomInfo.memberInfo
        .filter(member => member.userId !== currentUserId)
        .map(member => member.penColor?.toLowerCase())
    : [];

    const handleColorChange = (color) => {
        setPenColor(color.hex);
    }

    const handleJoin = async () => {
        try {

            const dto = {
                roomId : roomId,
                joinCode : roomInfo?.joinCode,
                penColor : penColor,

            }
            const token = localStorage.getItem('accessToken');
            const response = await axios.post(`http://localhost:8080/api/v1/rooms/${roomId}/join`, dto, {
                headers: {
                    'Content-Type':'application/json',
                    'Authorization': `Bearer ${token}`
                }
                
            });

            console.log(response)
            // TODO: 입장 성공해도 요청 실패 알람 뜸 //해결 완료
            if(response.status!=200){
                throw new Error("입장 요청 실패");
            }
            navigate(`/room/${roomId}`);//룸 입장 페이지로 이동
        } catch (error) {
            if(error.response?.status==500){
                alert("이미 초대가 완료되었습니다");
                navigate(`/`);
            }
            else{
                console.error("에러", error);
                alert(error.message);
            }
        }
    };


    const hostMember = roomInfo?.memberInfo?.find(m => m.userId === roomInfo.ownerId);//user과 ower아이디 같은 걸 찾기
    const memberCount = roomInfo?.memberInfo?.length || 0;
    return (
        <div>
            <div className="form-container">
                <div className="form-section-row">
                    <label className="roomname">{roomInfo?.name}</label>
                    <div className="form-label-info">
                        <span>HOST : {hostMember ? hostMember.nickname : "알 수 없음"}</span>
                        <span> / </span>
                        <span>현재 멤버 {memberCount}명</span>
                    </div>
                </div>
                <div className="form-section">
                    <label className="form-label">이 방에서 사용할 색상을 선택해주세요</label>
                    <div className="color-picker-join">
                        {customColors.map(color => {
                            // 이미 다른 유저가 사용 중인 색상인지 확인
                            const isTaken = takenColors.includes(color.toLowerCase());

                            return (
                                <button
                                    key={color}
                                    className={`color-swatch-item ${isTaken ? 'is-taken' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => !isTaken && handleColorChange({ hex: color })}
                                    disabled={isTaken}
                                    title={isTaken ? "다른 멤버가 사용 중인 색상입니다" : color}
                                >
                                    {isTaken && <span className="swatch-check-mark">✓</span>}
                                </button>
                            );
                        })}
                    </div>       
                </div>

                <div className="form-submit-container">
                    <button className="submit-btn" onClick={handleJoin}>참여</button>
                </div>
            </div>
        </div>
    );
}


export default JoinColorRoom;
