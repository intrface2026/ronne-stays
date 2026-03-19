import { notFound } from 'next/navigation';
import { MapPin, Star, Shield, Wifi, Car, Tv, Utensils, Waves } from 'lucide-react';
import BookingCard from '@/components/BookingCard';
import { RonneApi } from '@/lib/ronneApi';

interface PropertyPageProps {
  params: Promise<{ slug: string }>;
}

const amenityIcon = (name: string) => {
  switch (name.toLowerCase()) {
    case 'wifi':
      return Wifi;
    case 'parking':
      return Car;
    case 'tv':
      return Tv;
    case 'kitchen':
      return Utensils;
    case 'pool':
      return Waves;
    default:
      return null;
  }
};

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { slug } = await params;

  let property: Awaited<ReturnType<typeof RonneApi.getPropertyBySlug>>;
  try {
    property = await RonneApi.getPropertyBySlug(slug);
  } catch {
    return notFound();
  }

  const images =
    (property.images || [])
      .slice()
      .sort((a, b) => (a.isPrimary === b.isPrimary ? a.sortOrder - b.sortOrder : a.isPrimary ? -1 : 1)) || [];
  const primaryImage =
    images[0]?.url ||
    property.primaryImageUrl ||
    'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop';

  const amenityNames = (property.amenities || []).map((a) => a.name);
  const hasAmenity = (name: string) => amenityNames.some((a) => a.toLowerCase() === name.toLowerCase());

  return (
    <main className="pt-24 pb-16 bg-stone-50 min-h-screen">
      <section className="container mx-auto px-4 md:px-8">
        {/* Title & Meta */}
        <div className="mb-6 md:mb-8">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-500 mb-2">
            Entire {property.type === 'VILLA' ? 'villa' : 'apartment'} in {property.location}, Goa
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif text-gray-900 mb-3">{property.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">5.0</span>
              <span className="text-gray-400">· Top rated</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <div className="flex items-center gap-1 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{property.location}, Goa</span>
            </div>
          </div>
        </div>

        {/* Gallery + Booking Card */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)] gap-6 lg:gap-8 mb-12">
          {/* Image collage */}
          <div className="relative grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-3 md:gap-4 h-[320px] md:h-[420px] rounded-3xl overflow-hidden">
            <div className="md:col-span-2 md:row-span-2 relative">
              <img src={primaryImage} alt={property.name} className="w-full h-full object-cover" />
            </div>
            {[images[1]?.url, images[2]?.url, images[3]?.url].map((url, idx) => (
              <div key={idx} className="relative hidden md:block">
                <img src={url || primaryImage} alt={property.name} className="w-full h-full object-cover" />
              </div>
            ))}
            <button
              type="button"
              className="absolute bottom-4 right-4 inline-flex items-center justify-center px-4 py-2 rounded-full bg-white/90 text-sm font-medium shadow-lg hover:bg-white"
            >
              Show all photos
            </button>
          </div>

          <BookingCard
            propertyId={property.id}
            propertyName={property.name}
            pricePerNight={property.pricePerNight}
            maxGuests={property.maxGuests}
          />
        </div>

        {/* About & amenities */}
        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1.2fr)] gap-10 lg:gap-16 mb-16">
          <div>
            <h2 className="text-xl font-semibold mb-3">About this place</h2>
            <p className="text-sm leading-relaxed text-gray-700 mb-4">
              {property.description ||
                `Nestled in the heart of ${property.location}, this stay is designed for slow mornings and late-night conversations. Thoughtful details keep your time in Goa effortless and comfortable.`}
            </p>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-3">Where you&apos;ll sleep</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold tracking-[0.18em] uppercase text-gray-400 mb-1">Bedrooms</p>
                  <p className="text-sm text-gray-900">{property.bedrooms} bedroom{property.bedrooms === 1 ? '' : 's'}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold tracking-[0.18em] uppercase text-gray-400 mb-1">Guests</p>
                  <p className="text-sm text-gray-900">Up to {property.maxGuests}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">What this place offers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {(property.amenities || [])
                .slice(0, 8)
                .map((a) => {
                  const Icon = amenityIcon(a.name);
                  return (
                    <div key={a.name} className="flex items-center gap-3">
                      {Icon ? <Icon className="w-4 h-4 text-gray-700" /> : <span className="w-4 h-4" />}
                      <span>{a.name}</span>
                    </div>
                  );
                })}
            </div>

            {property.amenities && property.amenities.length > 8 ? (
              <button type="button" className="mt-4 text-sm font-semibold underline underline-offset-4">
                Show all amenities
              </button>
            ) : null}

            <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-4 flex items-start gap-3 text-xs text-gray-700">
              <Shield className="w-5 h-5 text-gray-800 mt-0.5" />
              <p>To help protect your payment, always book and pay through Ronne Stays&apos; official channels.</p>
            </div>
          </div>
        </section>

        {/* Highlights */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-gray-700">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="font-semibold mb-1">House rules</p>
            <p>Check-in after 2:00 pm</p>
            <p>Checkout before 11:00 am</p>
            <p>{property.maxGuests} guests maximum</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="font-semibold mb-1">Popular amenities</p>
            <p>{hasAmenity('Wifi') ? 'Wi‑Fi' : 'Wi‑Fi (ask)'} · {hasAmenity('Kitchen') ? 'Kitchen' : 'Kitchen (ask)'}</p>
            <p>{hasAmenity('Pool') ? 'Pool' : 'Pool (ask)'} · {hasAmenity('Parking') ? 'Parking' : 'Parking (ask)'}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="font-semibold mb-1">Cancellation policy</p>
            <p>Free cancellation up to 7 days before check‑in.</p>
          </div>
        </section>
      </section>
    </main>
  );
}

