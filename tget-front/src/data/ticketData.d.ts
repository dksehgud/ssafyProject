export interface TicketData {
    performanceId: string
    title: string
    dateStart: string
    dateEnd: string
    facilityName: string
    cast: string[]
    crew: string[]
    runtime: string
    ageLimit: string
    productionCompany: string
    ticketPrice: string
    poster: string
    description: string
    area: string
    genre: string
    openRun: boolean
    visitForeign: boolean
    isForChild: boolean
    isDaehakro: boolean
    isFestival: boolean
    state: string
    lastUpdated: string
    introImages: string[]
    schedule: string
    category: string
    latitude?: number
    longitude?: number
}

export declare const ticketData: TicketData[]
