import { useState, type ChangeEvent, type FormEvent } from 'react';

type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

type LeaveRequest = {
  id: string;
  employeeId: string;
  casualLeave: string;
  sickLeave: string;
  earnedLeave: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
};

const emptyForm = {
  employeeId: '',
  casualLeave: '',
  sickLeave: '',
  earnedLeave: '',
  reason: '',
  startDate: '',
  endDate: '',
  status: 'Pending'
} as Omit<LeaveRequest, 'id'>;

export default function LeavesPage() {
  const [leaves, setLeaves] = useState([] as LeaveRequest[]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null as string | null);
  const [form, setForm] = useState({ ...emptyForm } as Omit<LeaveRequest, 'id'>);

  function getNextId(): string {
    const maxId = leaves.reduce((max: number, item: LeaveRequest) => {
      const parsed = Number(item.id);
      return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
    }, 0);

    return String(maxId + 1);
  }

  function openAddForm() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  }

  function openEditForm(item: LeaveRequest) {
    setEditingId(item.id);
    setForm({
      employeeId: item.employeeId,
      casualLeave: item.casualLeave,
      sickLeave: item.sickLeave,
      earnedLeave: item.earnedLeave,
      reason: item.reason,
      startDate: item.startDate,
      endDate: item.endDate,
      status: item.status
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  function handleDelete(id: string) {
    setLeaves((prev: LeaveRequest[]) => prev.filter((item: LeaveRequest) => item.id !== id));
  }

  function handleInputChange(field: keyof Omit<LeaveRequest, 'id'>, value: string) {
    setForm((prev: Omit<LeaveRequest, 'id'>) => ({ ...prev, [field]: value }));
  }

  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    setForm((prev: Omit<LeaveRequest, 'id'>) => ({ ...prev, status: event.target.value as LeaveStatus }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (editingId) {
      setLeaves((prev: LeaveRequest[]) =>
        prev.map((item: LeaveRequest) => (item.id === editingId ? { ...form, id: editingId } : item))
      );
    } else {
      setLeaves((prev: LeaveRequest[]) => [...prev, { ...form, id: getNextId() }]);
    }

    closeForm();
  }

  return (
    <section className="employee-page">
      <style>{`.leave-toolbar {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.employee-btn {
  border: none;
  border-radius: 6px;
  padding: 8px 14px;
  color: #fff;
  cursor: pointer;
  margin-right: 8px;
}

.employee-btn:last-child {
  margin-right: 0;
}

.employee-btn-add { background: #1677ff; }
.employee-btn-edit { background: #faad14; }
.employee-btn-delete { background: #ff4d4f; }

.leave-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background: #fff;
}

.leave-table th,
.leave-table td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

.leave-table th {
  background-color: #4caf50;
  color: #fff;
}`}</style>

      <div className="leave-toolbar">
        <button type="button" className="employee-btn employee-btn-add" onClick={openAddForm}>
          Add Leave
        </button>
      </div>

      {showForm && (
        <form className="employee-form-card" onSubmit={handleSubmit}>
          <div className="employee-form-grid">
            <label className="employee-field">
              <span>Employee ID</span>
              <input
                value={form.employeeId}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('employeeId', event.target.value)
                }
                required
              />
            </label>

            <label className="employee-field">
              <span>Reason</span>
              <input
                value={form.reason}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('reason', event.target.value)
                }
                required
              />
            </label>

            <label className="employee-field">
              <span>Casual Leave</span>
              <input
                type="number"
                min="0"
                value={form.casualLeave}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('casualLeave', event.target.value)
                }
                required
              />
            </label>

            <label className="employee-field">
              <span>Sick Leave</span>
              <input
                type="number"
                min="0"
                value={form.sickLeave}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('sickLeave', event.target.value)
                }
                required
              />
            </label>

            <label className="employee-field">
              <span>Earned Leave</span>
              <input
                type="number"
                min="0"
                value={form.earnedLeave}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('earnedLeave', event.target.value)
                }
                required
              />
            </label>

            <label className="employee-field">
              <span>Start Date</span>
              <input
                type="date"
                value={form.startDate}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('startDate', event.target.value)
                }
                required
              />
            </label>

            <label className="employee-field">
              <span>End Date</span>
              <input
                type="date"
                value={form.endDate}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('endDate', event.target.value)
                }
                required
              />
            </label>

            <label className="employee-field">
              <span>Status</span>
              <select value={form.status} onChange={handleStatusChange} required>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </label>
          </div>

          <div className="employee-form-actions">
            <button type="button" className="employee-btn employee-btn-delete" onClick={closeForm}>
              Cancel
            </button>
            <button type="submit" className="employee-btn employee-btn-add">
              {editingId ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {leaves.length > 0 && (
        <table className="leave-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Casual Leave</th>
              <th>Sick Leave</th>
              <th>Earned Leave</th>
              <th>Reason</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaves.map((item: LeaveRequest) => (
              <tr key={item.id}>
                <td>{item.employeeId}</td>
                <td>{item.casualLeave}</td>
                <td>{item.sickLeave}</td>
                <td>{item.earnedLeave}</td>
                <td>{item.reason}</td>
                <td>{item.startDate}</td>
                <td>{item.endDate}</td>
                <td>{item.status}</td>
                <td>
                  <button
                    type="button"
                    className="employee-btn employee-btn-edit"
                    onClick={() => openEditForm(item)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="employee-btn employee-btn-delete"
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

