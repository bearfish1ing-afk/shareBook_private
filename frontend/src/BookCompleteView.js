import { useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function BookCompleteView(){
    const [books, setBooks] = useState([]);
    const [error,setError]=useState("");

    useEffect(() => {
      const handleComplete = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await axios.get(`http://localhost:8080/api/userbooks?status=COMPLETED`, {
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
        }
      };

      handleComplete();
    }, []);

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
          <h2>완독한 책</h2>
          {error && <p>{error}</p>}

          {!error && books.length === 0 && (
            <p>완료된 책이 없습니다.</p>
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
export default BookCompleteView;