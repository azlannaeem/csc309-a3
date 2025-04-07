import './form.css';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const { user, register } = useAuth();
    const [error, setError] = useState("");
    const [data, setData] = useState({
        utorid: '',
        name: '',
        email: ''
    });
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const clearance = ["superuser", "manager", "cashier"];
    useEffect(() => {
        if (!token || (user && !clearance.includes(user.role))) {
            navigate("/login");
        }
    }, [token, user]);  

    const handle_change = (e) => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
    };

    const handle_submit = (e) => {
        e.preventDefault();
        register(data)
        .then(message => setError(message));
    };

    return <>
        <h2>Registration</h2>
        <form onSubmit={handle_submit}>
            <label htmlFor="utorid">utorid:</label>
            <input
                type="text"
                id="utorid"
                name="utorid"
                placeholder='utorid'
                value={data.utorid}
                onChange={handle_change}
                required
            />
            <label htmlFor="name">Name:</label>
            <input
                type="text"
                id="name"
                name="name"
                placeholder='Name'
                value={data.name}
                onChange={handle_change}
                required
            />
            <label htmlFor="email">Email:</label>
            <input
                type="text"
                id="emai"
                name="email"
                placeholder='Email'
                value={data.email}
                onChange={handle_change}
                required
            />
            <div className="btn-container">
                <button type="submit">Register</button>
            </div>
            <p className="error">{error}</p>
        </form>
    </>;
};

export default Register;