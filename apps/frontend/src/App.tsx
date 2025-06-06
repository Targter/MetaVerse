import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./component/Singin";
import Signup from "./component/Singup";
import AdminPanel from "./component/AdminPage";
import SpacePage from "./component/Space";
import MeetingPage from "./component/Meeting";
import WebSocketComponent from "./component/Router";
import Arena from "./Practice";
// import Game from "./Game";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/Register" element={<Signup />} />
        <Route path="/Login" element={<SignIn />} />
        <Route path="/SpacePage" element={<SpacePage/>} />
        <Route path="/AdminPanel" element={<AdminPanel/>} />
        <Route path="/meeting/:spaceId/:tokenId" element={<MeetingPage/>} />
        <Route path="/connect" element={<WebSocketComponent/>}/>
        <Route path="/Game/:spaceId/:tokenId" element={<Arena/>} />
      </Routes>
    </Router>
  );
}

export default App;
