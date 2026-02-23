describe('nearbyContainers endpoint (unit)', () => {
  afterEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  it('returns 400 for missing coordinates', async () => {
    const { nearbyContainers } = await import('../nearbyContainers')

    const mockReq: any = {
      query: {},
      payload: { logger: { error: jest.fn() } },
    }

    const res: any = await nearbyContainers.handler(mockReq)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toHaveProperty('error')
  })

  it('queries using Payload API and returns containers on success', async () => {
    const { nearbyContainers } = await import('../nearbyContainers')

    const mockContainer = {
      id: 1,
      publicNumber: 'P-1',
      location: [23.0, 42.0], // [longitude, latitude]
      address: 'Test St',
      capacityVolume: 100,
      capacitySize: 'L',
      serviceInterval: '7',
      servicedBy: 'City',
      wasteType: 'mixed',
      status: 'active',
      state: [],
      notes: 'Note',
      lastCleaned: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const mockPayload: any = {
      find: jest.fn(async () => ({
        docs: [mockContainer],
        totalDocs: 1,
        limit: 10,
        page: 1,
        totalPages: 1,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null,
      })),
      logger: { error: jest.fn() },
    }

    const mockReq: any = {
      query: { latitude: '42.0', longitude: '23.0', radius: '500', limit: '10' },
      payload: mockPayload,
    }

    const res: any = await nearbyContainers.handler(mockReq)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('docs')
    expect(Array.isArray(body.docs)).toBe(true)
    expect(body.totalDocs).toBe(1)
    expect(body.docs[0]).toMatchObject({ id: 1, publicNumber: 'P-1', wasteType: 'mixed' })
    expect(mockPayload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'waste-containers',
        limit: 10,
        page: 1,
      })
    )
  })
})
