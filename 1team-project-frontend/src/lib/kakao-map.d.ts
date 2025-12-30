// Kakao Map TypeScript definitions
declare global {
  interface Window {
    kakao: any
  }
}

export interface KakaoLatLng {
  getLat(): number
  getLng(): number
}

export interface KakaoMapOptions {
  center: any
  level: number
}

export interface PlaceData {
  place_name: string
  address_name: string
  category_name: string
  phone: string
  x: string
  y: string
  distance?: string
}
