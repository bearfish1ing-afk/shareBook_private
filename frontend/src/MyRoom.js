import React, {useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";

const MyRoom = () => {
    const [rooms, setRooms] = useState([]);
    const navigate= useNavigate();

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:8080/api/v1/rooms/my', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();

            if (result.success) {
                setRooms(result.data);
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("데이터 로딩 실패", error);
        }
    };

    return (
        <div className="roomlist-container">
            <h2>📖 내 공유독서방</h2>
            <div className="room-list">
                {rooms.map((room)=> (
                    <div key={room.roomId} className="room-card"
                    onClick={() => navigate(`/room/${room.roomId}`)}>
                        <div className="room-header">
                            <h3>{room.name}</h3>
                            <span className="color-dot" style={{backgroundColor: room.penColor}} ></span>
                        </div>
                        <div className="room-info">
                            {room.isHost ? 'HOST' : 'MEMBER'}
                            <img className="info_icn" src="/home_asset/person_icn.png" alt="menu"/> {room.memberCount}
                            <img className="info_icn" src="/home_asset/book_icn.png" alt="menu"/> {room.bookCount}
                        </div>

                        {/* 사용자 Room.role / 책 권수 */}
                    </div>
                ))}
            </div>
        </div>
    );
}
export default MyRoom