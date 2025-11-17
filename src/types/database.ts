/**
 * Database types for Supabase
 * Based on the EduSync database schema
 * 
 * Tables:
 * - profiles
 * - classes
 * - enrollments
 * - enrollment_requests
 * - class_sessions
 * - attendance
 * - quizzes
 * - quiz_questions
 * - quiz_options
 * - quiz_attempts
 * - quiz_answers
 * - quiz_retake_requests
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          phone: string | null
          parent_phone_number: string | null
          role: 'admin' | 'student' | 'instructor'
          profile_picture_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          parent_phone_number?: string | null
          role?: 'admin' | 'student' | 'instructor'
          profile_picture_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          parent_phone_number?: string | null
          role?: 'admin' | 'student' | 'instructor'
          profile_picture_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          name: string
          description: string | null
          teacher_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          teacher_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          teacher_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          class_id: string
          user_id: string
          enrolled_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          class_id: string
          user_id: string
          enrolled_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          user_id?: string
          enrolled_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      enrollment_requests: {
        Row: {
          id: string
          class_id: string
          user_id: string
          status: 'pending' | 'approved' | 'rejected'
          notes: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          class_id: string
          user_id: string
          status?: 'pending' | 'approved' | 'rejected'
          notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          user_id?: string
          status?: 'pending' | 'approved' | 'rejected'
          notes?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      class_sessions: {
        Row: {
          id: string
          class_id: string
          title: string
          description: string | null
          session_date: string
          starts_at: string | null
          ends_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          class_id: string
          title: string
          description?: string | null
          session_date: string
          starts_at?: string | null
          ends_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          title?: string
          description?: string | null
          session_date?: string
          starts_at?: string | null
          ends_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          session_id: string
          student_id: string
          status: 'present' | 'absent' | 'late'
          marked_at: string
          marked_by: string | null
          notes: string | null
          quiz_grade: number | null
        }
        Insert: {
          id?: string
          session_id: string
          student_id: string
          status: 'present' | 'absent' | 'late'
          marked_at?: string
          marked_by?: string | null
          notes?: string | null
          quiz_grade?: number | null
        }
        Update: {
          id?: string
          session_id?: string
          student_id?: string
          status?: 'present' | 'absent' | 'late'
          marked_at?: string
          marked_by?: string | null
          notes?: string | null
          quiz_grade?: number | null
        }
      }
      quizzes: {
        Row: {
          id: string
          session_id: string
          title: string
          description: string | null
          time_limit: number | null
          passing_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          title: string
          description?: string | null
          time_limit?: number | null
          passing_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          title?: string
          description?: string | null
          time_limit?: number | null
          passing_score?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      quiz_questions: {
        Row: {
          id: string
          quiz_id: string
          question_text: string
          question_type: 'multiple_choice' | 'true_false' | 'short_answer'
          points: number
          order_number: number
          created_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          question_text: string
          question_type: 'multiple_choice' | 'true_false' | 'short_answer'
          points?: number
          order_number: number
          created_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          question_text?: string
          question_type?: 'multiple_choice' | 'true_false' | 'short_answer'
          points?: number
          order_number?: number
          created_at?: string
        }
      }
      quiz_options: {
        Row: {
          id: string
          question_id: string
          option_text: string
          is_correct: boolean
          order_number: number
        }
        Insert: {
          id?: string
          question_id: string
          option_text: string
          is_correct?: boolean
          order_number: number
        }
        Update: {
          id?: string
          question_id?: string
          option_text?: string
          is_correct?: boolean
          order_number?: number
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          quiz_id: string
          student_id: string
          score: number | null
          started_at: string
          submitted_at: string | null
        }
        Insert: {
          id?: string
          quiz_id: string
          student_id: string
          score?: number | null
          started_at?: string
          submitted_at?: string | null
        }
        Update: {
          id?: string
          quiz_id?: string
          student_id?: string
          score?: number | null
          started_at?: string
          submitted_at?: string | null
        }
      }
      quiz_answers: {
        Row: {
          id: string
          attempt_id: string
          question_id: string
          selected_option_id: string | null
          answer_text: string | null
          is_correct: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          attempt_id: string
          question_id: string
          selected_option_id?: string | null
          answer_text?: string | null
          is_correct?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          attempt_id?: string
          question_id?: string
          selected_option_id?: string | null
          answer_text?: string | null
          is_correct?: boolean | null
          created_at?: string
        }
      }
      quiz_retake_requests: {
        Row: {
          id: string
          attempt_id: string
          student_id: string
          reason: string
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          attempt_id: string
          student_id: string
          reason: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          attempt_id?: string
          student_id?: string
          reason?: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'student' | 'instructor'
      enrollment_request_status: 'pending' | 'approved' | 'rejected'
      attendance_status: 'present' | 'absent' | 'late'
      question_type: 'multiple_choice' | 'true_false' | 'short_answer'
      quiz_attempt_status: 'in_progress' | 'submitted' | 'graded'
      request_status: 'pending' | 'approved' | 'rejected'
    }
  }
}

