import { Routes, Route, BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Layout from "./components/Layout";
import Success from "./pages/Success";
import SuperUser from "./pages/SuperUser";
import Manager from "./pages/Manager";
import Cashier from "./pages/Cashier";
import Regular from "./pages/Regular";

const MyRoutes = () => {
    return <Routes>
        <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/success" element={<Success />} />
            <Route path="/superuser" element={<SuperUser />} />
            <Route path="/manager" element={<Manager />} />
            <Route path="/cashier" element={<Cashier />} />
            <Route path="/regular" element={<Regular />} />
        </Route>
    </Routes>;
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <MyRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
