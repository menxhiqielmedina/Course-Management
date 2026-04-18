export type Role = "admin" | "professor" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  description: string;
  credits: number;
  department: string;
  professorId: string;
  studentsEnrolled: number;
  capacity: number;
  semester: string;
  status: "active" | "draft" | "archived";
  color: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
  major: string;
  year: number;
  gpa: number;
  enrolledCourses: string[];
  status: "active" | "inactive";
  avatar?: string;
}

export interface Professor {
  id: string;
  name: string;
  email: string;
  department: string;
  title: string;
  courses: string[];
  yearsExperience: number;
  rating: number;
  avatar?: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  totalPoints: number;
  submissions: number;
  status: "open" | "closed" | "draft";
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  timestamp: string;
}

export interface ScheduleEvent {
  id: string;
  courseId: string;
  title: string;
  day: number; // 0-6
  startHour: number;
  endHour: number;
  room: string;
  color: string;
}

export interface FileItem {
  id: string;
  name: string;
  type: "pdf" | "doc" | "image" | "video" | "other";
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  courseId?: string;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  ip: string;
}

export const mockProfessors: Professor[] = [
  { id: "p1", name: "Dr. Eleanor Hayes", email: "e.hayes@university.edu", department: "Computer Science", title: "Professor", courses: ["c1", "c2"], yearsExperience: 15, rating: 4.8 },
  { id: "p2", name: "Dr. Marcus Chen", email: "m.chen@university.edu", department: "Mathematics", title: "Associate Professor", courses: ["c3"], yearsExperience: 10, rating: 4.6 },
  { id: "p3", name: "Dr. Sofia Reyes", email: "s.reyes@university.edu", department: "Physics", title: "Professor", courses: ["c4"], yearsExperience: 18, rating: 4.9 },
  { id: "p4", name: "Dr. James Patel", email: "j.patel@university.edu", department: "Computer Science", title: "Assistant Professor", courses: ["c5"], yearsExperience: 6, rating: 4.5 },
  { id: "p5", name: "Dr. Anna Kowalski", email: "a.kowalski@university.edu", department: "Engineering", title: "Professor", courses: ["c6"], yearsExperience: 12, rating: 4.7 },
];

export const mockCourses: Course[] = [
  { id: "c1", code: "CS101", title: "Introduction to Computer Science", description: "Fundamentals of programming, algorithms, and computational thinking.", credits: 4, department: "Computer Science", professorId: "p1", studentsEnrolled: 124, capacity: 150, semester: "Fall 2025", status: "active", color: "230 75% 56%" },
  { id: "c2", code: "CS305", title: "Data Structures & Algorithms", description: "Advanced data structures, algorithm design and complexity analysis.", credits: 4, department: "Computer Science", professorId: "p1", studentsEnrolled: 89, capacity: 100, semester: "Fall 2025", status: "active", color: "250 70% 60%" },
  { id: "c3", code: "MATH210", title: "Linear Algebra", description: "Vector spaces, matrices, eigenvalues and linear transformations.", credits: 3, department: "Mathematics", professorId: "p2", studentsEnrolled: 67, capacity: 80, semester: "Fall 2025", status: "active", color: "199 89% 48%" },
  { id: "c4", code: "PHYS201", title: "Quantum Mechanics", description: "Introduction to quantum theory and its applications.", credits: 4, department: "Physics", professorId: "p3", studentsEnrolled: 45, capacity: 60, semester: "Fall 2025", status: "active", color: "280 70% 60%" },
  { id: "c5", code: "CS410", title: "Machine Learning", description: "Supervised and unsupervised learning, neural networks.", credits: 4, department: "Computer Science", professorId: "p4", studentsEnrolled: 102, capacity: 120, semester: "Fall 2025", status: "active", color: "142 71% 45%" },
  { id: "c6", code: "ENG250", title: "Mechanical Engineering Basics", description: "Statics, dynamics, and material science introduction.", credits: 3, department: "Engineering", professorId: "p5", studentsEnrolled: 78, capacity: 90, semester: "Fall 2025", status: "active", color: "38 92% 50%" },
  { id: "c7", code: "CS201", title: "Web Development", description: "Modern frontend and backend web technologies.", credits: 3, department: "Computer Science", professorId: "p1", studentsEnrolled: 0, capacity: 100, semester: "Spring 2026", status: "draft", color: "199 89% 48%" },
];

