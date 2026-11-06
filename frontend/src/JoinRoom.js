import React, {useState} from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import JoinColorRoom from "./JoinColorRoom";

/*
    로그인 없어도 접근가능한 url .. ? <- 생각 필요할듯 (어디서 어떻게 접근해야 하는지)
    따라서 응답dto 제한된 정보만 응답하도록 교체(방제 / 방장 이름 / 멤버 컬러인포)
    ........ dto 하나로 일단 막아놨다가 인증완료되면 나머지 정보에도 접근할 수 잇도록 할 수 없나 ..?

    초대코드 조회는 됐다고 콘솔에 뜨는데 입장이 안됨!! 이런미친 .. -> JoinColorRoom 라우팅 url join-color-room 에서 room/join/:roomId 로 변경 [해결(대기실로 이동)]
*/
const JoinRoom = ({onNext}) => {
    const [data, setData] = useState({code: ''});
    const navigate = useNavigate();
    const [responseData, setResponseData] = useState({roomId:'', roomInfo:null})

    const handleChange = (e) => {
        setData({...data, [e.target.name] : e.target.value});
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.get(`http://localhost:8080/api/v1/rooms/search?code=${data.code}`);
            console.log("요청 성공", response.data);
            const roomData = response.data;
            onNext(roomData);
        } catch (error) {
            console.error("에러", error);
        }
    };

    return (
        <form onClick={handleSubmit}>
            <div className="form-container">
            <div className="invite-form-section">
                <label className="form-label">초대코드를 입력하세요</label>
                <div className="text-input-container">
                    <input className="invite-text-holder" name="code" value={data.code} onChange={handleChange} placeholder="123456" />
                </div>
            </div>
            <div className="form-submit-container">
                <button className="submit-btn" type="submit">다음</button>
            </div>
            </div>
        </form>
    );
}

export default JoinRoom;
