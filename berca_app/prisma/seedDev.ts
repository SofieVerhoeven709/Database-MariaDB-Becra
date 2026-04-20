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

const PROJECT_TYPES = [{name: 'Engineering'}, {name: 'Training'}, {name: 'Consulting'}]

const ALL_TARGET_TYPES = [
  'Department',
  'Company',
  'Project',
  'WorkOrder',
  'WorkOrderStructure',
  'Contact',
  'Certificate',
  'DocumentStructure',
  'FollowUp',
  'FollowUpStructure',
  'InvoiceIn',
  'InvoiceOut',
  'Training',
  'TrainingStandard',
  'Employee',
  'DepartmentExtern',
  'PriceList',
  'HourType',
  'Material',
  'ProjectBom',
  'PurchaseBom',
]

const URGENCY_TYPES = ['Low', 'Medium', 'High', 'Critical']

const STATUSES = ['Open', 'In Progress', 'Pending', 'On Hold', 'Resolved', 'Closed', 'Cancelled']

const FOLLOW_UP_TYPES = [
  'Sales',
  'Support',
  'Non-Conformance',
  'Periodic Control',
  'Review',
  'General',
  'Task',
  'Complaint',
]

// ─── Invoice lookup data ───────────────────────────────────────────────────────

const VAT_MARGINS = [0, 6, 12, 21]

const INVOICE_STATUSES = ['Draft', 'Sent', 'Received', 'Overdue', 'Paid', 'Cancelled', 'Disputed']

const INVOICE_SENT_TYPES = ['Email', 'Post', 'Hand Delivery', 'Portal', 'Fax']

const PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'Credit Card', 'Debit Card', 'Direct Debit', 'Cheque']