export const mockStudents: Student[] = Array.from({ length: 24 }, (_, i) => ({
  id: `s${i + 1}`,
  name: ["Alice Johnson","Bob Smith","Carla Diaz","David Kim","Emma Wilson","Frank Liu","Grace Park","Henry Adams","Isla Brown","Jack Murphy","Kira Singh","Liam O'Brien","Maya Patel","Noah Garcia","Olivia Martin","Pedro Lopez","Quinn Walker","Rachel Green","Sam Cooper","Tina Wong","Uma Sharma","Victor Hugo","Wendy Lee","Xavier Cruz"][i],
  email: `student${i + 1}@university.edu`,
  studentId: `STU${2025000 + i + 1}`,
  major: ["Computer Science", "Mathematics", "Physics", "Engineering"][i % 4],
  year: (i % 4) + 1,
  gpa: +(3 + Math.random()).toFixed(2),
  enrolledCourses: ["c1", "c2", "c5"].slice(0, (i % 3) + 1),
  status: i % 7 === 0 ? "inactive" : "active",
}));

export const mockAssignments: Assignment[] = [
  { id: "a1", courseId: "c1", title: "Programming Basics Quiz", description: "Cover variables, loops and functions.", dueDate: "2025-11-15", totalPoints: 100, submissions: 98, status: "open" },
  { id: "a2", courseId: "c2", title: "Binary Tree Implementation", description: "Implement BST with insert/delete/search.", dueDate: "2025-11-20", totalPoints: 150, submissions: 67, status: "open" },
  { id: "a3", courseId: "c3", title: "Matrix Operations", description: "Solve problems on matrix multiplication.", dueDate: "2025-11-10", totalPoints: 80, submissions: 67, status: "closed" },
  { id: "a4", courseId: "c5", title: "Linear Regression Model", description: "Build a regression model with sklearn.", dueDate: "2025-11-25", totalPoints: 200, submissions: 45, status: "open" },
  { id: "a5", courseId: "c4", title: "Wave Function Problem Set", description: "Solve the given quantum problems.", dueDate: "2025-12-01", totalPoints: 120, submissions: 12, status: "open" },
  { id: "a6", courseId: "c6", title: "Statics Lab Report", description: "Write a lab report for the bridge experiment.", dueDate: "2025-12-05", totalPoints: 100, submissions: 0, status: "draft" },
];

export const mockNotifications: Notification[] = [
  { id: "n1", title: "New assignment posted", message: "CS101 - Programming Basics Quiz is now available.", type: "info", read: false, timestamp: "2025-11-08T10:30:00" },
  { id: "n2", title: "Grade published", message: "Your CS305 midterm grade is now available.", type: "success", read: false, timestamp: "2025-11-08T08:15:00" },
  { id: "n3", title: "Schedule updated", message: "MATH210 lecture moved to Room 204.", type: "warning", read: true, timestamp: "2025-11-07T14:00:00" },
  { id: "n4", title: "System maintenance", message: "Platform will be down Sunday 2-4 AM.", type: "info", read: true, timestamp: "2025-11-06T09:00:00" },
  { id: "n5", title: "Assignment overdue", message: "PHYS201 Problem Set is past due.", type: "error", read: false, timestamp: "2025-11-05T18:00:00" },
];

export const mockSchedule: ScheduleEvent[] = [
  { id: "e1", courseId: "c1", title: "CS101", day: 1, startHour: 9, endHour: 11, room: "Room 101", color: "230 75% 56%" },
  { id: "e2", courseId: "c2", title: "CS305", day: 1, startHour: 13, endHour: 15, room: "Room 203", color: "250 70% 60%" },
  { id: "e3", courseId: "c3", title: "MATH210", day: 2, startHour: 10, endHour: 12, room: "Room 105", color: "199 89% 48%" },
  { id: "e4", courseId: "c5", title: "CS410", day: 3, startHour: 9, endHour: 11, room: "Lab 1", color: "142 71% 45%" },
  { id: "e5", courseId: "c4", title: "PHYS201", day: 4, startHour: 14, endHour: 16, room: "Room 301", color: "280 70% 60%" },
  { id: "e6", courseId: "c6", title: "ENG250", day: 5, startHour: 11, endHour: 13, room: "Room 402", color: "38 92% 50%" },
  { id: "e7", courseId: "c1", title: "CS101 Lab", day: 3, startHour: 14, endHour: 16, room: "Lab 2", color: "230 75% 56%" },
];

