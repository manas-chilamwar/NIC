import React, { useState, useEffect, createContext } from 'react';
import { Navigate } from 'react-router-dom';

const UserContext = createContext<User>({ email: '' });

interface User {
    email: string;
}

function AuthorizeView(props: { children: React.ReactNode }) {
    const [authorized, setAuthorized] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const emptyUser: User = { email: '' };
    const [user, setUser] = useState<User>(emptyUser);

    useEffect(() => {
        const maxRetries = 10;
        const delay = 1000;

        function wait(delay: number) {
            return new Promise((resolve) => setTimeout(resolve, delay));
        }

        async function fetchWithRetry(url: string, options: RequestInit) {
            let retryCount = 0;
            try {
                const response = await fetch(url, options);
                if (response.status === 200) {
                    const data = await response.json();
                    setUser({ email: data.email });
                    setAuthorized(true);
                    return response;
                } else if (response.status === 401) {
                    return response;
                } else {
                    throw new Error(`${response.status}`);
                }
            } catch (error) {
                retryCount++;
                if (retryCount > maxRetries) {
                    throw error;
                } else {
                    await wait(delay);
                    return fetchWithRetry(url, options);
                }
            }
        }

        fetchWithRetry("/pingauth", { method: "GET" })
            .catch((error) => console.log(error.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    } else {
        if (authorized && !loading) {
            return (
                <UserContext.Provider value={user}>
                    {props.children}
                </UserContext.Provider>
            );
        } else {
            return <Navigate to="/login" />;
        }
    }
}

export function AuthorizedUser(props: { value: string }) {
    const user: User = React.useContext(UserContext);
    return props.value === "email" ? <>{user.email}</> : null;
}

export default AuthorizeView;
