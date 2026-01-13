
import { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, ZOOM_VERIFICATION_TOKEN } from '../.env';

// Zoom App Credentials
const ZOOM_CONFIG = {
    ACCOUNT_ID: ZOOM_ACCOUNT_ID,
    CLIENT_ID: ZOOM_CLIENT_ID,
    CLIENT_SECRET: ZOOM_CLIENT_SECRET,
    VERIFICATION_TOKEN: ZOOM_VERIFICATION_TOKEN
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
    if (ZOOM_CONFIG.CLIENT_ID && ZOOM_CONFIG.CLIENT_SECRET) {
        return true;
    }
    return false;
}

/**
 * Simulates connecting the bot to the meeting stream.
 */
export async function connectBotToMeeting(meetingId: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return `AfriTranslate Bot connected to meeting ${meetingId}`;
}
