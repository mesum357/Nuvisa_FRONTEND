import ApplicationStatusCard from './ApplicationStatusCard';

export default function ApplicationStatusList({ applications = [], onSelect }) {
  if (!applications.length) {
    return (
      <div className="text-center py-8 text-white/60">No applications found</div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {applications.map((app) => (
        <ApplicationStatusCard key={app.id || app.applicationId || app.code} application={app} onSelect={onSelect} />
      ))}
    </div>
  );
}
