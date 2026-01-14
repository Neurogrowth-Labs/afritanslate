
// Zoom App Credentials
const ZOOM_CONFIG = {
    ACCOUNT_ID: process.env.ZOOM_ACCOUNT_ID,
    CLIENT_ID: process.env.ZOOM_CLIENT_ID,
    CLIENT_SECRET: process.env.ZOOM_CLIENT_SECRET,
    VERIFICATION_TOKEN: process.env.ZOOM_VERIFICATION_TOKEN
};

export interface ZoomMeetingDetails {
    meetingId: string;
    passcode?: string;
    joinUrl: string;
}

/**
 * Parses a Zoom join URL to extract meeting ID.
 */
export function parseZoomLink(url: string): ZoomMeetingDetails | null {
    try {
        const urlObj = new URL(url);
        // Typical format: https://us04web.zoom.us/j/123456789?pwd=...
        // Or: zoom.us/j/123456789
        const pathSegments = urlObj.pathname.split('/');
        const meetingIdIndex = pathSegments.findIndex(seg => seg === 'j' || seg === 'join');
        
        if (meetingIdIndex !== -1 && pathSegments[meetingIdIndex + 1]) {
            const meetingId = pathSegments[meetingIdIndex + 1];
            const passcode = urlObj.searchParams.get('pwd') || undefined;
            return { meetingId, passcode, joinUrl: url };
        }
        return null;
    } catch (e) {
        return null;
    }
}

/**
 * Simulates authentication with Zoom API using the provided credentials.
 * In a real backend implementation, this would exchange the Client ID/Secret for an OAuth token.
 */
export async function authenticateZoom(): Promise<boolean> {
    console.log("Authenticating with Zoom...", { clientId: ZOOM_CONFIG.CLIENT_ID });
    
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock validation
    // In a production app, we would check strictly for ZOOM_CONFIG.CLIENT_ID
    // For this simulation, we return true to allow the demo flow to work without env vars.
    return true;
}

/**
 * Simulates connecting the bot to the meeting stream.
 */
export async function connectBotToMeeting(meetingId: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return `AfriTranslate Bot connected to meeting ${meetingId}`;
}
