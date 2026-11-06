import React from "react";
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import LoginPage from './login/LoginPage';
import LoginCallBack from "./login/LoginCallBack";
import MainPage from "./MainPage";
import ProtectedRoute from "./ProtectedRoute";
import CreateRoom from "./CreateRoom";
import JoinRoom from "./JoinRoom";
import RoomBookChoice from "./roomBookChoice";
import EPubsPage from "./EpubsPage";
import JoinColorRoom from "./JoinColorRoom";
import BookCompleteView from "./BookCompleteView";
import MyRoom from "./MyRoom";
import RoomDetail from "./RoomDetail";
import BookReading from "./BookReading";
import ColorChange from "./ColorChange";
import UserUpdate from "./UserUpdate";
import BookAdd from "./BookAdd";
import RoomDetailDesign from "./RoomDetailDesign";
import HighlightTester from "./HighlightTest";
import ProfilePage from "./ProfilePage";
import BookShelf from "./BookShelf";
import BookDetail from "./BookDetail";
import Scrap from "./Scrap";
import ProfileEdit from "./ProfileEdit"

const App  = () => {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/join-room" element={<JoinRoom />} />
                <Route path="/oauth-success" element={<LoginCallBack />} />
                <Route path="/" element={<ProtectedRoute> <MainPage /> </ProtectedRoute> } />
                <Route path="/create-room" element={<ProtectedRoute> <CreateRoom /> </ProtectedRoute>} />
                <Route path="/room/:roomId/book-choice" element={<ProtectedRoute> <RoomBookChoice /> </ProtectedRoute>} />
                <Route path="/room/join/:roomId" element={<ProtectedRoute> <JoinColorRoom /> </ProtectedRoute>} />
                <Route path="/book-complete-view" element={<ProtectedRoute> <BookCompleteView /> </ProtectedRoute>} />
                <Route path="/rooms" element={<ProtectedRoute> <MyRoom /> </ProtectedRoute>} />
                <Route path="/room/:roomId" element={<RoomDetailDesign />} />
                <Route path="/book-reading" element={<BookReading />} />
                <Route path="/epub/:roomId/:roomBookId" element={<EPubsPage />} />
                <Route path="/room/:roomId/color" element={<ColorChange/>}/>
                <Route path="/user-update" element={<UserUpdate/>}/>
                <Route path="/book-add" element={<BookAdd/>}/>
                <Route path="/highlight-test" element={<HighlightTester/>}/>
                <Route path="/myprofile" element={<ProfilePage/>}/>
                <Route path="/bookshelf/:bookId" element={<BookDetail/>}/>
                <Route path="/bookshelf" element={<BookShelf/>}/>
                <Route path="/scrap" element={<Scrap/>}/>
                <Route path="/profile/edit" element={<ProfileEdit/>}/>
            </Routes>
        </Router>
    );
}
export default App;