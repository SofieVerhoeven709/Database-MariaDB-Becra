import {prismaClient} from '@/dal/prismaClient'
import {protectedApiRoute} from '@/lib/apiRoute'
import {NextResponse} from 'next/server'

type EntityResolver = (id: string) => Promise<string | null>

const entityResolvers: Record<string, EntityResolver> = {
      serialTracked: async id => {
        const item = await prismaClient.materialSerialTrack.findUnique({
          where: { id },
          select: {
            shortDescription: true,
            Material: { select: { beNumber: true } }
          },
        });
        return item?.Material?.beNumber || item?.shortDescription || null;
      },
  departments: async id => {
    const item = await prismaClient.department.findUnique({where: {id}, select: {name: true}})
    return item?.name ?? null
  },
  department: async id => {
    const item = await prismaClient.department.findUnique({where: {id}, select: {name: true}})
    return item?.name ?? null
  },
  project: async id => {
    const item = await prismaClient.project.findUnique({where: {id}, select: {projectName: true}})
    return item?.projectName ?? null
  },
  workOrder: async id => {
    const item = await prismaClient.workOrder.findUnique({where: {id}, select: {workOrderNumber: true}})
    return item?.workOrderNumber ?? null
  },
  workOrderSales: async id => {
    const item = await prismaClient.workOrder.findUnique({where: {id}, select: {workOrderNumber: true}})
    return item?.workOrderNumber ?? null
  },
  material: async id => {
    const item = await prismaClient.material.findUnique({where: {id}, select: {name: true, beNumber: true}})
    return item ? (item.name ?? item.beNumber) : null
  },
  company: async id => {
    const item = await prismaClient.company.findUnique({where: {id}, select: {name: true}})
    return item?.name ?? null
  },
  contact: async id => {
    const item = await prismaClient.contact.findUnique({where: {id}, select: {firstName: true, lastName: true}})
    return item ? `${item.firstName} ${item.lastName}` : null
  },
  followUp: async id => {
    const item = await prismaClient.followUp.findUnique({where: {id}, select: {activityDescription: true}})
    const desc = item?.activityDescription
    if (!desc) return null
    return desc.length > 50 ? desc.slice(0, 50) + '…' : desc
  },
  followUpStructure: async id => {
    const item = await prismaClient.followUpStructure.findUnique({
      where: {id},
      select: {item: true, activityDescription: true},
    })
    if (!item) return null
    return item.item ?? (item.activityDescription ? item.activityDescription.slice(0, 50) : null)
  },
}

export const GET = protectedApiRoute({
  authenticationType: 'cookie',
  routeFn: async ({request}) => {
    const url = new URL(request.url)
    const entityType = url.searchParams.get('type')
    const id = url.searchParams.get('id')

    if (!entityType || !id) {
      return NextResponse.json({name: null}, {status: 400})
    }

    const resolver = entityResolvers[entityType]
    if (!resolver) {
      return NextResponse.json({name: null})
    }

    try {
      const name = await resolver(id)
      return NextResponse.json({name})
    } catch {
      return NextResponse.json({name: null})
    }
  },
})

