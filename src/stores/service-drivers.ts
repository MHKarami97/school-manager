import { defineStore } from 'pinia'
import { serviceRepository } from '@/db/service-db'
import { DEFAULT_VEHICLE_KIND } from '@/config/service.config'
import type { ServiceDriver } from '@/types'
import { capacityOf, defaultLayoutFor, ServiceDomainError, validateDriver } from '@/utils/service-domain'

interface DriversState {
  items: ServiceDriver[]
  isLoaded: boolean
}

export function createEmptyDriver(): ServiceDriver {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    fullName: '',
    gender: 'male',
    phone: '',
    vehicleKind: DEFAULT_VEHICLE_KIND,
    vehicleModel: '',
    vehicleYear: null,
    vehicleColor: '',
    plate: '',
    seatLayout: defaultLayoutFor(DEFAULT_VEHICLE_KIND),
    coverageRegions: [],
    baseLocation: null,
    note: '',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }
}

export const useServiceDriversStore = defineStore('serviceDrivers', {
  state: (): DriversState => ({ items: [], isLoaded: false }),
  getters: {
    byId: (state) => (id: string) => state.items.find((item) => item.id === id),
    activeDrivers: (state) => state.items.filter((item) => item.isActive),
    totalCapacity(): number {
      return this.activeDrivers.reduce((sum, item) => sum + capacityOf(item.seatLayout), 0)
    },
  },
  actions: {
    async loadFromDb(): Promise<void> {
      if (this.isLoaded) return
      this.items = await serviceRepository.listDrivers()
      this.isLoaded = true
    },

    async save(driver: ServiceDriver): Promise<void> {
      const problem = validateDriver(driver)
      if (problem) throw new ServiceDomainError('BAD_DRIVER', problem)
      const next: ServiceDriver = {
        ...driver,
        fullName: driver.fullName.trim(),
        plate: driver.plate.trim(),
        vehicleModel: driver.vehicleModel.trim(),
        vehicleColor: driver.vehicleColor.trim(),
        note: driver.note.trim(),
        coverageRegions: driver.coverageRegions.map((region) => region.trim()).filter(Boolean),
        updatedAt: Date.now(),
      }
      await serviceRepository.putDriver(next)
      const index = this.items.findIndex((item) => item.id === next.id)
      if (index >= 0) this.items[index] = next
      else this.items.push(next)
      this.items.sort((a, b) => a.fullName.localeCompare(b.fullName, 'fa'))
    },

    async remove(id: string): Promise<void> {
      if ((await serviceRepository.countAssignmentsOfDriver(id)) > 0) {
        throw new ServiceDomainError('DRIVER_IN_USE', 'این راننده در یک طرح سرویس دانش‌آموز دارد؛ به‌جای حذف، او را غیرفعال کنید.')
      }
      await serviceRepository.deleteDriver(id)
      this.items = this.items.filter((item) => item.id !== id)
    },
  },
})
