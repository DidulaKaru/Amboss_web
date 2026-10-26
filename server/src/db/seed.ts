import { getDb, schema } from './index.js'
import { INITIAL_MATERIALS, INITIAL_MACHINES, INITIAL_PRODUCTS, INITIAL_PORTFOLIO_ITEMS } from './seedData.js'

export async function seedDatabase() {
  const db = getDb()
  if (!db) {
    console.warn('Database connection unavailable, skipping seed.')
    return { materials: 0, machines: 0, products: 0, portfolio: 0 }
  }

  console.log('Seeding Amboss database...')

  // Seed Materials
  let seededMaterials = 0
  for (const mat of INITIAL_MATERIALS) {
    try {
      await db
        .insert(schema.materials)
        .values(mat)
        .onConflictDoNothing({ target: schema.materials.slug })
      seededMaterials++
    } catch (e) {
      console.warn(`Could not seed material ${mat.slug}:`, e)
    }
  }

  // Seed Machines
  let seededMachines = 0
  for (const mac of INITIAL_MACHINES) {
    try {
      await db
        .insert(schema.machines)
        .values(mac)
        .onConflictDoNothing({ target: schema.machines.slug })
      seededMachines++
    } catch (e) {
      console.warn(`Could not seed machine ${mac.slug}:`, e)
    }
  }

  // Seed Products
  let seededProducts = 0
  for (const prod of INITIAL_PRODUCTS) {
    try {
      await db
        .insert(schema.products)
        .values(prod)
        .onConflictDoNothing({ target: schema.products.sku })
      seededProducts++
    } catch (e) {
      console.warn(`Could not seed product ${prod.sku}:`, e)
    }
  }

  // Seed Portfolio Items
  let seededPortfolio = 0
  for (const item of INITIAL_PORTFOLIO_ITEMS) {
    try {
      await db
        .insert(schema.portfolioItems)
        .values(item)
        .onConflictDoNothing({ target: schema.portfolioItems.id })
      seededPortfolio++
    } catch (e) {
      console.warn(`Could not seed portfolio item ${item.title}:`, e)
    }
  }

  console.log(
    `Database seed completed: ${seededMaterials} materials, ${seededMachines} machines, ${seededProducts} products, ${seededPortfolio} portfolio items.`
  )
  return {
    materials: seededMaterials,
    machines: seededMachines,
    products: seededProducts,
    portfolio: seededPortfolio,
  }
}

// Execute directly if run via CLI
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed execution error:', err)
      process.exit(1)
    })
}
