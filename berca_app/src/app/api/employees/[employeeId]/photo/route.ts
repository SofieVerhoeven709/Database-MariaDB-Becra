import {mkdir, writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import {NextResponse} from 'next/server'
import {prismaClient} from '@/dal/prismaClient'
import {getSessionProfileFromCookieOrThrow} from '@/lib/sessionUtils'
import type {Profile} from '@/models/employees'

const maxPhotoSize = 5 * 1024 * 1024
const allowedPhotoTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
])

function canManageEmployeePhoto(profile: Profile) {
  return profile.RoleLevelEmployee.some(({RoleLevel}) => {
    const roleName = RoleLevel.Role.name.toLowerCase()
    const level = RoleLevel.SubRole.level

    return (
      roleName === 'administrator' ||
      level >= 100 ||
      ((roleName.includes('hr') || roleName.includes('human resource')) && level >= 80)
    )
  })
}

export async function POST(request: Request, {params}: {params: Promise<{employeeId: string}>}) {
  const profile = await getSessionProfileFromCookieOrThrow()

  if (!canManageEmployeePhoto(profile)) {
    return NextResponse.json({error: 'Only HR or admin can update employee photos.'}, {status: 403})
  }

  const {employeeId} = await params
  const formData = await request.formData()
  const photo = formData.get('photo')

  if (!(photo instanceof File)) {
    return NextResponse.json({error: 'Please select a photo.'}, {status: 400})
  }

  const extension = allowedPhotoTypes.get(photo.type)

  if (!extension) {
    return NextResponse.json({error: 'Only JPG and PNG photos are allowed.'}, {status: 400})
  }

  if (photo.size > maxPhotoSize) {
    return NextResponse.json({error: 'The photo must be smaller than 5 MB.'}, {status: 400})
  }

  const employee = await prismaClient.employee.findUnique({where: {id: employeeId}, select: {id: true}})

  if (!employee) {
    return NextResponse.json({error: 'Employee not found.'}, {status: 404})
  }

  const uploadDir = join(process.cwd(), 'public', 'uploads', 'employee-photos')
  const fileName = `${employeeId}-${crypto.randomUUID()}.${extension}`
  const relativePath = `/uploads/employee-photos/${fileName}`

  await mkdir(uploadDir, {recursive: true})
  await writeFile(join(uploadDir, fileName), Buffer.from(await photo.arrayBuffer()))

  await prismaClient.employee.update({
    where: {id: employeeId},
    data: {photoFileId: relativePath},
  })

  return NextResponse.json({photoFileId: relativePath})
}

export async function DELETE(_request: Request, {params}: {params: Promise<{employeeId: string}>}) {
  const profile = await getSessionProfileFromCookieOrThrow()

  if (!canManageEmployeePhoto(profile)) {
    return NextResponse.json({error: 'Only HR or admin can remove employee photos.'}, {status: 403})
  }

  const {employeeId} = await params
  const employee = await prismaClient.employee.findUnique({where: {id: employeeId}, select: {id: true}})

  if (!employee) {
    return NextResponse.json({error: 'Employee not found.'}, {status: 404})
  }

  await prismaClient.employee.update({
    where: {id: employeeId},
    data: {photoFileId: null},
  })

  return NextResponse.json({photoFileId: null})
}
