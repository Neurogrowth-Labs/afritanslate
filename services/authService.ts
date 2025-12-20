import type { User } from '../types';

interface GoogleProfile {
    name: string;
    email: string;
}

class GoogleApiService {
    /**
     * Simulates the OAuth flow and fetches the user's profile from the "Gmail API".
     * @returns A promise that resolves with the user's profile or rejects with an error.
     */
    async signIn(): Promise<GoogleProfile> {
        console.log("Initiating simulated Google OAuth flow...");
        
        return new Promise((resolve, reject) => {
            // Simulate the time it takes for user interaction and network latency
            setTimeout(() => {
                console.log("Simulating API call to Google to get user profile...");
                
                // Simulate a 5% chance of API failure to represent real-world conditions
                if (Math.random() < 0.05) {
                    console.error("Simulated Google API error.");
                    reject(new Error("Google authentication failed. Please try again later."));
                } else {
                    const profile: GoogleProfile = {
                        name: 'Gmail User',
                        email: 'demo-user@gmail.com',
                    };
                    console.log("Successfully fetched simulated profile:", profile);
                    resolve(profile);
                }
            }, 1200); // Realistic network + user interaction delay
        });
    }
}

// Export a singleton instance to be used across the app
export const googleAuthService = new GoogleApiService();
