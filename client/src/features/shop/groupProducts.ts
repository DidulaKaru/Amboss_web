import type { Product, DisplayProduct, ProductVariant } from './types'

export function groupProducts(rawProducts: Product[]): DisplayProduct[] {
  const result: (DisplayProduct | null)[] = []
  const ledVariants: ProductVariant[] = []
  let ledBase: Product | null = null
  let ledInsertIndex = -1

  const jumperVariants: ProductVariant[] = []
  let jumperBase: Product | null = null
  let jumperInsertIndex = -1

  for (const p of rawProducts) {
    const sku = (p.sku || p.id || '').toUpperCase()
    const name = p.name.toLowerCase()

    // 1. Group LEDs
    if (sku.includes('LED-3MM') || name.startsWith('led 3mm')) {
      if (!ledBase) {
        ledBase = p
        ledInsertIndex = result.length
        result.push(null) // placeholder for grouped LED card
      }

      let label = 'Red'
      if (sku.includes('GREEN') || name.includes('green')) {
        label = 'Green'
      } else if (sku.includes('RED') || name.includes('red')) {
        label = 'Red'
      } else if (sku.includes('BLUE') || name.includes('blue')) {
        label = 'Blue'
      } else if (sku.includes('YELLOW') || name.includes('yellow')) {
        label = 'Yellow'
      } else if (sku.includes('WHITE') || name.includes('white')) {
        label = 'White'
      }

      ledVariants.push({
        id: p.id,
        sku: p.sku || p.id,
        name: p.name,
        label,
        price: p.price,
        stock: p.stock,
        description: p.description,
        image_url: p.image_url,
      })
      continue
    }

    // 2. Group Jumper Cables
    if (sku.includes('JUMPER-WIRES') || name.startsWith('jumper cables')) {
      if (!jumperBase) {
        jumperBase = p
        jumperInsertIndex = result.length
        result.push(null) // placeholder for grouped jumper card
      }

      let label = 'Male to Male (M-M)'
      if (sku.endsWith('-FF') || name.includes('female-female')) {
        label = 'Female to Female (F-F)'
      } else if (sku.endsWith('-MF') || name.includes('male-female')) {
        label = 'Male to Female (M-F)'
      } else if (sku.endsWith('-MM') || name.includes('male-male')) {
        label = 'Male to Male (M-M)'
      }

      jumperVariants.push({
        id: p.id,
        sku: p.sku || p.id,
        name: p.name,
        label,
        price: p.price,
        stock: p.stock,
        description: p.description,
        image_url: p.image_url,
      })
      continue
    }

    // Standard standalone product
    result.push({
      ...p,
      variants: undefined,
    })
  }

  // Populate grouped LED card
  if (ledInsertIndex >= 0 && ledBase && ledVariants.length > 0) {
    const firstVariant = ledVariants[0]
    result[ledInsertIndex] = {
      id: 'group-led-3mm',
      sku: 'PAS-LED-3MM',
      name: 'LED 3mm Diffused',
      category: ledBase.category || 'accessories',
      description: 'Standard 3mm diffused indicator LED (forward voltage 1.8V–2.4V).',
      price: firstVariant.price,
      stock: ledVariants.reduce((sum, v) => sum + v.stock, 0),
      image_url: ledBase.image_url || 'images/LED.png',
      isActive: true,
      variantLabel: 'Color',
      variants: ledVariants,
    }
  }

  // Populate grouped Jumper Cables card
  if (jumperInsertIndex >= 0 && jumperBase && jumperVariants.length > 0) {
    const firstVariant = jumperVariants[0]
    result[jumperInsertIndex] = {
      id: 'group-jumper-cables',
      sku: 'PRT-JUMPER-WIRES',
      name: 'Jumper Cables (40 pcs)',
      category: jumperBase.category || 'prototyping',
      description: 'Sets of 40 flexible 20cm multi-color DuPont prototyping jumper wires.',
      price: firstVariant.price,
      stock: jumperVariants.reduce((sum, v) => sum + v.stock, 0),
      image_url: jumperBase.image_url || 'images/Jumper-cables.png',
      isActive: true,
      variantLabel: 'Termination',
      variants: jumperVariants,
    }
  }

  // Filter out any remaining nulls
  return result.filter((item): item is DisplayProduct => item !== null)
}
