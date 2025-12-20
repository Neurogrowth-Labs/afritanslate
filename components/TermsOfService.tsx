
import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 text-text-secondary">
      <h1 className="text-4xl font-bold text-text-primary mb-8 text-center">Terms of Service</h1>
      <div className="space-y-6 bg-bg-surface p-8 rounded-lg border border-border-default">
        <section>
          <h2 className="text-2xl font-semibold text-text-primary mb-2">1. Introduction</h2>
          <p>Welcome to AfriTranslate AI! These terms and conditions outline the rules and regulations for the use of the AfriTranslate AI application. By accessing this app, we assume you accept these terms and conditions. Do not continue to use AfriTranslate AI if you do not agree to all of the terms and conditions stated on this page.</p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold text-text-primary mb-2">2. Intellectual Property Rights</h2>
          <p>Other than the content you own, under these Terms, AfriTranslate AI and/or its licensors own all the intellectual property rights and materials contained in this application. You are granted a limited license only for purposes of viewing the material contained on this app.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-text-primary mb-2">3. Restrictions</h2>
          <p>You are specifically restricted from all of the following:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 pl-4">
            <li>Publishing any application material in any other media.</li>
            <li>Selling, sublicensing and/or otherwise commercializing any application material.</li>
            <li>Publicly performing and/or showing any application material.</li>
            <li>Using this application in any way that is or may be damaging to this application.</li>
            <li>Using this application contrary to applicable laws and regulations, or in any way may cause harm to the application, or to any person or business entity.</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold text-text-primary mb-2">4. Your Content</h2>
          <p>In these Terms of Service, "Your Content" shall mean any audio, video, text, images or other material you choose to display on this application. By displaying Your Content, you grant AfriTranslate AI a non-exclusive, worldwide irrevocable, sub-licensable license to use, reproduce, adapt, publish, translate and distribute it in any and all media for the purpose of providing the translation service.</p>
          <p className="mt-2">Your Content must be your own and must not be invading any third-party's rights. AfriTranslate AI reserves the right to remove any of Your Content from this application at any time without notice.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-text-primary mb-2">5. No warranties</h2>
          <p>This application is provided "as is," with all faults, and AfriTranslate AI expresses no representations or warranties, of any kind related to this application or the materials contained on this application. Also, nothing contained on this application shall be interpreted as advising you.</p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold text-text-primary mb-2">6. Limitation of liability</h2>
          <p>In no event shall AfriTranslate AI, nor any of its officers, directors and employees, be held liable for anything arising out of or in any way connected with your use of this application whether such liability is under contract. AfriTranslate AI, including its officers, directors and employees shall not be held liable for any indirect, consequential or special liability arising out of or in any way related to your use of this application.</p>
        </section>

         <section>
          <h2 className="text-2xl font-semibold text-text-primary mb-2">7. Changes to Terms</h2>
          <p>AfriTranslate AI is permitted to revise these terms at any time as it sees fit, and by using this application you are expected to review these terms on a regular basis.</p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;