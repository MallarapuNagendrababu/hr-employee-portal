import { ChangeEvent, FormEvent, useMemo, useState } from 'react';

function parseAmount(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

type PayrollRecord = {
  id: string;
  employeeId: string;
  payrollMonth: string;
  basicSalary: string;
  allowances: string;
  deductions: string;
  netSalary: string;
};

export default function PayrollPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [payrollMonth, setPayrollMonth] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [allowances, setAllowances] = useState('');
  const [deductions, setDeductions] = useState('');
  const [records, setRecords] = useState([] as PayrollRecord[]);
  const [editingId, setEditingId] = useState(null as string | null);

  const netSalary = useMemo(() => {
    const total = parseAmount(basicSalary) + parseAmount(allowances) - parseAmount(deductions);
    return total > 0 ? total.toFixed(2) : '0.00';
  }, [basicSalary, allowances, deductions]);

  function getNextId(): string {
    const maxId = records.reduce((max: number, record: PayrollRecord) => {
      const parsed = Number(record.id);
      return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
    }, 0);

    return String(maxId + 1);
  }

  function resetForm() {
    setEmployeeId('');
    setPayrollMonth('');
    setBasicSalary('');
    setAllowances('');
    setDeductions('');
    setEditingId(null);
  }

  const [employeeInputEl, setEmployeeInputEl] = useState(null as HTMLInputElement | null);

  function openAdd() {
    resetForm();
    // default payroll month to current month
    const now = new Date();
    const month = now.toISOString().slice(0, 7);
    setPayrollMonth(month);
    // focus the first input
    setTimeout(() => employeeInputEl?.focus(), 0);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      id: editingId ?? getNextId(),
      employeeId,
      payrollMonth,
      basicSalary,
      allowances,
      deductions,
      netSalary
    } as PayrollRecord;

    if (editingId) {
      setRecords((prev: PayrollRecord[]) =>
        prev.map((record: PayrollRecord) => (record.id === editingId ? payload : record))
      );
    } else {
      setRecords((prev: PayrollRecord[]) => [...prev, payload]);
    }

    resetForm();
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
    setEditingId(record.id);
    setEmployeeId(record.employeeId);
    setPayrollMonth(record.payrollMonth);
    setBasicSalary(record.basicSalary);
    setAllowances(record.allowances);
    setDeductions(record.deductions);
  }

  function handleDelete(id: string) {
    setRecords((prev: PayrollRecord[]) => prev.filter((record: PayrollRecord) => record.id !== id));

    if (editingId === id) {
      resetForm();
    }
  }

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
          Add Payroll
        </button>
      </div>

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

        <button
          type="submit"
          style={{
            gridColumn: '1 / -1',
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
          {editingId ? 'Update' : 'Save'}
        </button>
      </form>

      {records.length > 0 && (
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
              <tr key={record.id} style={{ backgroundColor: index % 2 === 0 ? '#eef9ef' : '#fff' }}>
                <td style={{ border: '1px solid #cfe6dd', padding: '10px' }}>{record.employeeId}</td>
                <td style={{ border: '1px solid #cfe6dd', padding: '10px' }}>{record.payrollMonth}</td>
                <td style={{ border: '1px solid #cfe6dd', padding: '10px' }}>{record.basicSalary}</td>
                <td style={{ border: '1px solid #cfe6dd', padding: '10px' }}>{record.allowances}</td>
                <td style={{ border: '1px solid #cfe6dd', padding: '10px' }}>{record.deductions}</td>
                <td style={{ border: '1px solid #cfe6dd', padding: '10px' }}>{record.netSalary}</td>
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
                    onClick={() => handleDelete(record.id)}
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

