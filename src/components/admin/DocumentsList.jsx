import DocumentCard from './DocumentCard';

export default function DocumentsList({ documents = [], onView }) {
  const uploadedDocs = Array.isArray(documents)
    ? documents.filter((d) => {
        const status = String(d?.status || '').toLowerCase();
        const hasFile = Boolean(d?.previewUrl || d?.downloadUrl);
        return status === 'uploaded' || hasFile;
      })
    : [];

  if (!uploadedDocs.length) {
    return (
      <div className="text-center py-8 text-white/60">No uploaded documents found</div>
    );
  }

  return (
    <div className="space-y-3">
      {uploadedDocs.map((doc) => (
        <DocumentCard key={doc.id || `${doc.applicationId || ''}-${doc.name || doc.type || 'doc'}`}
          document={doc}
          onView={onView}
        />
      ))}
    </div>
  );
}
