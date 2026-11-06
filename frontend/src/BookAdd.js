import { useState } from "react";
import axios from "axios";
import api from "./api";

function BookAdd(){
    const [isbn,setIsbn]=useState("");
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [coverImageUrl, setCoverImageUrl] = useState(null);
    const [publisher, setPublisher] = useState("");
    const [epubFile, setEpubFile] = useState(null);

    const handleAdd=async()=>{

        try{
            const token = localStorage.getItem('accessToken');

            const formData = new FormData();

            formData.append("isbn", isbn);
            formData.append("title", title);
            formData.append("author", author);
            if (coverImageUrl) {
                formData.append("coverImageUrl", coverImageUrl);
            }
            formData.append("publisher", publisher);
            formData.append("epubFile", epubFile);

            const response = await api.post(`http://localhost:8080/api/v1/books/add`,
                formData
            );

            console.log(response.data);
            alert("책 추가 완료!");

        }catch (error) {
            console.error(error);
            alert("에러 발생");
        }
    }

    return(
        <div>
            <h1>책 추가</h1>

            <input
                type="text"
                placeholder="식별번호"
                value={isbn}
                onChange={(e)=>setIsbn(e.target.value)}
            />

            <input
                type="text"
                placeholder="제목"
                value={title}
                onChange={(e)=>setTitle(e.target.value)}
            />

            <input
                type="text"
                placeholder="작가"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
            />

            <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverImageUrl(e.target.files[0])}
            />

            <input
                type="text"
                placeholder="출판사"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
            />

            <input
                type="file"
                accept=".epub"
                onChange={(e) => setEpubFile(e.target.files[0])}
            />

            <button onClick={handleAdd}>
                수정하기
            </button>
        </div>
    )
}

export default BookAdd;