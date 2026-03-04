import type {PrismaClient} from '@/generated/prisma/client'
import {randomUUID} from 'crypto'
import {hashPassword} from '@/lib/passwordUtils'

// Departments with icons and HEX colors
const ALL_DEPARTMENTS = [
  {
    name: 'General',
    description: 'Office coordination, scheduling, and general administration',
    icon: 'Clipboard',
    color: '#00b0f0',
    number: 1,
  },
  {
    name: 'Accounting',
    description: 'Financial records, audits, and reporting',
    icon: 'Calculator',
    color: '#0c78d2',
    number: 2,
  },
  {
    name: 'Engineering',
    description: 'Development, deployments, and infrastructure',
    icon: 'Wrench',
    color: '#aeaaaa',
    number: 3,
  },
  {
    name: 'Training',
    description: 'Employee development and learning programs',
    icon: 'BookOpen',
    color: '#00cc00',
    number: 4,
  },
  {
    name: 'Project',
    description: 'Project planning, timelines, and deliverables',
    icon: 'ClipboardList',
    color: '#ffff00',
    number: 5,
  },
  {
    name: 'SHEQ',
    description: 'Safety, Health, Environment, and Quality',
    icon: 'ShieldCheck',
    color: '#f7caac',
    number: 6,
  },
  {
    name: 'HR',
    description: 'Employee records, recruitment, and onboarding',
    icon: 'Users',
    color: '#7030a0',
    number: 7,
  },
  {
    name: 'Management',
    description: 'Leadership, strategy, and organizational planning',
    icon: 'Briefcase',
    color: '#ffc000',
    number: 8,
  },
  {
    name: 'Database',
    description: 'Database administration and data integrity',
    icon: 'Database',
    color: '#2de2e6',
    number: 9,
  },
  {
    name: 'Purchasing',
    description: 'Supplies, vendor management, and procurement',
    icon: 'ShoppingCart',
    color: '#ff4fa3',
    number: 10,
  },
  {
    name: 'Warehouse',
    description: 'Inventory storage, stock control, and goods handling',
    icon: 'Package',
    color: '#e3c2e4',
    number: 11,
  },
  {
    name: 'Sales',
    description: 'Leads, deals, and customer acquisition',
    icon: 'TrendingUp',
    color: '#fe6f5e',
    number: 12,
  },
  {
    name: 'PR',
    description: 'Public relations, media, and communications',
    icon: 'Megaphone',
    color: '#7800ef',
    number: 13,
  },
  {
    name: 'Product Quality',
    description: 'Product inspection, quality assurance, and standards compliance',
    icon: 'CheckCircle',
    color: '#8c92ac',
    number: 14,
  },
]

const SUB_ROLES = [
  {name: 'user', level: 20},
  {name: 'senior-user', level: 40},
  {name: 'supervisor', level: 60},
  {name: 'manager', level: 80},
]

type SubRoleName = (typeof SUB_ROLES)[number]['name']

const createdSubRoles: Record<SubRoleName, {id: string; level: number}> = {} as Record<
  SubRoleName,
  {id: string; level: number}
>

const PROJECT_TYPES = [{name: 'Engineering'}, {name: 'Training'}, {name: 'Consulting'}, {name: 'Internal'}]

