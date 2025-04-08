import React, { useEffect, useState } from "react";
import { useAPI } from "../../contexts/APIContext";
import './styles.css'
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import PromotionDetails from "../../components/PromotionDetails";
import UpdatePromotion from "../../components/UpdatePromotion";

export default function Promotion({promotionId}) {
    const { ajax } = useAPI();
    const [promotion, setPromotion] = useState(null);
    const [error, setError] = useState("");
    const [edit, setEdit] = useState(false);
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const clearance = ["superuser", "manager"];
    const { user } = useAuth();
    const location = useLocation();
    const {created} = location.state || {};

    useEffect(() => {
        if (!token || (user && !clearance.includes(user.role))) {
            navigate("/login");
        }
    }, [token, user]); 

    async function fetchPromotion() {
        const path = `/promotions/${promotionId}`;
        const headers = { Authorization: `Bearer ${token}`};
        
        const res = await ajax(path, { headers });
        if (res) {
            if (res.ok) {
                const json = await res.json();
                setError("");
                setPromotion(json);
                return;
            }
            if (res.status === 404) {
                navigate("/not-found");
            }
        }
    }
    useEffect(() => {
        fetchPromotion();
    }, [edit, promotionId]);

    async function deletePromotion() {
        const path = `/promotions/${promotionId}`;
        const headers = { Authorization: `Bearer ${token}`};
        const method = 'DELETE';
        
        const res = await ajax(path, { method, headers });
        if (res) {
            if (res.ok) {
                setError("");
                navigate("/success", {state: {deleted: true, item: "Promotion"}});
            }
            else {
                const json = await res.json();
                setError(json.error);
            }
        }
    }


    return <>
        {edit ? 
            <>
            {promotion && 
            <UpdatePromotion promotion={promotion} setEdit={setEdit} />
            }
            </> :
            <>
            {promotion && 
                <>
                <PromotionDetails promotion={promotion} created={created}/>
                <p className="buttons">
                <button onClick={() => setEdit(true)}>Edit</button>
                <button onClick={() => deletePromotion()}>Delete</button>
                </p>
                <p className="error">{error}</p>
                </>
            }
            </> 
            
        }
        
    </>;
}