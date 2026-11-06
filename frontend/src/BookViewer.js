import React, { useEffect, useRef, userState } from 'react';
import ePub from 'epubjs';

const BookViewer = () => {
    // const{roomBookId}=useParams();
    const viewerRef = useRef(null)
    const renditionRef = useRef(null);
    // const bookRef = useRef(null);

    // const [loading, setLoading] = useState(false);
    // const [error, setError] = useState(null);
    // 1. 책 로드

    // 2. 렌더링 설정 (viewer라는 id를 가진 div 필요)
    useEffect(()=>{

        // try{
        //     const response=await fetch(`http://localhost:8080/api/v1/rooms/${roomId}`, {method: 'GET'});
        //     if(!response.ok){
        //         throw new Error("방 정보가 없습니다.");
        //     }

        //     const json=await response.json();
        //     setRoomInfo(json.data);
        // } catch(error){
        //     console.error(error);
        // }
        
        // if (!url || !viewerRef.current) return; 
        const loadbook = async () => {
            // setLoading(true);
            // setError(null);

            const response = await fetch('/epub_files/book1.epub');
            const bookData = await response.arrayBuffer();
            const book = ePub(bookData);

            const rendition = book.renderTo(viewerRef.current, {
                width: "100%",
                height: "100vh",
                flow: "paginated", // 또는 "scrolled"
                allowScriptedContent: true,
                manager: "default"
            });

            renditionRef.current = rendition;
            rendition.display();
        };

        if (viewerRef.current){
            loadbook();
        }
    }, []);

    const handlePrev = () => {
        if (renditionRef.current) {
            renditionRef.current.prev();
        }
    }

    const handleNext = () => {
        if (renditionRef.current) {
            renditionRef.current.next();
        }
    }
    

    // 3. 디스플레이
    return (
        <div>
            <div style={{ marginBottom: '10px' }}>
                <button onClick={handlePrev}>이전페이지</button>
                <button onClick={handleNext}>다음페이지</button>
            </div>
            <div
                ref={viewerRef}
                style={{width: '100%', height: '600px', border: '1px solid #ccc'}}
            />
        </div>
    );
};

export default BookViewer;