import { useEffect, useState } from "react";

type Student = {
  id: number;
  fullName: string;
  email: string;
};

const StudentDashboard = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const response = await fetch("https://localhost:7048/api/Students");

        if (!response.ok) {
          throw new Error("Nuk u morën të dhënat nga backend");
        }

        const data = await response.json();
        setStudents(data);
      } catch (err: any) {
        setError(err.message || "Ka ndodhur një gabim");
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Test Backend Connection</h1>

      {loading && <p>Loading...</p>}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <div>
          <h2>Students from Backend</h2>

          {students.length === 0 ? (
            <p>Nuk ka studentë në databazë.</p>
          ) : (
            <ul>
              {students.map((student) => (
                <li key={student.id}>
                  {student.id} - {student.fullName} - {student.email}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;