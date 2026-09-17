type ListGateway<T> = {
  items?: T[]
  Items?: T[]
  totalCount?: number
}

type ListResponse<T> = {
  data?: Record<string, ListGateway<T> | undefined> & {
    items?: T[]
    Items?: T[]
  }
  items?: T[]
  Items?: T[]
}

const gatewayItems = <T>(gateway: ListGateway<T> | undefined): T[] | undefined =>
  gateway?.items ?? gateway?.Items

/** Blocks GraphQL list responses may nest under `data` or expose the field at the top level. */
export const parseCollectionList = <T>(response: unknown, fieldName: string): T[] => {
  if (!response || typeof response !== 'object') return []

  const record = response as ListResponse<T> & Record<string, ListGateway<T> | undefined>
  const gateway = record.data?.[fieldName] ?? record[fieldName]
  const nestedItems = gatewayItems(gateway)
  if (nestedItems?.length) return nestedItems

  const dataItems = record.data?.items ?? record.data?.Items
  if (dataItems?.length) return dataItems

  const topItems = record.items ?? record.Items
  if (topItems?.length) return topItems

  return []
}

export const extractMutationItemId = (response: unknown): string | undefined => {
  if (!response || typeof response !== 'object') return undefined
  const record = response as Record<string, unknown>
  const data = record.data
  if (data && typeof data === 'object') {
    const nested = data as Record<string, unknown>
    const itemId = nested.itemId ?? nested.ItemId
    if (typeof itemId === 'string' && itemId) return itemId
  }
  const top = record.itemId ?? record.ItemId
  return typeof top === 'string' && top ? top : undefined
}

export const recordUserId = (record: { userId?: string; UserId?: string } | undefined): string | undefined =>
  record?.userId ?? record?.UserId
