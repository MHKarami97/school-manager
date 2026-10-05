import { defineStore } from 'pinia'
import type { Invitation } from '../types'
import { getAllInvitations, putInvitation, deleteInvitation } from '../db/db'

interface InvitationsState {
  items: Invitation[]
  isLoaded: boolean
}

export const useInvitationsStore = defineStore('invitations', {
  state: (): InvitationsState => ({
    items: [],
    isLoaded: false,
  }),
  getters: {
    byId: (state) => (id: string) => state.items.find((i) => i.id === id),
  },
  actions: {
    async loadFromDb(): Promise<void> {
      if (this.isLoaded) return
      this.items = await getAllInvitations()
      this.isLoaded = true
    },
    async save(invitation: Invitation): Promise<void> {
      invitation.updatedAt = Date.now()
      const idx = this.items.findIndex((i) => i.id === invitation.id)
      if (idx >= 0) this.items[idx] = invitation
      else this.items.unshift(invitation)
      await putInvitation(invitation)
    },
    async duplicate(id: string): Promise<Invitation | null> {
      const source = this.items.find((i) => i.id === id)
      if (!source) return null
      const now = Date.now()
      const copy: Invitation = {
        ...(JSON.parse(JSON.stringify(source)) as Invitation),
        id: crypto.randomUUID(),
        title: `${source.title} (کپی)`,
        status: 'draft',
        sentDate: '',
        recipients: source.recipients.map((r) => ({
          ...r,
          id: crypto.randomUUID(),
          rsvp: 'pending' as const,
          guestsCount: 0,
          note: '',
        })),
        createdAt: now,
        updatedAt: now,
      }
      this.items.unshift(copy)
      await putInvitation(copy)
      return copy
    },
    async remove(id: string): Promise<void> {
      this.items = this.items.filter((i) => i.id !== id)
      await deleteInvitation(id)
    },
  },
})
