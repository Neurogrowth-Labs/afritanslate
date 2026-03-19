import React, { useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const AuthCallback: React.FC = () => {
    useEffect(() => {
        const handleAuthCallback = async () => {
            const { data, error } = await supabase.auth.getSession();

            if (error || !data.session) {
                window.location.replace('/?auth=signin');
                return;
            }

            window.location.replace('/');
        };

        handleAuthCallback();
    }, []);

    return (
        <div className="bg-bg-main h-screen w-screen flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
};

export default AuthCallback;
