import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { apiRoutes } from '../config/api';

type Employee = {
  emp_id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
};

type EmployeesApiResponse = {
  data: Employee[];
};

const emptyForm = {
  emp_id: '',
  first_name: '',
  last_name: '',
  phone_number: '',
  email: ''
} as Employee;

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([] as Employee[]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null as string | null);
  const [form, setForm] = useState({ ...emptyForm } as Employee);
  async function loadEmployees(signal?: AbortSignal) {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(apiRoutes.employees, {
        signal
      });

      if (!response.ok) {
        throw new Error(`Failed to load employees (${response.status})`);
      }

      const result: EmployeesApiResponse = await response.json();
      setEmployees(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      setError(err instanceof Error ? err.message : 'Unable to load employees');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    loadEmployees(controller.signal);

    return () => controller.abort();
  }, []);

  function getNextEmployeeId(): string {
    const maxId = employees.reduce((max: number, employee: Employee) => {
      const parsed = Number(employee.emp_id);
      return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
    }, 0);

    return String(maxId + 1);
  }

  function openAddForm() {
    setEditingId(null);
    setForm({ ...emptyForm, emp_id: getNextEmployeeId() });
    setShowForm(true);
  }

  function openEditForm(employee: Employee) {
    setEditingId(employee.emp_id);
    setForm({ ...employee });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  function handleFormChange(field: keyof Employee, value: string) {
    setForm((prev: Employee) => ({ ...prev, [field]: value }));
  }

  async function handleDelete(empId: string) {
    try {
      setError(null);

      const response = await fetch(`${apiRoutes.employees}/${encodeURIComponent(empId)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete employee (${response.status})`);
      }

      setEmployees((prev: Employee[]) => prev.filter((employee: Employee) => employee.emp_id !== empId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete employee');
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError(null);

      if (editingId) {
        const response = await fetch(`${apiRoutes.employees}/${encodeURIComponent(editingId)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            first_name: form.first_name,
            last_name: form.last_name,
            phone_number: form.phone_number,
            email: form.email
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to update employee (${response.status})`);
        }

        setEmployees((prev: Employee[]) =>
          prev.map((employee: Employee) =>
            employee.emp_id === editingId ? { ...form, emp_id: editingId } : employee
          )
        );
      } else {
        setEmployees((prev: Employee[]) => [...prev, { ...form }]);
      }

      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save employee');
    }
  }

  return (
    <>
      <style>{`.employee-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background: #fff;
}

.employee-table th,
.employee-table td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

.employee-table th {
  background-color: #4caf50;
  color: white;
}

.employee-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.employee-table tr:hover {
  background-color: #f1f1f1;
}

.employee-status {
  margin-top: 20px;
  font-weight: 500;
}

.employee-toolbar {
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

.employee-btn-add {
  background: #1677ff;
}

.employee-btn-edit {
  background: #faad14;
}

.employee-btn-delete {
  background: #ff4d4f;
}

.employee-form-card {
  margin-top: 20px;
  padding: 16px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.employee-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.employee-form-grid label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.employee-form-grid input {
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 8px;
}

.employee-form-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}`}</style>

      <section className="employee-page">
        <div className="employee-toolbar">
          <button type="button" className="employee-btn employee-btn-add" onClick={openAddForm}>
            Add Employee
          </button>
        </div>

        {showForm && (
          <form className="employee-form-card" onSubmit={handleSubmit}>
            <div className="employee-form-grid">
              <label>
                Employee ID
                <input
                  value={form.emp_id}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    handleFormChange('emp_id', event.target.value)
                  }
                  disabled={Boolean(editingId)}
                  required
                />
              </label>

              <label>
                First Name
                <input
                  value={form.first_name}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    handleFormChange('first_name', event.target.value)
                  }
                  required
                />
              </label>

              <label>
                Last Name
                <input
                  value={form.last_name}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    handleFormChange('last_name', event.target.value)
                  }
                  required
                />
              </label>

              <label>
                Phone Number
                <input
                  value={form.phone_number}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    handleFormChange('phone_number', event.target.value)
                  }
                  required
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    handleFormChange('email', event.target.value)
                  }
                  required
                />
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

        {loading && <p className="employee-status">Loading employees...</p>}

        {!loading && error && (
          <div className="employee-status">
            <p>{error}</p>
            <div style={{ marginTop: 8 }}>
              <button type="button" className="employee-btn employee-btn-add" onClick={() => loadEmployees()}>
                Retry
              </button>
            </div>
          </div>
        )}

        {!loading && !error && employees.length === 0 && (
          <p className="employee-status">No employees found.</p>
        )}

        {!loading && !error && employees.length > 0 && (
          <table className="employee-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Phone Number</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee: Employee) => (
                <tr key={employee.emp_id}>
                  <td>{employee.emp_id}</td>
                  <td>{employee.first_name}</td>
                  <td>{employee.last_name}</td>
                  <td>{employee.phone_number}</td>
                  <td>{employee.email}</td>
                  <td>
                    <button
                      type="button"
                      className="employee-btn employee-btn-edit"
                      onClick={() => openEditForm(employee)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="employee-btn employee-btn-delete"
                      onClick={() => handleDelete(employee.emp_id)}
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
    </>
  );
}

