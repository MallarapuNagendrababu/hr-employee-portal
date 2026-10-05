import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { apiRoutes } from '../config/api';

function parseAmount(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

type PayrollRecord = {
  emp_id: number | string;
  payroll_month: string;
  basic_salary: number | string;
  allowances: number | string;
  deductions: number | string;
  net_salary: number | string;
};

function monthInputToLabel(value: string) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return value;
  const [year, month] = value.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

function monthLabelToInput(value: string) {
  if (!value) return '';
  if (/^\d{4}-\d{2}$/.test(value)) return value;

  const parts = String(value).trim().split(/\s+/);
  if (parts.length !== 2) return '';

  const [monthName, year] = parts;
  const monthMap: Record<string, string> = {
    january: '01',
    february: '02',
    march: '03',
    april: '04',
    may: '05',
    june: '06',
    july: '07',
    august: '08',
    september: '09',
    october: '10',
    november: '11',
    december: '12'
  };

  const mm = monthMap[monthName.toLowerCase()];
  if (!mm || !/^\d{4}$/.test(year)) return '';
  return `${year}-${mm}`;
}

export default function PayrollPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [payrollMonth, setPayrollMonth] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [allowances, setAllowances] = useState('');
  const [deductions, setDeductions] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [records, setRecords] = useState([] as PayrollRecord[]);
  const [editingEmpId, setEditingEmpId] = useState(null as number | null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);

  const netSalary = useMemo(() => {
    const total = parseAmount(basicSalary) + parseAmount(allowances) - parseAmount(deductions);
    return total > 0 ? total.toFixed(2) : '0.00';
  }, [basicSalary, allowances, deductions]);

  function resetForm() {
    setEmployeeId('');
    setPayrollMonth('');
    setBasicSalary('');
    setAllowances('');
    setDeductions('');
    setEditingEmpId(null);
    setIsFormOpen(false);
  }

  const [employeeInputEl, setEmployeeInputEl] = useState(null as HTMLInputElement | null);

  function openAdd() {
    resetForm();
    // default payroll month to current month
    const now = new Date();
    const month = now.toISOString().slice(0, 7);
    setPayrollMonth(month);
    setIsFormOpen(true);
    // focus the first input
    setTimeout(() => employeeInputEl?.focus(), 0);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      emp_id: Number(employeeId),
      payroll_month: monthInputToLabel(payrollMonth),
      basic_salary: Number(basicSalary),
      allowances: Number(allowances),
      deductions: Number(deductions),
      net_salary: Number(netSalary)
    };

    async function submit() {
      try {
        setLoading(true);
        setError(null);

        if (editingEmpId !== null) {
          const res = await fetch(`${apiRoutes.payroll}/${editingEmpId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!res.ok) throw new Error(`Update failed (${res.status})`);

          setRecords((prev: PayrollRecord[]) =>
            prev.map((record: PayrollRecord) =>
              Number(record.emp_id) === editingEmpId
                ? {
                    ...record,
                    emp_id: payload.emp_id,
                    payroll_month: payload.payroll_month,
                    basic_salary: payload.basic_salary,
                    allowances: payload.allowances,
                    deductions: payload.deductions,
                    net_salary: payload.net_salary
                  }
                : record
            )
          );
        } else {
          const res = await fetch(apiRoutes.payroll, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!res.ok) throw new Error(`Create failed (${res.status})`);

          const data = await res.json();
          const created = data.data as PayrollRecord | undefined;
          if (created) {
            setRecords((prev: PayrollRecord[]) => [created, ...prev]);
          }
        }

        resetForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save payroll');
      } finally {
        setLoading(false);
      }
    }

    submit();
  }

  function handleEmployeeIdChange(event: ChangeEvent<HTMLInputElement>) {
    setEmployeeId(event.target.value);
  }

  function handlePayrollMonthChange(event: ChangeEvent<HTMLInputElement>) {
    setPayrollMonth(event.target.value);
  }

  function handleBasicSalaryChange(event: ChangeEvent<HTMLInputElement>) {
    setBasicSalary(event.target.value);
  }

  function handleAllowancesChange(event: ChangeEvent<HTMLInputElement>) {
    setAllowances(event.target.value);
  }

  function handleDeductionsChange(event: ChangeEvent<HTMLInputElement>) {
    setDeductions(event.target.value);
  }

  function handleEdit(record: PayrollRecord) {
    setIsFormOpen(true);
    setEditingEmpId(Number(record.emp_id));
    setEmployeeId(String(record.emp_id));
    setPayrollMonth(monthLabelToInput(String(record.payroll_month)));
    setBasicSalary(String(record.basic_salary));
    setAllowances(String(record.allowances));
    setDeductions(String(record.deductions));
  }

  async function handleDelete(empId: number) {
    if (!confirm('Delete this payroll record?')) return;
    const previous = records;
    setRecords((prev: PayrollRecord[]) => prev.filter((record: PayrollRecord) => Number(record.emp_id) !== empId));

    try {
      setError(null);
      const res = await fetch(`${apiRoutes.payroll}/${empId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      if (editingEmpId === empId) {
        resetForm();
      }
    } catch (err) {
      setRecords(previous);
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  async function loadPayroll() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(apiRoutes.payroll);
      if (!res.ok) throw new Error(`Failed to load payroll (${res.status})`);
      const data = await res.json();
      setRecords(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load payroll');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section>
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
          {isFormOpen && editingEmpId === null ? 'Adding Payroll...' : 'Add Payroll'}
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
              ref={setEmployeeInputEl}
              value={employeeId}
              onChange={handleEmployeeIdChange}
              placeholder="Enter employee ID"
              required
            />
          </label>

          <label>
            Payroll Month
            <input type="month" value={payrollMonth} onChange={handlePayrollMonthChange} required />
          </label>

          <label>
            Basic Salary
            <input type="number" min="0" step="0.01" value={basicSalary} onChange={handleBasicSalaryChange} required />
          </label>

          <label>
            Allowances
            <input type="number" min="0" step="0.01" value={allowances} onChange={handleAllowancesChange} required />
          </label>

          <label>
            Deductions
            <input type="number" min="0" step="0.01" value={deductions} onChange={handleDeductionsChange} required />
          </label>

          <label style={{ gridColumn: '1 / -1' }}>
            Net Salary
            <input type="text" value={netSalary} readOnly />
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
              {editingEmpId !== null ? 'Update' : 'Save'}
            </button>

            <button
              type="button"
              onClick={resetForm}
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

      {loading && <p>Loading payroll records...</p>}
      {!loading && error && (
        <div>
          <p>{error}</p>
          <button type="button" onClick={() => loadPayroll()}>
            Retry
          </button>
        </div>
      )}

      {!loading && records.length > 0 && (
        <table
          style={{
            width: '100%',
            marginTop: '20px',
            borderCollapse: 'collapse',
            backgroundColor: '#f7fcf7',
            border: '1px solid #4caf50'
          }}
        >
          <thead>
            <tr>
              <th style={{ border: '1px solid #4caf50', padding: '10px', backgroundColor: '#4caf50', color: '#fff' }}>Employee ID</th>
              <th style={{ border: '1px solid #4caf50', padding: '10px', backgroundColor: '#4caf50', color: '#fff' }}>Payroll Month</th>
              <th style={{ border: '1px solid #4caf50', padding: '10px', backgroundColor: '#4caf50', color: '#fff' }}>Basic Salary</th>
              <th style={{ border: '1px solid #4caf50', padding: '10px', backgroundColor: '#4caf50', color: '#fff' }}>Allowances</th>
              <th style={{ border: '1px solid #4caf50', padding: '10px', backgroundColor: '#4caf50', color: '#fff' }}>Deductions</th>
              <th style={{ border: '1px solid #4caf50', padding: '10px', backgroundColor: '#4caf50', color: '#fff' }}>Net Salary</th>
              <th style={{ border: '1px solid #4caf50', padding: '10px', backgroundColor: '#4caf50', color: '#fff' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record: PayrollRecord, index: number) => (
              <tr key={`${record.emp_id}-${record.payroll_month}`} style={{ backgroundColor: index % 2 === 0 ? '#eef9ef' : '#fff' }}>
                <td style={{ border: '1px solid #cfe6dd', padding: '10px' }}>{record.emp_id}</td>
                <td style={{ border: '1px solid #cfe6dd', padding: '10px' }}>{record.payroll_month}</td>
                <td style={{ border: '1px solid #cfe6dd', padding: '10px' }}>{record.basic_salary}</td>
                <td style={{ border: '1px solid #cfe6dd', padding: '10px' }}>{record.allowances}</td>
                <td style={{ border: '1px solid #cfe6dd', padding: '10px' }}>{record.deductions}</td>
                <td style={{ border: '1px solid #cfe6dd', padding: '10px' }}>{record.net_salary}</td>
                <td style={{ border: '1px solid #cfe6dd', padding: '10px' }}>
                  <button
                    type="button"
                    onClick={() => handleEdit(record)}
                    style={{
                      backgroundColor: '#faad14',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      marginRight: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(Number(record.emp_id))}
                    style={{
                      backgroundColor: '#ff4d4f',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      cursor: 'pointer'
                    }}
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

