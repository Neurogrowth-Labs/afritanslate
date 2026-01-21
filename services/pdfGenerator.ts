
import { jsPDF } from "jspdf";

const MANUAL_CONTENT = [
    {
        title: "1. Introduction",
        body: `AfriTranslate AI Studio is the enterprise standard for African localization. Unlike generic translation tools, this platform is designed to preserve cultural nuance, respect social hierarchy, and handle the structural complexities of African languages (such as tonality and noun classes).

This manual guides you through the operational capabilities of the Studio, ensuring you maximize the potential of our "Nuance Engine".`
    },
    {
        title: "2. Getting Started",
        body: `Accessing the Platform:
1. Navigate to the landing page.
2. Click "Launch Studio" or "Log In".
3. Use your credentials or Google Auth.
4. Complete the Onboarding Agent process to tailor the AI to your profession.

Navigation:
- Sidebar: Access specific tools (Script, Book, Motion, etc.).
- Header: Monitor connection status, profile settings, and language pair.
- Workspace: The central area where translation and generation occur.`
    },
    {
        title: "3. Core Tools: AI Assistant (Chat)",
        body: `The AI Assistant is your primary interface for general translation and cultural queries.

Key Features:
- Tone Selector: Choose between Formal, Friendly, Business, or Poetic to adjust the output's social register.
- Region Selector: Drill down to specific dialects (e.g., Nigerian Pidgin vs. Cameroonian Pidgin).
- Linguistic DNA: Click "Deep Linguistic DNA" after a translation to see technical breakdowns (Tonality, Noun Classes).
- Offline Mode: Limited vocabulary is available without internet access.`
    },
    {
        title: "4. Professional Tools",
        body: `Script Translator:
Designed for screenwriters. Upload .txt or .fountain files. The AI analyzes characters, generates casting sides, and creates cultural adaptation reports.

Literary Studio (Book Translator):
For long-form content. Use the "Cultural Integrity" slider to balance between literal accuracy and adaptive storytelling. Features a "Source Reader" to highlight idioms.

Meeting Insights:
Paste transcripts or connect via Zoom link. The AI generates summaries, extracts action items, and detects technical terminology.`
    },
    {
        title: "5. Creative Tools",
        body: `Motion Generator:
Generate short video clips from text prompts. 
- Use "Deep Regional Localization" to specify visual aesthetics (e.g., "Nairobi 90s Matatu culture").
- Select Aspect Ratio (16:9 for TV, 9:16 for Social).

Audio Transcriber:
Upload audio files to convert speech to text. Supports accents and code-switching (mixing languages).`
    },
    {
        title: "6. Live Conversation (Voice)",
        body: `Real-time interpretation.
1. Select Input Source (Microphone or Zoom).
2. Choose "Nuanced" (cultural adaptation) or "Literal" (word-for-word).
3. The visualizer indicates audio input levels.
4. Click "Stop" to end the session and view the transcript.`
    },
    {
        title: "7. Account & Billing",
        body: `Manage your subscription in the "Plans" section.
- Free: Basic access, 100 translations/mo.
- Premium: Unlimited translations, Voice features, Offline packs.
- Enterprise: API access, dedicated support.

Payments are processed securely via PayPal or Stripe.`
    }
];

export const generateOperationalManual = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let cursorY = margin;

    // --- COVER PAGE ---
    doc.setFillColor(18, 18, 18); // Dark Background #121212
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Title
    doc.setTextColor(244, 163, 0); // Accent Color #F4A300
    doc.setFont("helvetica", "bold");
    doc.setFontSize(32);
    doc.text("AfriTranslate AI", pageWidth / 2, pageHeight / 3, { align: "center" });
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Operational Manual", pageWidth / 2, (pageHeight / 3) + 15, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(150, 150, 150);
    doc.text("Version 1.0 | 2025", pageWidth / 2, pageHeight - 30, { align: "center" });

    // --- CONTENT PAGES ---
    
    // Helper to add new page
    const addNewPage = () => {
        doc.addPage();
        doc.setFillColor(255, 255, 255); // White background for readability
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        cursorY = margin + 10;
        
        // Header
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("AfriTranslate AI Studio - Operational Manual", margin, margin);
        doc.line(margin, margin + 2, pageWidth - margin, margin + 2);
    };

    addNewPage();

    // Iterate through sections
    MANUAL_CONTENT.forEach((section) => {
        // Check if we need a new page for the title
        if (cursorY + 20 > pageHeight - margin) addNewPage();

        // Section Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text(section.title, margin, cursorY);
        cursorY += 10;

        // Section Body
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(60, 60, 60);

        const splitText = doc.splitTextToSize(section.body, contentWidth);
        
        // Check if body text fits
        const textHeight = splitText.length * 7; // Approx height per line
        if (cursorY + textHeight > pageHeight - margin) {
            addNewPage();
        }

        doc.text(splitText, margin, cursorY);
        cursorY += textHeight + 10; // Spacing after section
    });

    // Save
    doc.save("AfriTranslate_AI_Manual.pdf");
};
