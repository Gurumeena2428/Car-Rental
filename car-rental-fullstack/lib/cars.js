export function serializeCar(car) {
  return {
    id: car.id,
    name: car.name,
    brand: car.brand,
    type: car.type,
    image: car.image,
    pricePerDay: car.pricePerDay,
    rating: car.rating,
    reviews: car.reviews,
    seats: car.seats,
    transmission: car.transmission,
    fuel: car.fuel,
    active: car.active,
    locations: (car.locations ?? []).map((item) => item.city),
    createdAt: car.createdAt,
    updatedAt: car.updatedAt,
  };
}

export function cleanLocations(value) {
  const raw = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  return [...new Set(raw.map((item) => String(item).trim()).filter(Boolean))];
}

export function parsePositiveInteger(value, fallback = null) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

export function parseNonNegativeInteger(value, fallback = null) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
}
