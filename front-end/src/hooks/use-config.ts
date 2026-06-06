import { useState, useEffect } from "react";
import { getDepartmentsApi, getSemestersApi } from "@/lib/configService";

// Module-level cache — fetched once per browser session, shared across all components.
let _departments: string[] | null = null;
let _semesters: string[] | null = null;

export function useDepartments() {
  const [departments, setDepartments] = useState<string[]>(_departments ?? []);

  useEffect(() => {
    if (_departments) { setDepartments(_departments); return; }
    getDepartmentsApi().then((d) => { _departments = d; setDepartments(d); }).catch(() => {});
  }, []);

  return departments;
}

export function useSemesters() {
  const [semesters, setSemesters] = useState<string[]>(_semesters ?? []);

  useEffect(() => {
    if (_semesters) { setSemesters(_semesters); return; }
    getSemestersApi().then((s) => { _semesters = s; setSemesters(s); }).catch(() => {});
  }, []);

  return semesters;
}