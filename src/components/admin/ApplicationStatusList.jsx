import { useState } from 'react';
import ApplicationStatusCard from './ApplicationStatusCard';

export default function ApplicationStatusList({ applications = [], onSelect }) {
  const [expandedCard, setExpandedCard] = useState(null);

  const handleCardToggle = (appId) => {
    setExpandedCard(expandedCard === appId ? null : appId);
  };

  if (!applications.length) {
    return (
      <div className="text-center py-12">
        <div className="bg-[#2A1B3D]/50 border border-[#423577] rounded-lg p-8 max-w-md mx-auto">
          <div className="text-white/40 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
            </svg>
          </div>
          <h3 className="text-white font-medium mb-2">No Submitted Applications</h3>
          <p className="text-white/60 text-sm">
            No submitted applications found. Only applications with status "submitted", "approved", "completed", or "processing" are shown here.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {applications.map((app) => {
        const appId = app.id || app.applicationId || app.code;
        return (
          <ApplicationStatusCard 
            key={appId}
            application={app} 
            onSelect={onSelect}
            isExpanded={expandedCard === appId}
            onToggle={() => handleCardToggle(appId)}
          />
        );
      })}
    </div>
  );
}
