import { createContext, useState, useContext } from "react";

export const APIContext = createContext(null);
// export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
export const BACKEND_URL = 'https://backend-production-906e.up.railway.app';


export const useAPIContext = () => {
    const [fetching, setFetching] = useState(false);

    const ajax = async (path, { method='GET', headers={}, body=undefined }) => {
        // prevent another API call if one is already in progress
        if (fetching) {
            return;
        }

        setFetching(true);
        const url = `${BACKEND_URL}${path}`;
        var resp

        try {
            resp = await fetch(url, { method, headers, body });
        }
        catch (error) {
            console.log(error.message);
        }
        finally {
            setFetching(false);
        }

        return resp;
    };

    return {
        ajax, fetching
    };
}

export const APIProvider = ({ children }) => {
    return <APIContext.Provider value={useAPIContext()} >
        {children}
    </APIContext.Provider>
}

export const useAPI = () => {
    return useContext(APIContext);
};