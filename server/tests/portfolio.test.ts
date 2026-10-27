import { describe, it, expect } from 'vitest'
import { buildApp } from '../src/app.js'

describe('Portfolio API', () => {
  it('GET /api/v1/portfolio returns active portfolio items ordered by displayOrder', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/portfolio',
    })

    expect(response.statusCode).toBe(200)
    const json = response.json()
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data.length).toBeGreaterThanOrEqual(4)

    const titles = json.data.map((p: any) => p.title)
    expect(titles).toContain('Nightingale Vein Monitor')
    expect(titles).toContain('Falcon 9 Pen')
    expect(titles).toContain('Rextro Souvenirs')
    expect(titles).toContain('Body-Powered Mechanical Arm')

    // Check displayOrder ordering
    for (let i = 0; i < json.data.length - 1; i++) {
      expect((json.data[i].displayOrder ?? 0) <= (json.data[i + 1].displayOrder ?? 0)).toBe(true)
    }

    await app.close()
  })

  it('GET /api/v1/portfolio?category=prosthetics filters items', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/portfolio?category=prosthetics',
    })

    expect(response.statusCode).toBe(200)
    const json = response.json()
    expect(json.success).toBe(true)
    expect(json.data.every((p: any) => p.category === 'prosthetics')).toBe(true)
    await app.close()
  })

  it('rejects unauthenticated mutations with 401 Unauthorized', async () => {
    const app = await buildApp()

    // Unauthenticated POST
    const resPost = await app.inject({
      method: 'POST',
      url: '/api/v1/portfolio',
      payload: {
        title: 'Unauthorized Test Item',
        category: 'fdm_printing',
        imageUrl: 'images/test.jpg',
      },
    })
    expect(resPost.statusCode).toBe(401)

    // Unauthenticated PUT
    const resPut = await app.inject({
      method: 'PUT',
      url: '/api/v1/portfolio/b2222222-2222-4222-8222-222222222222',
      payload: {
        title: 'Hacked Title',
      },
    })
    expect(resPut.statusCode).toBe(401)

    // Unauthenticated DELETE
    const resDelete = await app.inject({
      method: 'DELETE',
      url: '/api/v1/portfolio/b2222222-2222-4222-8222-222222222222',
    })
    expect(resDelete.statusCode).toBe(401)

    await app.close()
  })

  it('authenticates admin and successfully executes portfolio CRUD operations', async () => {
    const app = await buildApp()

    // Login as admin
    const resLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/login',
      payload: {
        username: 'Dory',
        password: 'poplintu7577',
      },
    })
    expect(resLogin.statusCode).toBe(200)
    const { token } = resLogin.json()

    const authHeaders = {
      Authorization: `Bearer ${token}`,
    }

    // 1. Create new item
    const resCreate = await app.inject({
      method: 'POST',
      url: '/api/v1/portfolio',
      headers: authHeaders,
      payload: {
        title: 'Robotic Gripper Actuator',
        material: 'PA12-CF',
        imageUrl: 'images/k2plus.jpg',
        description: 'Compact 2-finger adaptive gripper for industrial pick-and-place automation.',
        isActive: true,
      },
    })

    expect(resCreate.statusCode).toBe(201)
    const createdItem = resCreate.json().data
    expect(createdItem.id).toBeDefined()
    expect(createdItem.title).toBe('Robotic Gripper Actuator')
    const createdId = createdItem.id

    // 2. Update item
    const resUpdate = await app.inject({
      method: 'PUT',
      url: `/api/v1/portfolio/${createdId}`,
      headers: authHeaders,
      payload: {
        title: 'Updated Robotic Gripper Actuator v2',
        material: 'Carbon Fiber Nylon',
      },
    })

    expect(resUpdate.statusCode).toBe(200)
    expect(resUpdate.json().data.title).toBe('Updated Robotic Gripper Actuator v2')
    expect(resUpdate.json().data.material).toBe('Carbon Fiber Nylon')

    // 3. Delete item (with Content-Type to verify Fastify empty body handling)
    const resDelete = await app.inject({
      method: 'DELETE',
      url: `/api/v1/portfolio/${createdId}`,
      headers: {
        ...authHeaders,
        'content-type': 'application/json',
      },
    })

    expect(resDelete.statusCode).toBe(200)
    expect(resDelete.json().success).toBe(true)

    await app.close()
  })
})
