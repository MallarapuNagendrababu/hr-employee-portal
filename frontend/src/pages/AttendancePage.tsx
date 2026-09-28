import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { apiRoutes } from '../config/api';

function calculateWorkingHours(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) {
    return '';
  }

  const [inHour, inMinute] = checkIn.split(':').map(Number);
  const [outHour, outMinute] = checkOut.split(':').map(Number);

  const checkInMinutes = inHour * 60 + inMinute;
  const checkOutMinutes = outHour * 60 + outMinute;
  const totalMinutes = checkOutMinutes - checkInMinutes;

  if (totalMinutes <= 0) {
    return '';
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

type AttendanceRecord = {
  id: string;
  employeeId: string;
  attendanceDate: string;
  checkInTime: string;
  checkOutTime: string;
  workingHours: string;
};

type AttendanceApiItem = {
  emp_id: number | string;
  attendance_date: string;
  check_in_time: string;
  check_out_time: string;
  working_hours: string;
};

type AttendanceApiResponse = {
  data: AttendanceApiItem[];
};

export default function AttendancePage() {
  const [employeeId, setEmployeeId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [records, setRecords] = useState([] as AttendanceRecord[]);
  const [editingId, setEditingId] = useState(null as string | null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);

  const workingHours = useMemo(
    () => calculateWorkingHours(checkInTime, checkOutTime),
    [checkInTime, checkOutTime]
  );

  function normalizeTime(value: string): string {
    if (!value) {
      return '';
    }

    const text = String(value);
    return text.length >= 5 ? text.slice(0, 5) : text;
  }

  function mapApiItemToAttendance(item: AttendanceApiItem): AttendanceRecord {
    const employeeId = String(item.emp_id);
    const rawDate = item.attendance_date ? String(item.attendance_date) : '';
    const date = rawDate ? rawDate.split('T')[0] : '';
    return {
      id: `${employeeId}__${date}`,
      employeeId,
      attendanceDate: date,
      checkInTime: normalizeTime(item.check_in_time),
      checkOutTime: normalizeTime(item.check_out_time),
      workingHours: String(item.working_hours ?? '')
    };
  }

  async function loadAttendance(signal?: AbortSignal) {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(apiRoutes.attendance, { signal });
      if (!response.ok) {
        throw new Error(`Failed to load attendance (${response.status})`);
      }

      const result: AttendanceApiResponse = await response.json();
      const items = Array.isArray(result.data) ? result.data.map(mapApiItemToAttendance) : [];
      setRecords(items);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      setError(err instanceof Error ? err.message : 'Unable to load attendance');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    loadAttendance(controller.signal);
    return () => controller.abort();
  }, []);

  function getNextId(): string {
    const maxId = records.reduce((max: number, record: AttendanceRecord) => {
      const parsed = Number(record.id);
      return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
    }, 0);

    return String(maxId + 1);
  }

  function resetForm() {
    setEmployeeId('');
    setAttendanceDate('');
    setCheckInTime('');
    setCheckOutTime('');
    setEditingId(null);
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function closeForm() {
    resetForm();
    setShowForm(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError(null);

      const payload = {
        emp_id: employeeId,
        attendance_date: attendanceDate,
        check_in_time: checkInTime,
        check_out_time: checkOutTime
      };

      if (editingId) {
        const response = await fetch(`${apiRoutes.attendance}/${encodeURIComponent(editingId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Failed to update attendance (${response.status})`);
        }

        setRecords((prev: AttendanceRecord[]) =>
          prev.map((record: AttendanceRecord) =>
            record.id === editingId
              ? {
                  id: editingId,
                  employeeId,
                  attendanceDate,
                  checkInTime,
                  checkOutTime,
                  workingHours
                }
              : record
          )
        );
      } else {
        const response = await fetch(apiRoutes.attendance, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Failed to create attendance (${response.status})`);
        }

        const result = (await response.json()) as { data?: AttendanceApiItem };
        const created = result.data
          ? mapApiItemToAttendance(result.data)
          : {
              id: `${employeeId}__${attendanceDate}`,
              employeeId,
              attendanceDate,
              checkInTime,
              checkOutTime,
              workingHours
            };

        setRecords((prev: AttendanceRecord[]) => [created, ...prev]);
      }

      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save attendance');
    }
  }

  function handleEmployeeIdChange(event: ChangeEvent<HTMLInputElement>) {
    setEmployeeId(event.target.value);
  }

  function handleAttendanceDateChange(event: ChangeEvent<HTMLInputElement>) {
    setAttendanceDate(event.target.value);
  }

  function handleCheckInChange(event: ChangeEvent<HTMLInputElement>) {
    setCheckInTime(event.target.value);
  }

  function handleCheckOutChange(event: ChangeEvent<HTMLInputElement>) {
    setCheckOutTime(event.target.value);
  }

  function handleEdit(record: AttendanceRecord) {
    setEditingId(record.id);
    setEmployeeId(record.employeeId);
    setAttendanceDate(record.attendanceDate);
    setCheckInTime(record.checkInTime);
    setCheckOutTime(record.checkOutTime);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    try {
      setError(null);

      const response = await fetch(`${apiRoutes.attendance}/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete attendance (${response.status})`);
      }

      setRecords((prev: AttendanceRecord[]) => prev.filter((record: AttendanceRecord) => record.id !== id));

      if (editingId === id) {
        closeForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete attendance');
    }
  }

  return (
    <section
      style={{
        backgroundColor: '#f4f8ff',
        border: '1px solid #d6e4ff',
        borderRadius: '12px',
        padding: '20px'
      }}
    >
      <div
        style={{
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'flex-end'
        }}
      >
        <button
          type="button"
          onClick={openAddForm}
          style={{
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 16px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Add Attendance
        </button>
      </div>

      {showForm && (
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
          <label style={{ color: '#1e2a3b', fontWeight: 600 }}>
            Employee ID
            <input
              type="text"
              value={employeeId}
              onChange={handleEmployeeIdChange}
              placeholder="Enter employee ID"
              style={{ border: '1px solid #b7cdfa', borderRadius: '8px', padding: '10px', marginTop: '6px' }}
              required
            />
          </label>

          <label style={{ color: '#1e2a3b', fontWeight: 600 }}>
            Attendance Date
            <input
              type="date"
              value={attendanceDate}
              onChange={handleAttendanceDateChange}
              style={{ border: '1px solid #b7cdfa', borderRadius: '8px', padding: '10px', marginTop: '6px' }}
              required
            />
          </label>

          <label style={{ color: '#1e2a3b', fontWeight: 600 }}>
            Check-in Time
            <input
              type="time"
              value={checkInTime}
              onChange={handleCheckInChange}
              style={{ border: '1px solid #7cc7a8', borderRadius: '8px', padding: '10px', marginTop: '6px' }}
              required
            />
          </label>

          <label style={{ color: '#1e2a3b', fontWeight: 600 }}>
            Check-out Time
            <input
              type="time"
              value={checkOutTime}
              onChange={handleCheckOutChange}
              style={{ border: '1px solid #f3b26b', borderRadius: '8px', padding: '10px', marginTop: '6px' }}
              required
            />
          </label>

          <label style={{ color: '#1e2a3b', fontWeight: 600, gridColumn: '1 / -1' }}>
            Working Hours
            <input
              type="text"
              value={workingHours}
              placeholder="Calculated automatically"
              style={{ border: '1px solid #9db5e8', borderRadius: '8px', padding: '10px', marginTop: '6px', backgroundColor: '#eef4ff' }}
              readOnly
            />
          </label>

          <div style={{ display: 'flex', gap: '10px', gridColumn: '1 / -1' }}>
            <button
              type="submit"
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {editingId ? 'Update' : 'Save'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              style={{
                backgroundColor: '#6b7280',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && (
        <p style={{ marginTop: '12px', color: '#475569', fontWeight: 500 }}>Loading attendance...</p>
      )}

      {error && (
        <p style={{ marginTop: '12px', color: '#b91c1c', fontWeight: 600 }}>{error}</p>
      )}

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
              <th style={{ border: '1px solid #4caf50', padding: '10px', backgroundColor: '#4caf50', color: '#fff' }}>Date</th>
              <th style={{ border: '1px solid #4caf50', padding: '10px', backgroundColor: '#4caf50', color: '#fff' }}>Check-in</th>
              <th style={{ border: '1px solid #4caf50', padding: '10px', backgroundColor: '#4caf50', color: '#fff' }}>Check-out</th>
              <th style={{ border: '1px solid #4caf50', padding: '10px', backgroundColor: '#4caf50', color: '#fff' }}>Working Hours</th>
              <th style={{ border: '1px solid #4caf50', padding: '10px', backgroundColor: '#4caf50', color: '#fff' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record: AttendanceRecord, index: number) => (
              <tr key={record.id} style={{ backgroundColor: index % 2 === 0 ? '#eef9ef' : '#fff' }}>
                <td style={{ border: '1px solid #cfe6dd', padding: '10px' }}>{record.employeeId}</td>
                <td style={{ border: '1px solid #cfe6dd', padding: '10px' }}>{record.attendanceDate}</td>
                <td style={{ border: '1px solid #cfe6dd', padding: '10px' }}>{record.checkInTime}</td>
                <td style={{ border: '1px solid #cfe6dd', padding: '10px' }}>{record.checkOutTime}</td>
                <td style={{ border: '1px solid #cfe6dd', padding: '10px' }}>{record.workingHours}</td>
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

