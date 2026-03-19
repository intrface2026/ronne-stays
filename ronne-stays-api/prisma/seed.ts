import { PrismaClient, PropertyType, PropertyCategory } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {

  // 1. Seed amenities
  const amenityNames = [
    'WiFi', 'AC', 'Swimming Pool', 'Kitchenette', 'Housekeeping',
    'Free Parking', 'Balcony', 'Garden', 'Washing Machine', 'TV',
    'Restaurant On-site', 'Private Pool', 'Kids Pool', 'Infinity Pool'
  ]

  const amenities: Record<string, string> = {}
  for (const name of amenityNames) {
    const a = await prisma.amenity.upsert({
      where: { name },
      update: {},
      create: { name },
    })
    amenities[name] = a.id
    console.log(`Amenity: ${name}`)
  }

  // 2. Amenity sets per property type
  const bhk1Amenities = ['WiFi', 'AC', 'TV', 'Kitchenette']
  const bhk2Amenities = ['WiFi', 'AC', 'TV', 'Kitchenette', 'Washing Machine', 'Balcony']
  const villaAmenities = ['WiFi', 'AC', 'TV', 'Private Pool', 'Garden', 'Free Parking', 'Housekeeping']

  // 3. Properties
  const properties = [
    { name: 'Budget Studio Apartment',     slug: 'budget-studio-apartment',      type: PropertyType.BHK_1, location: 'Blue Beach Resort, Arpora',  pricePerNight: 2000,  maxGuests: 2, bedrooms: 1, unitCount: 2 },
    { name: 'Studio Apartment with Kitchen', slug: 'studio-apartment-with-kitchen', type: PropertyType.BHK_1, location: 'Areia de Goa, Arpora',       pricePerNight: 2500,  maxGuests: 2, bedrooms: 1, unitCount: 2 },
    { name: 'Premium Studio Apartment',    slug: 'premium-studio-apartment',     type: PropertyType.BHK_1, location: 'Areia de Goa, Arpora',       pricePerNight: 2750,  maxGuests: 3, bedrooms: 1, unitCount: 1 },
    { name: 'Budget 2BHK',                 slug: 'budget-2bhk',                  type: PropertyType.BHK_2, location: 'Blue Beach Resort, Arpora',  pricePerNight: 3000,  maxGuests: 4, bedrooms: 2, unitCount: 3 },
    { name: 'Vacation Home 2BHK',          slug: 'vacation-home-2bhk',           type: PropertyType.BHK_2, location: 'Areia de Goa, Arpora',       pricePerNight: 4000,  maxGuests: 4, bedrooms: 2, unitCount: 8 },
    { name: 'Premium Pool View 2BHK',      slug: 'premium-pool-view-2bhk',       type: PropertyType.BHK_2, location: 'Areia de Goa, Arpora',       pricePerNight: 4500,  maxGuests: 4, bedrooms: 2, unitCount: 5 },
    { name: 'Twin Master Bedroom 2BHK',    slug: 'twin-master-bedroom-2bhk',     type: PropertyType.BHK_2, location: 'Areia de Goa, Arpora',       pricePerNight: 4500,  maxGuests: 4, bedrooms: 2, unitCount: 2 },
    { name: 'Candy Floss Blue Lagoon Villa', slug: 'candy-floss-blue-lagoon-villa', type: PropertyType.VILLA, location: 'Villa 6, Gurim Sangolda',   pricePerNight: 10000, maxGuests: 8, bedrooms: 4, unitCount: 1 },
    { name: 'Meadows Luxury Villa',        slug: 'meadows-luxury-villa',         type: PropertyType.VILLA, location: 'Villa 3, Nagoa-Bardez',      pricePerNight: 10000, maxGuests: 8, bedrooms: 4, unitCount: 1 },
    { name: 'Casa De Piscina Privada',     slug: 'casa-de-piscina-privada',      type: PropertyType.VILLA, location: 'Naika Vado, Verla',          pricePerNight: 10000, maxGuests: 8, bedrooms: 4, unitCount: 1 },
  ]

  for (const p of properties) {
    const amenitySet = p.type === PropertyType.VILLA ? villaAmenities
      : p.type === PropertyType.BHK_2 ? bhk2Amenities
      : bhk1Amenities

    const property = await prisma.property.upsert({
      where: { slug: p.slug },
      update: { ...p },
      create: { ...p, isActive: true, isFeatured: false },
    })

    // Clear existing amenity links then re-seed
    await prisma.propertyAmenity.deleteMany({
      where: { propertyId: property.id }
    })
    await prisma.propertyAmenity.createMany({
      data: amenitySet.map(name => ({
        propertyId: property.id,
        amenityId: amenities[name],
      }))
    })

    console.log(`Property: ${property.name}`)
  }

  console.log('Seed complete.')
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())