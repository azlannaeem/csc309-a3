import { Routes, Route, BrowserRouter, useParams } from "react-router-dom";
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
import Users from "./pages/Users";
import { APIProvider } from "./contexts/APIContext";
import NotFound from "./pages/NotFound";
import User from "./pages/User";
import Reset from "./pages/Reset";
import CurrentUser from "./pages/CurrentUser";
import Transactions from "./pages/Transactions";
import Transaction from "./pages/Transaction";
import Promotions from "./pages/Promotions";
import Promotion from "./pages/Promotion";
import CreatePromotion from "./pages/CreatePromotion";

const UserWrapper = () => {
    const { userId } = useParams();
    return <User userId={parseInt(userId, 10)} />;
};

const TransactionWrapper = () => {
    const { transactionId } = useParams();
    return <Transaction transactionId={parseInt(transactionId, 10)} />;
};

const PromotionWrapper = () => {
    const { promotionId } = useParams();
    return <Promotion promotionId={parseInt(promotionId, 10)} />;
};

const MyRoutes = () => {
    return <Routes>
        <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="success" element={<Success />} />
            <Route path="superuser" element={<SuperUser />} />
            <Route path="manager" element={<Manager />} />
            <Route path="cashier" element={<Cashier />} />
            <Route path="regular" element={<Regular />} />
            <Route path="users" element={<Users />} />
            <Route path="reset" element={<Reset />} />
            <Route path="users/me" element={<CurrentUser />} />
            <Route path="users/:userId" element={<UserWrapper />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="transactions/:transactionId" element={<TransactionWrapper />} />
            <Route path="promotion" element={<CreatePromotion />} />
            <Route path="promotions" element={<Promotions />} />
            <Route path="promotions/:promotionId" element={<PromotionWrapper />} />
            <Route path="*" element={<NotFound />} />
        </Route>
    </Routes>;
}

function App() {
    return (
        <BrowserRouter>
            <APIProvider>
                <AuthProvider>
                    <MyRoutes />
                </AuthProvider>
            </APIProvider>
        </BrowserRouter>
    );
}

export default App;
