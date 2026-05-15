export interface User {
  id: number | string
  email: string
  name: string
  role: 'learner' | 'trainer' | 'admin'
  createdAt: string
}
