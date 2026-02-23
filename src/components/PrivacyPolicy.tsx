
import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 text-text-secondary">
      <h1 className="text-4xl font-bold text-text-primary mb-8 text-center">Privacy Policy</h1>
      <div className="space-y-6 bg-bg-surface p-8 rounded-lg border border-border-default">
        <section>
          <h2 className="text-2xl font-semibold text-text-primary mb-2">Introduction</h2>
          <p>This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You. We use Your Personal data to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy.</p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold text-text-primary mb-2">Information We Collect</h2>
          <p>While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. Personally identifiable information may include, but is not limited to:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 pl-4">
            <li>Email address</li>
            <li>First name and last name</li>
            <li>Usage Data (e.g., text submitted for translation, features used)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-text-primary mb-2">Use of Your Personal Data</h2>
          <p>The Company may use Personal Data for the following purposes:</p>
           <ul className="list-disc list-inside mt-2 space-y-1 pl-4">
            <li><strong>To provide and maintain our Service,</strong> including to monitor the usage of our Service.</li>
            <li><strong>To manage Your Account:</strong> to manage Your registration as a user of the Service.</li>
            <li><strong>To contact You:</strong> To contact You by email regarding updates or informative communications related to the functionalities, products or contracted services.</li>
            <li><strong>To manage Your requests:</strong> To attend and manage Your requests to Us.</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold text-text-primary mb-2">Data Security</h2>
          <p>The security of Your Personal Data is important to Us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While We strive to use commercially acceptable means to protect Your Personal Data, We cannot guarantee its absolute security.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-text-primary mb-2">Third-Party Services</h2>
          <p>Our Service uses third-party services for AI language processing. The data you provide for translation (text, audio, documents) is sent to Google's Gemini API for processing. We encourage you to review Google's privacy policy to understand how they handle your data.</p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold text-text-primary mb-2">Changes to this Privacy Policy</h2>
          <p>We may update Our Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-text-primary mb-2">Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, You can contact us by email: privacy@afritranslate.ai</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;