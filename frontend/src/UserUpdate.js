import { useState } from "react";
import axios from "axios";
import api from "./api";

function UserUpdate(){
    const [name,setName]=useState("");
    const [profileImage, setProfileImage] = useState("");

    const handleUpdate=async()=>{
        try{
            const response = await api.patch(`http://localhost:8080/api/v1/user/update`,
                {
                    name,
                    profileImage,
                }
            );

            console.log(response.data);
            alert("회원정보 수정 완료!");

        }catch (error) {
            console.error(error);
            alert("에러 발생");
        }
    }

    return(
        <div>
            <h1>회원정보 수정</h1>

            <input
                type="text"
                placeholder="이름"
                value={name}
                onChange={(e)=>setName(e.target.value)}
            />

            <input
                type="text"
                placeholder="프로필 이미지 URL"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
            />

            <button onClick={handleUpdate}>
                수정하기
            </button>
        </div>
    )
}

export default UserUpdate;