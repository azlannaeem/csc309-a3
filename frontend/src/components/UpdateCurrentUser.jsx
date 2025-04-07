import { useState } from "react";
import { useAPI } from "../contexts/APIContext";

export default function UpdateCurrentUser({user, setEdit}) {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [birthday, setBirthday] = useState(user.birthday);
    const [avatar, setAvatar] = useState(null); 
    const [error, setError] = useState("");
    const {ajax, fetching} = useAPI();
    const handle_submit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        let hasChanges = false;

        if (name !== user.name) {
            formData.append("name", name);
            hasChanges = true;
        }
        if (email !== user.email) {
            formData.append("email", email);
            hasChanges = true;
        }
        if (birthday !== user.birthday) {
            formData.append("birthday", birthday);
            hasChanges = true;
        }
        if (avatar) {
            formData.append("avatar", avatar);
            hasChanges = true;
        }

        if (!hasChanges) {
            setError("No changes were made");
            return;
        }

        const path = `/users/me`;
        const method = "PATCH";
        const token = localStorage.getItem("token");

        const headers = {
            Authorization: `Bearer ${token}`
        };
        const resp = await ajax(path, {method, headers, body: formData});
        if (resp) {
            if (resp.ok) {
                setError("");
                setEdit(false);
            }
            else {
                const json = await resp.json();
                setError(json.error);
            }
        }
    };

    return <>
        <h2>Edit Profile</h2>
        <form className="update" onSubmit={handle_submit}>
            <label htmlFor="name">Name:</label>
            <input
                type="text"
                name="name"
                placeholder='Email'
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
            />
            <label htmlFor="email">Email:</label>
            <input
                type="text"
                name="email"
                placeholder='Email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <label htmlFor="birthday">Birthday</label>
            <input 
                type="date" 
                id="birthday" 
                name="birthday" 
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
            />
            <label htmlFor="avatar">Avatar</label>
            <input
                type="file"
                id="avatar"
                name="avatar"
                accept="image/*"
                onChange={(e) => setAvatar(e.target.files[0])}
            />
            <p className="buttons">
            <button onClick={() => setEdit(false)}>Cancel</button>
            <button type="submit" disabled={fetching}>Update</button>
            </p>   
            <p className="error">{error}</p>
        </form>
    </>
}