export const mockFiles: FileItem[] = [
  { id: "f1", name: "Lecture-01-Intro.pdf", type: "pdf", size: "2.4 MB", uploadedBy: "Dr. Eleanor Hayes", uploadedAt: "2025-11-01", courseId: "c1" },
  { id: "f2", name: "Syllabus-CS305.pdf", type: "pdf", size: "180 KB", uploadedBy: "Dr. Eleanor Hayes", uploadedAt: "2025-09-01", courseId: "c2" },
  { id: "f3", name: "DataStructures-Slides.pdf", type: "pdf", size: "5.1 MB", uploadedBy: "Dr. Eleanor Hayes", uploadedAt: "2025-10-15", courseId: "c2" },
  { id: "f4", name: "Linear-Algebra-Notes.doc", type: "doc", size: "640 KB", uploadedBy: "Dr. Marcus Chen", uploadedAt: "2025-10-20", courseId: "c3" },
  { id: "f5", name: "ML-Demo-Video.mp4", type: "video", size: "120 MB", uploadedBy: "Dr. James Patel", uploadedAt: "2025-11-05", courseId: "c5" },
  { id: "f6", name: "Quantum-Diagram.png", type: "image", size: "880 KB", uploadedBy: "Dr. Sofia Reyes", uploadedAt: "2025-11-03", courseId: "c4" },
];

export const mockAuditLogs: AuditLog[] = [
  { id: "l1", user: "admin@university.edu", action: "CREATED", target: "Course CS201", timestamp: "2025-11-08T10:30:00", ip: "192.168.1.10" },
  { id: "l2", user: "e.hayes@university.edu", action: "UPDATED", target: "Assignment a2", timestamp: "2025-11-08T09:15:00", ip: "192.168.1.22" },
  { id: "l3", user: "admin@university.edu", action: "DELETED", target: "Student s99", timestamp: "2025-11-07T16:40:00", ip: "192.168.1.10" },
  { id: "l4", user: "m.chen@university.edu", action: "LOGIN", target: "Auth", timestamp: "2025-11-07T08:00:00", ip: "10.0.0.5" },
  { id: "l5", user: "admin@university.edu", action: "EXPORTED", target: "Reports.csv", timestamp: "2025-11-06T15:20:00", ip: "192.168.1.10" },
  { id: "l6", user: "j.patel@university.edu", action: "UPLOADED", target: "ML-Demo-Video.mp4", timestamp: "2025-11-05T11:10:00", ip: "192.168.1.45" },
  { id: "l7", user: "admin@university.edu", action: "UPDATED", target: "Settings", timestamp: "2025-11-04T13:00:00", ip: "192.168.1.10" },
];

// Analytics
export const enrollmentTrend = [
  { month: "May", students: 820 },
  { month: "Jun", students: 932 },
  { month: "Jul", students: 901 },
  { month: "Aug", students: 1290 },
  { month: "Sep", students: 1480 },
  { month: "Oct", students: 1620 },
  { month: "Nov", students: 1750 },
];

export const departmentDistribution = [
  { name: "Computer Science", value: 420, color: "hsl(230 75% 56%)" },
  { name: "Mathematics", value: 220, color: "hsl(199 89% 48%)" },
  { name: "Physics", value: 180, color: "hsl(280 70% 60%)" },
  { name: "Engineering", value: 310, color: "hsl(38 92% 50%)" },
];

export const gradeDistribution = [
  { grade: "A", count: 145 },
  { grade: "B", count: 230 },
  { grade: "C", count: 180 },
  { grade: "D", count: 65 },
  { grade: "F", count: 22 },
];
