import { useEffect } from "react";
import "./main.css";
import { useLocation, useNavigate } from "react-router-dom";


function Success() {
    const navigate = useNavigate();
    const location = useLocation();
    const { resetToken, expiresAt, register } = location.state || {};
    const flag = resetToken && expiresAt;
    const formattedExpiresAt = new Date(expiresAt).toLocaleString();

    useEffect(() => {
        if (!flag) {
            navigate("/");
        }
    }, [flag]);  

    return <>
        {register ? 
        <h3>Registration Successful</h3> :
        <h3>Reset Token Generated</h3>
        }
        {flag && <>
        <p>Use the following code to reset your password:</p>
        <p><strong>{resetToken}</strong></p>
        <p>This reset token is valid until <strong>{formattedExpiresAt}</strong>.</p>
        <button onClick={() => navigate("/reset")}>Reset Password</button>
        </>}
    </>;
}

export default Success;
