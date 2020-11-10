import { writable } from "svelte/store";

export const isOpen = writable(true)
export const previewIsOpen = writable(true)
export const width = writable(250)
export const activeTab = writable({ index: 0, name: 'project'  })