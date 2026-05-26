export type UserRole = 'customer' | 'factory' | 'admin'

export type FactoryStatus = 'pending' | 'active' | 'rejected' | 'suspended'

export type QuoteRequestStatus =
  | 'submitted'
  | 'reviewing'
  | 'matching'
  | 'quote_arrived'
  | 'negotiating'
  | 'contracted'
  | 'in_progress'
  | 'completed'

export type FactoryQuoteStatus = 'draft' | 'submitted' | 'accepted' | 'rejected'

export type MatchStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled'

export type ChatRoomType = 'customer_sofit' | 'factory_sofit'

export type FileType = 'image' | 'document' | 'sample'

export type PortfolioCategory = 'sofa' | 'builtin' | 'other'

export type NotificationType =
  | 'new_request'
  | 'new_match'
  | 'quote_arrived'
  | 'new_message'
  | 'status_changed'
  | 'factory_approved'
  | 'factory_rejected'

// ─── 테이블 타입 ───────────────────────────────────────────

export interface User {
  id: string
  email: string | null
  name: string | null
  phone: string | null
  role: UserRole
  created_at: string
}

export interface Customer {
  id: string
  user_id: string
  kakao_id: string | null
  created_at: string
}

export interface Factory {
  id: string
  user_id: string
  company_name: string
  biz_reg_url: string | null
  location: string | null
  description: string | null
  status: FactoryStatus
  rating_avg: number
  created_at: string
}

export interface FactoryPortfolio {
  id: string
  factory_id: string
  image_url: string
  description: string | null
  category: PortfolioCategory | null
  completed_at: string | null
  created_at: string
}

export interface QuoteRequest {
  id: string
  customer_id: string

  // 현장 정보 (필수)
  company_name: string
  contact: string
  site_name: string
  address: string
  site_manager: string
  available_time: string

  // 현장 정보 (선택)
  business_type: string | null
  has_parking: boolean | null
  floor: number | null
  has_elevator: boolean | null

  // 제품 정보 (선택)
  sofa_type: string | null
  sofa_count: number | null
  seat_count: number | null
  backrest_height: string | null
  has_armrest: boolean | null
  cushion_type: string | null
  frame_structure: string | null
  flame_retardant: boolean | null
  waterproof: boolean | null

  // 규격 (선택)
  total_length: number | null
  total_width: number | null
  total_height: number | null
  seat_height: number | null
  seat_depth: number | null
  wall_length: number | null
  corner_angle: number | null

  // 자재 (선택)
  fabric_type: string | null
  inner_material: string | null
  frame_material: string | null
  color_code: string | null

  // 공정·설치·일정 (선택)
  needs_measurement: boolean | null
  install_hours: number | null
  measurement_date: string | null
  production_start: string | null
  production_end: string | null
  delivery_date: string | null
  install_date: string | null
  as_available_date: string | null

  // 상태
  status: QuoteRequestStatus
  admin_note: string | null
  created_at: string
  updated_at: string
}

export interface RequestFile {
  id: string
  request_id: string
  file_type: FileType
  file_url: string
  file_name: string | null
  file_size: number | null
  created_at: string
}

export interface Match {
  id: string
  request_id: string
  factory_id: string
  status: MatchStatus
  note: string | null
  created_at: string
}

export interface FactoryQuote {
  id: string
  match_id: string
  material_cost: number
  labor_cost: number
  delivery_cost: number
  install_cost: number
  demolition_cost: number
  extra_cost: number
  margin: number
  total_cost: number
  delivery_days: number | null
  version: number
  note: string | null
  status: FactoryQuoteStatus
  created_at: string
}

export interface ChatRoom {
  id: string
  request_id: string
  match_id: string | null
  type: ChatRoomType
  created_at: string
}

export interface ChatMessage {
  id: string
  room_id: string
  sender_id: string
  content: string | null
  file_url: string | null
  file_name: string | null
  read_at: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  read_at: string | null
  created_at: string
}

export interface StatusLog {
  id: string
  request_id: string
  from_status: QuoteRequestStatus | null
  to_status: QuoteRequestStatus
  changed_by: string
  note: string | null
  created_at: string
}

// ─── 조인 타입 (편의용) ────────────────────────────────────

export interface QuoteRequestWithFiles extends QuoteRequest {
  request_files: RequestFile[]
}

export interface QuoteRequestWithLogs extends QuoteRequest {
  status_logs: StatusLog[]
}

export interface MatchWithQuote extends Match {
  factory_quotes: FactoryQuote[]
  factories: Factory
}

export interface ChatMessageWithSender extends ChatMessage {
  users: Pick<User, 'id' | 'name' | 'role'>
}

export interface FactoryPortfolioWithFactory extends FactoryPortfolio {
  factories: Pick<Factory, 'id' | 'company_name' | 'location'>
}