export const seedProd = async (prisma: PrismaClient) => {
  console.log('Running DEVELOPMENT seed (administrator)')
  const now = new Date()

  // 1. Upsert admin employee
  let adminEmployee = await prisma.employee.findFirst({where: {username: 'admin'}})
  if (!adminEmployee) {
    adminEmployee = await prisma.employee.create({
      data: {
        id: randomUUID(),
        firstName: 'System',
        lastName: 'Administrator',
        mail: 'admin@yourapp.com',
        username: 'admin',
        password_hash: hashPassword('change-me'),
        startDate: now,
        createdAt: now,
        passwordCreatedAt: now,
        permanentEmployee: true,
        active: true,
      },
    })
  }

  // 2. Upsert Administrator role
  let adminRole = await prisma.role.findFirst({where: {name: 'Administrator'}})
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        id: randomUUID(),
        name: 'Administrator',
        createdAt: now,
        createdBy: adminEmployee.id,
      },
    })
  }

  // 3. Upsert Administrator subRole
  let adminSubRole = await prisma.subRole.findFirst({where: {name: 'Administrator'}})
  if (!adminSubRole) {
    adminSubRole = await prisma.subRole.create({
      data: {
        id: randomUUID(),
        name: 'Administrator',
        level: 100,
        createdAt: now,
        createdBy: adminEmployee.id,
      },
    })
  }

  // 4. Upsert Administrator roleLevel
  let adminRoleLevel = await prisma.roleLevel.findFirst({
    where: {roleId: adminRole.id, subRoleId: adminSubRole.id},
  })
  if (!adminRoleLevel) {
    adminRoleLevel = await prisma.roleLevel.create({
      data: {
        id: randomUUID(),
        roleId: adminRole.id,
        subRoleId: adminSubRole.id,
        createdAt: now,
        createdBy: adminEmployee.id,
      },
    })
  }

  // 5. Attach admin roleLevel (only if not already set)
  if (!adminEmployee.roleLevelId) {
    await prisma.employee.update({
      where: {id: adminEmployee.id},
      data: {roleLevelId: adminRoleLevel.id},
    })
  }

  console.log('Administrator account created')

  // 6. Upsert shared subRoles
  for (const sub of SUB_ROLES) {
    let existing = await prisma.subRole.findFirst({where: {name: sub.name}})
    if (!existing) {
      existing = await prisma.subRole.create({
        data: {
          id: randomUUID(),
          name: sub.name,
          level: sub.level,
          createdAt: now,
          createdBy: adminEmployee.id,
        },
      })
    }
    createdSubRoles[sub.name] = {id: existing.id, level: existing.level}
  }

  // 7. Upsert TargetTypes
  async function upsertTargetType(name: string) {
    let tt = await prisma.targetType.findFirst({where: {name}})
    if (!tt) {
      tt = await prisma.targetType.create({
        data: {id: randomUUID(), name, createdAt: now, createdBy: adminEmployee!.id},
      })
    }
    return tt
  }

  const departmentTargetType = await upsertTargetType('Department')
  const companyTargetType = await upsertTargetType('Company')
  await upsertTargetType('Project')
  await upsertTargetType('WorkOrder')
  await upsertTargetType('WorkOrderStructure')
  await upsertTargetType('Contact')

  // 9. Upsert Departments + Department Roles + RoleLevels + Targets
  for (const dept of ALL_DEPARTMENTS) {
    const existingDept = await prisma.department.findFirst({where: {name: dept.name}})
    if (existingDept) continue

    const deptTarget = await prisma.target.create({
      data: {
        id: randomUUID(),
        createdAt: now,
        createdBy: adminEmployee.id,
        targetTypeId: departmentTargetType.id,
      },
    })

    await prisma.department.create({
      data: {
        id: randomUUID(),
        name: dept.name,
        color: dept.color,
        icon: dept.icon,
        description: dept.description,
        number: dept.number,
        createdAt: now,
        createdBy: adminEmployee.id,
        targetId: deptTarget.id,
      },
    })

    const departmentRole = await prisma.role.create({
      data: {
        id: randomUUID(),
        name: `${dept.name} Role`,
        createdAt: now,
        createdBy: adminEmployee.id,
      },
    })

    for (const sub of SUB_ROLES) {
      await prisma.roleLevel.create({
        data: {
          id: randomUUID(),
          roleId: departmentRole.id,
          subRoleId: createdSubRoles[sub.name].id,
          createdAt: now,
          createdBy: adminEmployee.id,
        },
      })

      await prisma.visibilityForRole.create({
        data: {
          id: randomUUID(),
          visible: true,
          roleLevelId: adminRoleLevel.id,
          targetId: deptTarget.id,
        },
      })
    }
  }

  // 10. Upsert default Titles
  const DEFAULT_TITLES = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'Ir.']

  for (const titleName of DEFAULT_TITLES) {
    const existing = await prisma.title.findFirst({where: {name: titleName}})
    if (!existing) {
      await prisma.title.create({
        data: {
          id: randomUUID(),
          name: titleName,
          createdAt: now,
          createdBy: adminEmployee.id,
          deleted: false,
        },
      })
    }
  }

  console.log('Default titles seeded')

  // 11-12. Upsert Becra company
  let becraCompany = await prisma.company.findFirst({where: {name: 'Becra BV'}})
  if (!becraCompany) {
    const becraTarget = await prisma.target.create({
      data: {
        id: randomUUID(),
        createdAt: now,
        createdBy: adminEmployee.id,
        targetTypeId: companyTargetType.id,
      },
    })

    becraCompany = await prisma.company.create({
      data: {
        id: randomUUID(),
        name: 'Becra BV',
        number: 'BECRA-001',
        mail: 'info@becra.be',
        businessPhone: '+32 495 19 43 68',
        website: 'https://www.becra.be',
        companyActive: true,
        headQuarters: true,
        customer: false,
        supplier: false,
        createdAt: now,
        createdBy: adminEmployee.id,
        targetId: becraTarget.id,
      },
    })

    // 13. Create address only when company is new
    await prisma.companyAdress.create({
      data: {
        id: randomUUID(),
        street: 'Nijverheidsstraat',
        houseNumber: '14',
        zipCode: '2400',
        place: 'Mol',
        typeAdress: 'headquarters',
        createdAt: now,
        createdBy: adminEmployee.id,
        companyId: becraCompany.id,
      },
    })
  }

  console.log('Becra company and address seeded')

  // 14. Upsert project types
  for (const pt of PROJECT_TYPES) {
    const existing = await prisma.projectType.findFirst({where: {name: pt.name}})
    if (!existing) {
      await prisma.projectType.create({
        data: {
          id: randomUUID(),
          name: pt.name,
          createdAt: now,
          createdBy: adminEmployee.id,
          deleted: false,
        },
      })
    }
  }

  console.log('Project types seeded')

  // 15. Upsert default hour types
  const DEFAULT_HOUR_TYPES = [
    {name: 'Regular Hours', info: 'Standard working hours'},
    {name: 'Overtime 150%', info: 'Overtime paid at 150%'},
    {name: 'Overtime 200%', info: 'Overtime paid at 200%'},
    {name: 'Vacation', info: 'Paid vacation leave'},
    {name: 'Sick Leave', info: 'Employee sick leave'},
    {name: 'Training', info: 'Internal or external training hours'},
    {name: 'Public Holiday', info: 'Official public holiday'},
    {name: 'Unpaid Leave', info: 'Approved unpaid leave'},
  ]

  for (const ht of DEFAULT_HOUR_TYPES) {
    const existing = await prisma.hourType.findFirst({where: {name: ht.name}})
    if (!existing) {
      await prisma.hourType.create({
        data: {
          id: randomUUID(),
          name: ht.name,
          info: ht.info,
          createdAt: now,
          createdBy: adminEmployee.id,
          deleted: false,
        },
      })
    }
  }

  console.log('Default hour types seeded')

  // 16. Upsert MaterialGroups
  const MATERIAL_GROUPS = [
    {groupA: 'Mechanical', groupB: 'Fasteners', groupC: 'Bolts', groupD: 'Hex'},
    {groupA: 'Mechanical', groupB: 'Fasteners', groupC: 'Nuts', groupD: 'Hex'},
    {groupA: 'Electrical', groupB: 'Cables', groupC: 'Power', groupD: 'Copper'},
    {groupA: 'Electrical', groupB: 'Components', groupC: 'Switches', groupD: 'Industrial'},
    {groupA: 'Hydraulics', groupB: 'Fittings', groupC: 'Couplings', groupD: 'Quick'},
  ]

  const createdMaterialGroups: string[] = []

  for (const mg of MATERIAL_GROUPS) {
    let existing = await prisma.materialGroup.findFirst({
      where: {groupA: mg.groupA, groupB: mg.groupB, groupC: mg.groupC, groupD: mg.groupD},
    })
    if (!existing) {
      existing = await prisma.materialGroup.create({
        data: {
          id: randomUUID(),
          groupA: mg.groupA,
          groupB: mg.groupB,
          groupC: mg.groupC,
          groupD: mg.groupD,
          deleted: false,
        },
      })
    }
    createdMaterialGroups.push(existing.id)
  }

  console.log('MaterialGroups seeded')

  // 17. Upsert Units
  const UNITS = [
    {name: 'Piece', quantity: 1, abbreviation: 'pcs', shortDescription: 'Single piece'},
    {name: 'Meter', quantity: 1, abbreviation: 'm', shortDescription: 'Length in meters'},
    {name: 'Kilogram', quantity: 1, abbreviation: 'kg', shortDescription: 'Weight in kilograms'},
    {name: 'Box', quantity: 1, abbreviation: 'box', shortDescription: 'Box quantity'},
  ]

  const createdUnits: string[] = []

  for (const unit of UNITS) {
    let existing = await prisma.unit.findFirst({where: {abbreviation: unit.abbreviation}})
    if (!existing) {
      existing = await prisma.unit.create({
        data: {
          id: randomUUID(),
          unitName: unit.name,
          physicalQuantity: unit.quantity.toString(),
          abbreviation: unit.abbreviation,
          shortDescription: unit.shortDescription,
          longDescription: unit.shortDescription,
          valid: true,
          createdBy: adminEmployee.id,
          createdAt: now,
          deleted: false,
        },
      })
    }
    createdUnits.push(existing.id)
  }

  console.log('Units seeded')

  // 18. Upsert Materials
  const MATERIALS = [
    {
      beNumber: 'BE-MAT-0001',
      name: 'Hex Bolt M10',
      shortDescription: 'M10 hex bolt galvanized',
      longDescription: 'Standard galvanized hex bolt M10 x 30mm',
      brandName: 'Fabory',
      preferredSupplier: 'Fabory',
    },
    {
      beNumber: 'BE-MAT-0002',
      name: 'Hex Nut M10',
      shortDescription: 'M10 hex nut',
      longDescription: 'Standard steel hex nut M10',
      brandName: 'Fabory',
      preferredSupplier: 'Fabory',
    },
    {
      beNumber: 'BE-MAT-0003',
      name: 'Power Cable 3G2.5',
      shortDescription: 'Power cable 3G2.5mm²',
      longDescription: 'Flexible copper power cable',
      brandName: 'Nexans',
      preferredSupplier: 'Nexans',
    },
    {
      beNumber: 'BE-MAT-0004',
      name: 'Industrial Switch',
      shortDescription: '24V industrial switch',
      longDescription: 'Heavy duty industrial control switch',
      brandName: 'Siemens',
      preferredSupplier: 'Siemens',
    },
    {
      beNumber: 'BE-MAT-0005',
      name: 'Hydraulic Coupling',
      shortDescription: 'Quick hydraulic coupling',
      longDescription: 'High pressure quick connect coupling',
      brandName: 'Parker',
      preferredSupplier: 'Parker',
    },
  ]

  let brandOrderCounter = (await prisma.material.count()) + 1

  for (let i = 0; i < MATERIALS.length; i++) {
    const mat = MATERIALS[i]
    const existing = await prisma.material.findFirst({where: {beNumber: mat.beNumber}})
    if (!existing) {
      await prisma.material.create({
        data: {
          id: randomUUID(),
          beNumber: mat.beNumber,
          name: mat.name,
          brandOrderNr: brandOrderCounter++,
          shortDescription: mat.shortDescription,
          longDescription: mat.longDescription,
          preferredSupplier: mat.preferredSupplier,
          brandName: mat.brandName,
          documentationPlace: 'SharePoint',
          bePartDoc: null,
          rejected: false,
          materialGroupId: createdMaterialGroups[i % createdMaterialGroups.length],
          unitId: createdUnits[i % createdUnits.length],
          createdBy: adminEmployee.id,
          deleted: false,
        },
      })
    }
  }

  console.log('Materials seeded')

  console.log('Departments, Roles, SubRoles, RoleLevels, Targets, and VisibilityForRole seeded')
  console.log('Total roleLevels created: 57 (14 × 4 + 1 Administrator)')
}
