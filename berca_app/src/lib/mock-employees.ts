export interface Employee {
  id: string
  firstName: string
  lastName: string
  mail: string | null
  phoneNumber: string | null
  startDate: string
  endDate: string | null
  info: string | null
  birthDate: string | null
  street: string | null
  houseNumber: string | null
  busNumber: string | null
  zipCode: string | null
  place: string | null
  username: string
  createdAt: string
  permanentEmployee: boolean
  checkInfo: boolean
  newYearCard: boolean
  active: boolean
  passwordCreatedAt: string
  createdBy: string | null
  roleLevelId: string | null
  titleId: string | null
  pictureId: string | null
  deleted: boolean
  deletedAt: string | null
  deletedBy: string | null
}

export const MOCK_ROLE_LEVELS = [
  { id: "rl-1", name: "Admin" },
  { id: "rl-2", name: "Manager" },
  { id: "rl-3", name: "Employee" },
  { id: "rl-4", name: "Intern" },
]

export const MOCK_TITLES = [
  { id: "t-1", name: "Mr." },
  { id: "t-2", name: "Mrs." },
  { id: "t-3", name: "Ms." },
  { id: "t-4", name: "Dr." },
]

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: "e-001",
    firstName: "John",
    lastName: "Doe",
    mail: "john.doe@company.com",
    phoneNumber: "+32 471 123 456",
    startDate: "2021-03-15",
    endDate: null,
    info: "Senior developer, team lead for project Alpha.",
    birthDate: "1990-06-12",
    street: "Kerkstraat",
    houseNumber: "42",
    busNumber: null,
    zipCode: "3000",
    place: "Leuven",
    username: "john.doe",
    createdAt: "2021-03-10",
    permanentEmployee: true,
    checkInfo: true,
    newYearCard: true,
    active: true,
    passwordCreatedAt: "2021-03-10",
    createdBy: null,
    roleLevelId: "rl-1",
    titleId: "t-1",
    pictureId: null,
    deleted: false,
    deletedAt: null,
    deletedBy: null,
  },
  {
    id: "e-002",
    firstName: "Jane",
    lastName: "Smith",
    mail: "jane.smith@company.com",
    phoneNumber: "+32 471 654 321",
    startDate: "2022-01-10",
    endDate: null,
    info: null,
    birthDate: "1988-11-23",
    street: "Bondgenotenlaan",
    houseNumber: "15",
    busNumber: "A",
    zipCode: "3000",
    place: "Leuven",
    username: "jane.smith",
    createdAt: "2022-01-05",
    permanentEmployee: true,
    checkInfo: false,
    newYearCard: true,
    active: true,
    passwordCreatedAt: "2022-01-05",
    createdBy: "e-001",
    roleLevelId: "rl-2",
    titleId: "t-2",
    pictureId: null,
    deleted: false,
    deletedAt: null,
    deletedBy: null,
  },
  {
    id: "e-003",
    firstName: "Marc",
    lastName: "Janssens",
    mail: "marc.janssens@company.com",
    phoneNumber: "+32 476 987 654",
    startDate: "2023-06-01",
    endDate: null,
    info: "Part-time contractor for marketing.",
    birthDate: "1995-02-28",
    street: "Naamsestraat",
    houseNumber: "88",
    busNumber: null,
    zipCode: "3000",
    place: "Leuven",
    username: "marc.janssens",
    createdAt: "2023-05-25",
    permanentEmployee: false,
    checkInfo: true,
    newYearCard: false,
    active: true,
    passwordCreatedAt: "2023-05-25",
    createdBy: "e-001",
    roleLevelId: "rl-3",
    titleId: "t-1",
    pictureId: null,
    deleted: false,
    deletedAt: null,
    deletedBy: null,
  },
  {
    id: "e-004",
    firstName: "Sophie",
    lastName: "De Vries",
    mail: "sophie.devries@company.com",
    phoneNumber: null,
    startDate: "2020-09-01",
    endDate: "2024-08-31",
    info: null,
    birthDate: "1992-07-04",
    street: "Tiensestraat",
    houseNumber: "5",
    busNumber: null,
    zipCode: "3000",
    place: "Leuven",
    username: "sophie.devries",
    createdAt: "2020-08-20",
    permanentEmployee: true,
    checkInfo: true,
    newYearCard: true,
    active: false,
    passwordCreatedAt: "2020-08-20",
    createdBy: null,
    roleLevelId: "rl-3",
    titleId: "t-3",
    pictureId: null,
    deleted: false,
    deletedAt: null,
    deletedBy: null,
  },
  {
    id: "e-005",
    firstName: "Thomas",
    lastName: "Peeters",
    mail: "thomas.peeters@company.com",
    phoneNumber: "+32 479 111 222",
    startDate: "2024-02-12",
    endDate: null,
    info: "Summer intern, engineering department.",
    birthDate: "2001-12-15",
    street: "Brusselsestraat",
    houseNumber: "120",
    busNumber: "3",
    zipCode: "3000",
    place: "Leuven",
    username: "thomas.peeters",
    createdAt: "2024-02-01",
    permanentEmployee: false,
    checkInfo: false,
    newYearCard: false,
    active: true,
    passwordCreatedAt: "2024-02-01",
    createdBy: "e-002",
    roleLevelId: "rl-4",
    titleId: "t-1",
    pictureId: null,
    deleted: false,
    deletedAt: null,
    deletedBy: null,
  },
]
