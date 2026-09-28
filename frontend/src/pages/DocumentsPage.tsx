import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { apiRoutes } from '../config/api';

type DocumentItem = {
  id: number;
  employee_id: string;
  doc_type: string;
  doc_name: string;
  issue_date: string;
  file_name: string;
};

export default function DocumentsPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [documentType, setDocumentType] = useState('ID Proof');
  const [documentName, setDocumentName] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [documents, setDocuments] = useState([] as DocumentItem[]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);
  const [editingId, setEditingId] = useState(null as number | null);

  function openAdd() {
    setEmployeeId('');
    setDocumentType('ID Proof');
    setDocumentName('');
    setIssueDate('');
    setSelectedFileName('');
    setEditingId(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    setEmployeeId('');
    setDocumentType('ID Proof');
    setDocumentName('');
    setIssueDate('');
    setSelectedFileName('');
    setEditingId(null);
    setIsFormOpen(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      employee_id: employeeId,
      doc_type: documentType,
      doc_name: documentName,
      issue_date: issueDate,
      file_name: selectedFileName || 'unknown'
    };

    async function submit() {
      try {
        setLoading(true);
        setError(null);

        if (editingId) {
          const res = await fetch(`${apiRoutes.documents}/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!res.ok) throw new Error(`Update failed (${res.status})`);

          setDocuments((prev: DocumentItem[]) =>
            prev.map((d: DocumentItem) => (d.id === editingId ? { ...d, ...payload, id: editingId } as DocumentItem : d))
          );
        } else {
          const res = await fetch(apiRoutes.documents, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!res.ok) throw new Error(`Create failed (${res.status})`);

          const data = await res.json();
          // server returns created item in data
          const created = data.data as DocumentItem | undefined;
          if (created) {
            setDocuments((prev: DocumentItem[]) => [created, ...prev]);
          }
        }

        // reset form
        closeForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save document');
      } finally {
        setLoading(false);
      }
    }

    submit();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setSelectedFileName(file?.name ?? '');
  }

  function handleEmployeeIdChange(event: ChangeEvent<HTMLInputElement>) {
    setEmployeeId(event.target.value);
  }

  function handleDocumentTypeChange(event: ChangeEvent<HTMLSelectElement>) {
    setDocumentType(event.target.value);
  }

  function handleDocumentNameChange(event: ChangeEvent<HTMLInputElement>) {
    setDocumentName(event.target.value);
  }

  function handleIssueDateChange(event: ChangeEvent<HTMLInputElement>) {
    setIssueDate(event.target.value);
  }

  async function loadDocuments() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(apiRoutes.documents);
      if (!res.ok) throw new Error(`Failed to load documents (${res.status})`);
      const data = await res.json();
      setDocuments(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load documents');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section>
      <style>{`.documents-table{width:100%;border-collapse:collapse;margin-top:20px}.documents-table th,.documents-table td{border:1px solid #ddd;padding:8px;text-align:left}.documents-actions{display:flex;gap:8px}.employee-status{margin-top:12px;font-weight:500}`}</style>
      <div
        style={{
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'flex-end'
        }}
      >
        <button
          type="button"
          onClick={openAdd}
          style={{
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {isFormOpen && !editingId ? 'Adding Document...' : 'Add Document'}
        </button>
      </div>

      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="portal-form"
          style={{
            display: 'grid',
            gap: '12px',
            maxWidth: '860px',
            gridTemplateColumns: 'repeat(2, minmax(240px, 1fr))'
          }}
        >
          <label>
            Employee ID
            <input
              type="text"
              value={employeeId}
              onChange={handleEmployeeIdChange}
              placeholder="Enter employee ID"
              required
            />
          </label>

          <label>
            Document Type
            <select value={documentType} onChange={handleDocumentTypeChange}>
              <option>ID Proof</option>
              <option>Address Proof</option>
              <option>Education Certificate</option>
              <option>Experience Letter</option>
              <option>Other</option>
            </select>
          </label>

          <label>
            Document Name
            <input
              type="text"
              value={documentName}
              onChange={handleDocumentNameChange}
              placeholder="Enter document name"
              required
            />
          </label>

          <label>
            Issue Date
            <input type="date" value={issueDate} onChange={handleIssueDateChange} required />
          </label>

          <label>
            Upload Document
            <input type="file" onChange={handleFileChange} required />
          </label>

          <label style={{ gridColumn: '1 / -1' }}>
            Selected File
            <input type="text" value={selectedFileName} placeholder="No file selected" readOnly />
          </label>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              style={{
                justifySelf: 'start',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 18px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {editingId ? 'Update' : 'Submit'}
            </button>

            <button
              type="button"
              onClick={closeForm}
              style={{
                backgroundColor: '#6b7280',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 18px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && <p className="employee-status">Loading documents...</p>}
      {!loading && error && (
        <div className="employee-status">
          <p>{error}</p>
          <button className="employee-btn employee-btn-add" onClick={() => loadDocuments()}>
            Retry
          </button>
        </div>
      )}

      {!loading && documents.length > 0 && (
        <table className="documents-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Employee ID</th>
              <th>Type</th>
              <th>Name</th>
              <th>Issue Date</th>
              <th>File</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc: DocumentItem) => (
              <tr key={doc.id}>
                <td>{doc.id}</td>
                <td>{doc.employee_id}</td>
                <td>{doc.doc_type}</td>
                <td>{doc.doc_name}</td>
                <td>{doc.issue_date}</td>
                <td>{doc.file_name}</td>
                <td>
                  <div className="documents-actions">
                    <button
                      type="button"
                      className="employee-btn employee-btn-edit"
                      onClick={() => {
                        setIsFormOpen(true);
                        setEditingId(doc.id);
                        setEmployeeId(doc.employee_id);
                        setDocumentType(doc.doc_type);
                        setDocumentName(doc.doc_name);
                        setIssueDate(doc.issue_date);
                        setSelectedFileName(doc.file_name);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="employee-btn employee-btn-delete"
                      onClick={async () => {
                        if (!confirm('Delete this document?')) return;
                        const previous = documents;
                        setDocuments((prev: DocumentItem[]) => prev.filter((d: DocumentItem) => d.id !== doc.id));
                        try {
                          const res = await fetch(`${apiRoutes.documents}/${doc.id}`, { method: 'DELETE' });
                          if (!res.ok) throw new Error(`Delete failed (${res.status})`);
                        } catch (err) {
                          setDocuments(previous);
                          setError(err instanceof Error ? err.message : 'Delete failed');
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}


