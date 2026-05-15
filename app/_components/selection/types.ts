export interface HotelConfig {
  name: string
  tagline: string
  location: {
    village: string
    region: string
    address: string
    phone: string
    email: string
    coordinates?: { lat: number; lng: number }
  }
  heroImage: string
  badges: Array<{ label: string }>
  stats: Array<{ icon: string; label: string; value: string }>
  story: {
    eyebrow: string
    title: string
    paragraphs: string[]
    pullQuote: string
    image: string
  }
  awards: Array<{
    icon: string
    name: string
    year: string
    description: string
  }>
  rooms: Array<{
    name: string
    size: string
    priceFrom: string
    amenities: string[]
    image: string
  }>
  gastronomy: {
    eyebrow: string
    restaurantName: string
    description: string
    chefName: string
    chefTitle: string
    chefImage: string
    dishes: string[]
    michelinStar: boolean
    image: string
  }
  spa: {
    title: string
    description: string
    treatments: Array<{ icon: string; name: string; description: string }>
    image: string
  }
  gallery: Array<{
    src: string
    alt: string
    aspectClass: string
  }>
  press: Array<{
    outlet: string
    quote: string
    date: string
  }>
  surroundings: Array<{
    name: string
    distance: string
    description: string
    image: string
  }>
  experiences: Array<{
    title: string
    duration: string
    exclusive: boolean
    image: string
    description: string
  }>
  offers: Array<{
    title: string
    description: string
    discount: string
    validity: string
    conditions: string
    priceFrom: string
  }>
  reviews: {
    overall: number
    count: number
    items: Array<{
      quote: string
      author: string
      origin: string
      date: string
    }>
  }
  practicalInfo: Array<{
    icon: string
    label: string
    value: string
  }>
  social: {
    instagram?: string
    facebook?: string
    twitter?: string
  }
}
