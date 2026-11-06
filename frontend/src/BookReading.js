import { useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";

import axios from "axios";
/*
  백엔드에서 userId를 받는것이 아닌 현재 로그인한 사용자 정보를 사용해야함
*/
function BookReading(){
    const [books, setBooks] = useState([]);
    const [error,setError]=useState("");
    const [isLoading, setIsLoading] = useState(true); // 로딩 상태 추가


    useEffect(() => {
      const handleComplete = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setError("로그인이 필요한 서비스입니다.");
                setIsLoading(false);
                return;
            }

            const res = await axios.get(`http://localhost:8080/api/userbooks?status=READING`, {
                headers: {
                    'Content-Type':'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
          console.log(res.data);
          setBooks(res.data);
        } catch (error) {
          console.error(error);
          setError("오류 발생");
        } finally {
          setIsLoading(false);
        }
      };

      handleComplete();
    }, []);

    if (isLoading) return <div>로딩 중...</div>;

    function BookItem({ book, index}) {
        return (
            <div>
            <span>{index + 1}</span>
            {book.coverImageUrl && <img src={book.coverImageUrl} alt={book.title} width={48} />}
            <div>
                <p>{book.title}</p>
                <p>{book.author}</p>
            </div>
            </div>
        );
    }

      return (
        <div>
          <h2>읽고 있는 책</h2>

          {error && <p>{error}</p>}

          {!error && books.length === 0 && (
            <p>현재 읽고 있는 책이 없습니다.</p>
          )}

          {books.map((book, i) => (
            <BookItem
              key={book.bookId}
              book={book}
              index={i}
            />
          ))}
        </div>
      )
}
export default BookReading;