const INVOICE_TYPES = ['Standard', 'Credit Note', 'Proforma', 'Recurring', 'Intercompany']
const DEFAULT_PAYMENT_CONDITIONS = [
  '14 days',
  '30 days invoice date',
  '30 days end of month',
  '60 days invoice date',
  '60 days end of month',
]
export const seedDev = async (prisma: PrismaClient) => {
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
      data: {id: randomUUID(), name: 'Administrator', createdAt: now, createdBy: adminEmployee.id},
    })
  }

  // 3. Upsert Administrator subRole
  let adminSubRole = await prisma.subRole.findFirst({where: {name: 'Administrator'}})
  if (!adminSubRole) {
    adminSubRole = await prisma.subRole.create({
      data: {id: randomUUID(), name: 'Administrator', level: 100, createdAt: now, createdBy: adminEmployee.id},
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

  // 5. Attach admin roleLevel via junction table
  const existingRoleLevelEmployee = await prisma.roleLevelEmployee.findFirst({
    where: {employeeId: adminEmployee.id},
  })
  if (!existingRoleLevelEmployee) {
    await prisma.roleLevelEmployee.create({
      data: {id: randomUUID(), employeeId: adminEmployee.id, roleLevelId: adminRoleLevel.id},
    })
  }

  console.log('Administrator account ready')

  // 6. Upsert shared subRoles
  for (const sub of SUB_ROLES) {
    let existing = await prisma.subRole.findFirst({where: {name: sub.name}})
    if (!existing) {
      existing = await prisma.subRole.create({
        data: {id: randomUUID(), name: sub.name, level: sub.level, createdAt: now, createdBy: adminEmployee.id},
      })
    }
    createdSubRoles[sub.name] = {id: existing.id, level: existing.level}
  }

  // 7. Upsert ALL TargetTypes
  async function upsertTargetType(name: string) {
    let tt = await prisma.targetType.findFirst({where: {name}})
    if (!tt) {
      tt = await prisma.targetType.create({
        data: {id: randomUUID(), name, createdAt: now, createdBy: adminEmployee!.id},
      })
    }
    return tt
  }

  for (const targetTypeName of ALL_TARGET_TYPES) {
    await upsertTargetType(targetTypeName)
  }

  console.log('Target types seeded')

  const departmentTargetType = await prisma.targetType.findFirst({where: {name: 'Department'}})
  const companyTargetType = await prisma.targetType.findFirst({where: {name: 'Company'}})
  const hourTypeTargetType = await prisma.targetType.findFirst({where: {name: 'HourType'}})
  const contactTargetType = await prisma.targetType.findFirst({where: {name: 'Contact'}})

  // 8. Upsert UrgencyTypes
  for (const name of URGENCY_TYPES) {
    const existing = await prisma.urgencyType.findFirst({where: {name}})
    if (!existing) {
      await prisma.urgencyType.create({
        data: {id: randomUUID(), name, createdAt: now, createdBy: adminEmployee.id, deleted: false},
      })
    }
  }

  console.log('Urgency types seeded')

  // 9. Upsert Statuses
  for (const name of STATUSES) {
    const existing = await prisma.status.findFirst({where: {name}})
    if (!existing) {
      await prisma.status.create({
        data: {id: randomUUID(), name, createdAt: now, createdBy: adminEmployee.id, deleted: false},
      })
    }
  }

  console.log('Statuses seeded')

  // 10. Upsert FollowUpTypes
  for (const name of FOLLOW_UP_TYPES) {
    const existing = await prisma.followUpType.findFirst({where: {name}})
    if (!existing) {
      await prisma.followUpType.create({
        data: {id: randomUUID(), name, createdAt: now, createdBy: adminEmployee.id, deleted: false},
      })
    }
  }

  console.log('Follow-up types seeded')

  // 11. Upsert Departments + Department Roles + RoleLevels + Targets
  for (const dept of ALL_DEPARTMENTS) {
    const existingDept = await prisma.department.findFirst({where: {name: dept.name}})
    if (existingDept) continue

    const deptTarget = await prisma.target.create({
      data: {id: randomUUID(), createdAt: now, createdBy: adminEmployee.id, targetTypeId: departmentTargetType!.id},
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
      data: {id: randomUUID(), name: `${dept.name} Role`, createdAt: now, createdBy: adminEmployee.id},
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
        data: {id: randomUUID(), visible: true, roleLevelId: adminRoleLevel.id, targetId: deptTarget.id},
      })
    }
  }

  console.log('Departments, Roles, SubRoles, RoleLevels, Targets, and VisibilityForRole seeded')

  // 12. Upsert default Titles
  const DEFAULT_TITLES = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'Ir.']

  for (const titleName of DEFAULT_TITLES) {
    const existing = await prisma.title.findFirst({where: {name: titleName}})
    if (!existing) {
      await prisma.title.create({
        data: {id: randomUUID(), name: titleName, createdAt: now, createdBy: adminEmployee.id, deleted: false},
      })
    }
  }

  console.log('Default titles seeded')

  // 13. Upsert Becra company
  let becraCompany = await prisma.company.findFirst({where: {name: 'Becra BV'}})
  if (!becraCompany) {
    const becraTarget = await prisma.target.create({
      data: {id: randomUUID(), createdAt: now, createdBy: adminEmployee.id, targetTypeId: companyTargetType!.id},
    })

    becraCompany = await prisma.company.create({
      data: {
        id: randomUUID(),
        name: 'Becra BV',
        officialName: 'Becra BV',
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

    await prisma.companyAddress.create({
      data: {
        id: randomUUID(),
        street: 'Nijverheidsstraat',
        houseNumber: '14',
        zipCode: '2400',
        place: 'Mol',
        typeAddress: 'headquarters',
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
        data: {id: randomUUID(), name: pt.name, createdAt: now, createdBy: adminEmployee.id, deleted: false},
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
    {name: 'SEN (Senior Engineer)', info: 'Senior engineering role'},
    {name: 'SSEN (Senior Software Engineer)', info: 'Senior software engineering role'},
    {name: 'TEN (Technical Engineer)', info: 'Technical engineering role'},
  ]

  for (const ht of DEFAULT_HOUR_TYPES) {
    const existing = await prisma.hourType.findFirst({where: {name: ht.name}})
    if (existing) continue

    // Create target first (same pattern as Department)
    const hourTypeTarget = await prisma.target.create({
      data: {
        id: randomUUID(),
        createdAt: now,
        createdBy: adminEmployee.id,
        targetTypeId: hourTypeTargetType!.id,
      },
    })

    // Create hourType with targetId
    await prisma.hourType.create({
      data: {
        id: randomUUID(),
        name: ht.name,
        info: ht.info,
        createdAt: now,
        createdBy: adminEmployee.id,
        deleted: false,
        targetId: hourTypeTarget.id,
      },
    })
  }

  console.log('Default hour types seeded')

  // 16. Upsert CertificateTypes
  const CERTIFICATE_TYPES = ['BA4', 'BA5', 'BA5 + HS', 'BA5 leidinggevende', 'HS', 'AREI', 'EHBO', 'ATEX']

  for (const name of CERTIFICATE_TYPES) {
    const existing = await prisma.certificateType.findFirst({where: {name}})
    if (!existing) {
      await prisma.certificateType.create({
        data: {id: randomUUID(), name, createdAt: now, createdBy: adminEmployee.id, deleted: false},
      })
    }
  }

  console.log('Certificate types seeded')

  // 17. Upsert VatMargins
  for (const vat of VAT_MARGINS) {
    const existing = await prisma.vatMargin.findFirst({where: {vat}})
    if (!existing) {
      await prisma.vatMargin.create({
        data: {id: randomUUID(), vat, createdAt: now, createdBy: adminEmployee.id, deleted: false},
      })
    }
  }

  console.log('VAT margins seeded')

  // 18. Upsert InvoiceStatuses
  for (const name of INVOICE_STATUSES) {
    const existing = await prisma.invoiceStatus.findFirst({where: {name}})
    if (!existing) {
      await prisma.invoiceStatus.create({
        data: {id: randomUUID(), name, createdAt: now, createdBy: adminEmployee.id, deleted: false},
      })
    }
  }

  console.log('Invoice statuses seeded')

  // 19. Upsert InvoiceSentTypes
  for (const name of INVOICE_SENT_TYPES) {
    const existing = await prisma.invoiceSentType.findFirst({where: {name}})
    if (!existing) {
      await prisma.invoiceSentType.create({
        data: {id: randomUUID(), name, createdAt: now, createdBy: adminEmployee.id, deleted: false},
      })
    }
  }

  console.log('Invoice sent types seeded')

  // 20. Upsert PaymentMethods
  for (const name of PAYMENT_METHODS) {
    const existing = await prisma.paymentMethod.findFirst({where: {name}})
    if (!existing) {
      await prisma.paymentMethod.create({
        data: {id: randomUUID(), name, createdAt: now, createdBy: adminEmployee.id, deleted: false},
      })
    }
  }

  console.log('Payment methods seeded')

  // 21. Upsert InvoiceTypes
  for (const name of INVOICE_TYPES) {
    const existing = await prisma.invoiceType.findFirst({where: {name}})
    if (!existing) {
      await prisma.invoiceType.create({
        data: {id: randomUUID(), name, createdAt: now, createdBy: adminEmployee.id, deleted: false},
      })
    }
  }

  console.log('Invoice types seeded')

  // 22. Upsert default payment conditions
  for (const name of DEFAULT_PAYMENT_CONDITIONS) {
    const existing = await prisma.paymentCondition.findFirst({where: {name}})
    if (!existing) {
      await prisma.paymentCondition.create({
        data: {id: randomUUID(), name, createdAt: now, createdBy: adminEmployee.id, deleted: false},
      })
      continue
    }

    if (existing.deleted) {
      await prisma.paymentCondition.update({
        where: {id: existing.id},
        data: {deleted: false, deletedAt: null, deletedBy: null},
      })
    }
  }

  console.log('Default payment conditions seeded')

  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
    },
  })

  for (const company of companies) {
    // 🔍 Check if invoice contact already exists
    const existingInvoiceContact = await prisma.companyContact.findFirst({
      where: {
        companyId: company.id,
        roleWithCompany: 'Invoice',
      },
    })

    if (existingInvoiceContact) continue

    // 🆕 Create target for contact
    const contactTarget = await prisma.target.create({
      data: {
        id: randomUUID(),
        createdAt: now,
        createdBy: adminEmployee.id,
        targetTypeId: contactTargetType!.id,
      },
    })

    const contactId = randomUUID()

    // 🆕 Create contact
    await prisma.contact.create({
      data: {
        id: contactId,
        firstName: company.name,
        lastName: 'Invoice',
        active: true,
        infoCorrect: false,
        checkInfo: false,
        newYearCard: false,
        newsLetter: false,
        mailing: false,
        trainingAdvice: false,
        contactForTrainingAndAdvice: false,
        customerTrainingAndAdvice: false,
        potentialCustomerTrainingAndAdvice: false,
        potentialTeacherTrainingAndAdvice: false,
        teacherTrainingAndAdvice: false,
        participantTrainingAndAdvice: false,
        createdBy: adminEmployee.id,
        createdAt: now,
        targetId: contactTarget.id,
      },
    })

    // 🏢 Get company addresses (for optional linking)
    const addresses = await prisma.companyAddress.findMany({
      where: {companyId: company.id},
      select: {id: true},
    })

    // 🔗 Link contact to company
    await prisma.companyContact.create({
      data: {
        id: randomUUID(),
        contactId,
        companyId: company.id,
        roleWithCompany: 'Invoice',
        companyAddressId: addresses.length === 1 ? addresses[0].id : null,
        startedDate: now,
        createdBy: adminEmployee.id,
        createdAt: now,
      },
    })

    // 👁 Optional: visibility (recommended)
    await prisma.visibilityForRole.create({
      data: {
        id: randomUUID(),
        visible: true,
        roleLevelId: adminRoleLevel.id,
        targetId: contactTarget.id,
      },
    })
  }

  console.log('Company invoice contact backfill complete')

  // 23. Backfill MaterialDemand for every existing Material row
  const materials = await prisma.material.findMany({select: {id: true, shortDescription: true}})
  for (const material of materials) {
    await prisma.materialDemand.upsert({
      where: {materialId: material.id},
      update: {},
      create: {
        id: randomUUID(),
        materialId: material.id,
        totalRequiredQty: 0,
        reservedQty: 0,
        createdAt: now,
      },
    })
  }

  console.log(`Material demand backfill complete for ${materials.length} material(s)`)

  console.log('Seed complete')
}
