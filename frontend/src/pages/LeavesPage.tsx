import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { apiRoutes } from '../config/api';
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

type LeaveApiItem = {
  id: number | string;
  employee_id: string;
  casual_leave: number | string;
  sick_leave: number | string;
  earned_leave: number | string;
  reason: string;
  start_date: string;
  end_date: string;
  status: LeaveStatus;
};

type LeavesApiResponse = {
  data: LeaveApiItem[];
};

type EmployeeApiItem = {
  emp_id: string;
};

type EmployeesApiResponse = {
  data: EmployeeApiItem[];
};

function sortLeavesByEmployeeId(items: LeaveRequest[]): LeaveRequest[] {
  return [...items].sort((a: LeaveRequest, b: LeaveRequest) =>
    a.employeeId.localeCompare(b.employeeId, undefined, { numeric: true, sensitivity: 'base' })
  );
}

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
  const [employeeIds, setEmployeeIds] = useState([] as string[]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null as string | null);
  const [form, setForm] = useState({ ...emptyForm } as Omit<LeaveRequest, 'id'>);

  function mapApiItemToLeave(item: LeaveApiItem): LeaveRequest {
    return {
      id: String(item.id),
      employeeId: String(item.employee_id),
      casualLeave: String(item.casual_leave),
      sickLeave: String(item.sick_leave),
      earnedLeave: String(item.earned_leave),
      reason: item.reason,
      startDate: item.start_date ? String(item.start_date).slice(0, 10) : '',
      endDate: item.end_date ? String(item.end_date).slice(0, 10) : '',
      status: item.status
    };
  }

  async function loadLeaves(signal?: AbortSignal) {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(apiRoutes.leaves, { signal });
      if (!response.ok) {
        throw new Error(`Failed to load leaves (${response.status})`);
      }

      const result: LeavesApiResponse = await response.json();
      const items = Array.isArray(result.data) ? result.data.map(mapApiItemToLeave) : [];
      setLeaves(sortLeavesByEmployeeId(items));
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Unable to load leaves');
    } finally {
      setLoading(false);
    }
  }

  async function loadEmployeeIds(signal?: AbortSignal) {
    try {
      const response = await fetch(apiRoutes.employees, { signal });
      if (!response.ok) {
        return;
      }

      const result: EmployeesApiResponse = await response.json();
      const ids = Array.isArray(result.data)
        ? result.data
            .map((item: EmployeeApiItem) => String(item.emp_id).trim())
            .filter((id: string) => id.length > 0)
        : [];

      setEmployeeIds(ids);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    loadLeaves(controller.signal);
    loadEmployeeIds(controller.signal);
    return () => controller.abort();
  }, []);

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

  async function handleDelete(id: string) {
    try {
      setError(null);

      const response = await fetch(`${apiRoutes.leaves}/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete leave (${response.status})`);
      }

      setLeaves((prev: LeaveRequest[]) => prev.filter((item: LeaveRequest) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete leave');
    }
  }

  function handleInputChange(field: keyof Omit<LeaveRequest, 'id'>, value: string) {
    setForm((prev: Omit<LeaveRequest, 'id'>) => ({ ...prev, [field]: value }));
  }

  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    setForm((prev: Omit<LeaveRequest, 'id'>) => ({ ...prev, status: event.target.value as LeaveStatus }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError(null);

      const normalizedEmployeeId = form.employeeId.trim();
      if (!normalizedEmployeeId) {
        throw new Error('Employee ID is required');
      }

      const payload = {
        employee_id: normalizedEmployeeId,
        casual_leave: Number(form.casualLeave),
        sick_leave: Number(form.sickLeave),
        earned_leave: Number(form.earnedLeave),
        reason: form.reason,
        start_date: form.startDate,
        end_date: form.endDate,
        status: form.status
      };

      if (editingId) {
        const response = await fetch(`${apiRoutes.leaves}/${encodeURIComponent(editingId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Failed to update leave (${response.status})`);
        }

        setLeaves((prev: LeaveRequest[]) =>
          sortLeavesByEmployeeId(
            prev.map((item: LeaveRequest) => (item.id === editingId ? { ...form, id: editingId } : item))
          )
        );
      } else {
        const response = await fetch(apiRoutes.leaves, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Failed to create leave (${response.status})`);
        }

        const result = (await response.json()) as { data?: LeaveApiItem };
        const created = result.data ? mapApiItemToLeave(result.data) : { ...form, id: getNextId() };
        setLeaves((prev: LeaveRequest[]) => sortLeavesByEmployeeId([created, ...prev]));
      }

      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save leave');
    }
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
                list="employee-id-options"
                placeholder="Select or enter employee ID"
                required
              />
              <datalist id="employee-id-options">
                {employeeIds.map((id: string) => (
                  <option key={id} value={id} />
                ))}
              </datalist>
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

      {loading && <p className="employee-status">Loading leaves...</p>}

      {!loading && error && (
        <div className="employee-status">
          <p>{error}</p>
          <div style={{ marginTop: 8 }}>
            <button type="button" className="employee-btn employee-btn-add" onClick={() => loadLeaves()}>
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !error && leaves.length > 0 && (
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

      {!loading && !error && leaves.length === 0 && (
        <p className="employee-status">No leave records found.</p>
      )}
    </section>
  );
}

